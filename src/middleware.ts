import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";

export function middleware(request: NextRequest) {
  const requestId = crypto.randomUUID();
  logger.info(
    { requestId, method: request.method, path: request.nextUrl.pathname },
    "request received",
  );
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
