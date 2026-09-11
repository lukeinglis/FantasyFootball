import { NextResponse } from "next/server";
import { getValidToken } from "@/lib/yahoo/auth";
import logger from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/diag/yahoo
 *
 * Temporary. Every Yahoo Fantasy call is coming back 403 with "This
 * application is not authorized to perform this action" while the stored token
 * is present and unexpired. Two different faults produce that: the token is
 * fine but carries no fantasy scope, or the token is not really being accepted
 * at all and Yahoo is just wording it badly.
 *
 * Those need opposite fixes, so this asks the same token four questions. The
 * openid userinfo endpoint needs only the scope every Yahoo token gets, so if
 * it answers, the token is live and the fantasy refusal is about permission.
 * If it refuses too, the token itself is the problem.
 *
 * Returns no token material and no profile values, only which claim names came
 * back, so this is safe to hit unauthenticated while it exists.
 */

const PROBES: { name: string; url: string; redactBody: boolean }[] = [
  {
    name: "openid-userinfo",
    url: "https://api.login.yahoo.com/openid/v1/userinfo",
    redactBody: true,
  },
  {
    name: "fantasy-game-nfl",
    url: "https://fantasysports.yahooapis.com/fantasy/v2/game/nfl?format=json",
    redactBody: false,
  },
  {
    name: "fantasy-my-games",
    url: "https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games?format=json",
    redactBody: false,
  },
  {
    name: "fantasy-league-2025",
    url: "https://fantasysports.yahooapis.com/fantasy/v2/league/461.l.655705/settings?format=json",
    redactBody: false,
  },
];

export async function GET() {
  logger.info({ route: "/api/diag/yahoo" }, "yahoo scope probe started");

  let token: string;
  try {
    token = await getValidToken();
  } catch (error) {
    return NextResponse.json(
      {
        tokenAvailable: false,
        reason: error instanceof Error ? error.message : "unknown",
      },
      { status: 200 }
    );
  }

  const results = [];

  for (const probe of PROBES) {
    try {
      const res = await fetch(probe.url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const raw = await res.text().catch(() => "");

      let body: string;
      if (probe.redactBody) {
        // Userinfo answers with the account's name and email. The only thing
        // worth knowing here is whether it answered at all, so keep the shape
        // and drop every value.
        try {
          body = `claims: ${Object.keys(JSON.parse(raw)).sort().join(", ")}`;
        } catch {
          body = raw.slice(0, 200);
        }
      } else {
        body = raw.slice(0, 400);
      }

      results.push({
        probe: probe.name,
        status: res.status,
        ok: res.ok,
        wwwAuthenticate: res.headers.get("www-authenticate") ?? null,
        body,
      });
    } catch (error) {
      results.push({
        probe: probe.name,
        status: 0,
        ok: false,
        wwwAuthenticate: null,
        body: error instanceof Error ? error.message : "threw",
      });
    }
  }

  const identityOk = results.find((r) => r.probe === "openid-userinfo")?.ok;
  const fantasyOk = results.some((r) => r.probe.startsWith("fantasy-") && r.ok);

  // Say what the combination means rather than leaving four status codes to be
  // read by hand, because the interesting case is the disagreement between them.
  let verdict: string;
  if (identityOk && fantasyOk) {
    verdict = "Token works everywhere. The failure is elsewhere.";
  } else if (identityOk && !fantasyOk) {
    verdict =
      "Yahoo accepts this token for identity but refuses it for fantasy. The grant has no Fantasy Sports scope, so re-consent or a new app is needed. Re-issuing the token will not help.";
  } else if (!identityOk && !fantasyOk) {
    verdict =
      "Yahoo refuses this token everywhere, so the problem is the token or the client credentials, not the fantasy permission.";
  } else {
    verdict = "Fantasy works but identity does not, which is unexpected.";
  }

  logger.info({ route: "/api/diag/yahoo", identityOk, fantasyOk }, "yahoo scope probe complete");

  return NextResponse.json({ tokenAvailable: true, verdict, results });
}
