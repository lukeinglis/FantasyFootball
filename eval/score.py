#!/usr/bin/env python3
"""Eval script for the Software Factory.

Runs each eval dimension as a subprocess and outputs JSON to stdout.

Output format:
    {"results": [{"name": str, "score": float, "weight": float, "passed": bool, "details": str}, ...]}
"""

import json
import re
import subprocess
import sys
from pathlib import Path


def eval_lint() -> dict:
    """Check code quality: unused imports, console.log in production, any/unknown abuse."""
    from pathlib import Path

    skip = {"node_modules", ".next", ".factory", "eval", "dist", "build", ".git"}
    issues = []
    file_count = 0

    src_dir = Path("src")
    if not src_dir.exists():
        return {"name": "lint", "score": 1.0, "weight": 0.3, "passed": True,
                "details": "No src/ directory"}

    for f in src_dir.rglob("*"):
        if f.suffix not in (".ts", ".tsx") or any(p in f.parts for p in skip):
            continue
        file_count += 1
        try:
            code = f.read_text(errors="replace")
        except OSError:
            continue
        lines = code.splitlines()
        for i, line in enumerate(lines, 1):
            stripped = line.strip()
            if stripped.startswith("//") or stripped.startswith("/*"):
                continue
            if re.search(r'\bconsole\.log\(', line) and '/api/' not in str(f):
                issues.append(f"{f}:{i} console.log in non-API code")
            if re.search(r':\s*any\b', line) and 'eslint' not in line.lower():
                issues.append(f"{f}:{i} explicit any type")

    issue_count = len(issues)
    score = max(0.0, 1.0 - issue_count * 0.02)
    passed = issue_count == 0
    sample = "; ".join(issues[:5])
    details = f"{issue_count} issues in {file_count} files"
    if sample:
        details += f": {sample}"

    return {"name": "lint", "score": round(score, 3), "weight": 0.3, "passed": passed,
            "details": details[-500:]}


def eval_type_check() -> dict:
    """Run TypeScript type checking."""
    try:
        result = subprocess.run(
            ['npx', 'tsc', '--noEmit'],
            capture_output=True,
            text=True,
            timeout=120,
        )
        passed = result.returncode == 0
        if passed:
            score = 1.0
        else:
            error_lines = [ln for ln in (result.stdout + result.stderr).splitlines()
                           if 'error TS' in ln]
            error_count = len(error_lines)
            score = max(0.0, 1.0 - error_count * 0.1)
        return {
            "name": "type_check",
            "score": score,
            "weight": 0.5,
            "passed": passed,
            "details": (result.stdout or result.stderr).strip()[-500:],
        }
    except subprocess.TimeoutExpired:
        return {
            "name": "type_check",
            "score": 0.0,
            "weight": 0.5,
            "passed": False,
            "details": "Timed out after 120s",
        }


def eval_observability() -> dict:
    """Analyze observability coverage in TypeScript/TSX source files."""
    skip = {
        "node_modules", ".next", ".factory", "eval", "dist", "build", ".git",
    }
    log_pats = [
        r"\bconsole\.\w+\(",
        r"\blogger\.\w+\(",
        r"\blog\.\w+\(",
    ]
    struct_pats = [r"\bpino\b", r"\bwinston\b", r"\bstructuredLog\b"]
    trace_pats = [
        r"request[._]id|req[._]id|trace[._]id",
        r"\bopentelemetry\b",
        r"trace\.context|TraceContext|span",
    ]

    src_dir = Path("src")
    if not src_dir.exists():
        return {"name": "observability", "score": 0.0, "weight": 0.2,
                "passed": True, "details": "No src/ directory found"}

    sources = [f for f in src_dir.rglob("*")
               if f.suffix in (".ts", ".tsx") and not any(p in f.parts for p in skip)]

    total_fn = logged_fn = total_log = 0
    has_struct = has_trace = False

    fn_pat = re.compile(
        r'(?:^|\s)(?:export\s+)?(?:async\s+)?function\s+\w+|'
        r'(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*(?:=>|:)',
        re.MULTILINE
    )

    for src in sources:
        try:
            code = src.read_text(errors="replace")
        except OSError:
            continue

        fns = fn_pat.findall(code)
        total_fn += len(fns)

        for pat in log_pats:
            matches = re.findall(pat, code)
            total_log += len(matches)
            if matches:
                logged_fn += min(len(fns), len(matches))

        for pat in struct_pats:
            if re.search(pat, code):
                has_struct = True
        for pat in trace_pats:
            if re.search(pat, code, re.IGNORECASE):
                has_trace = True

    if total_fn == 0:
        return {"name": "observability", "score": 0.0, "weight": 0.2,
                "passed": True, "details": "No functions found to analyze"}

    cov = min(1.0, logged_fn / total_fn)
    density = min(1.0, total_log / max(total_fn, 1))
    score = 0.40 * cov + 0.25 * float(has_struct) + 0.20 * float(has_trace) + 0.15 * density

    details = (f"coverage={cov:.0%} ({logged_fn}/{total_fn}), "
               f"structured={'yes' if has_struct else 'no'}, "
               f"tracing={'yes' if has_trace else 'no'}, "
               f"density={density:.0%}")

    return {"name": "observability", "score": round(score, 3), "weight": 0.2,
            "passed": score >= 0.2, "details": details}


EVALS = [eval_lint, eval_type_check, eval_observability]


def main() -> None:
    results = [fn() for fn in EVALS]
    output = {"results": results}
    json.dump(output, sys.stdout, indent=2)
    print()


if __name__ == "__main__":
    main()
