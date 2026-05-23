#!/usr/bin/env python3
"""Eval scorer for the FantasyFootball project."""

import json
import os
import re
import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(os.path.dirname(os.path.abspath(__file__))) / ".."


def run(cmd: list[str], cwd: str | None = None) -> subprocess.CompletedProcess:
    return subprocess.run(
        cmd,
        cwd=cwd or str(PROJECT_ROOT),
        capture_output=True,
        text=True,
        timeout=120,
    )


def type_check() -> dict:
    result = run(["npx", "tsc", "--noEmit"])
    passed = result.returncode == 0
    errors = len([l for l in result.stdout.splitlines() if ": error TS" in l]) if not passed else 0
    return {
        "name": "type_check",
        "score": 1.0 if passed else 0.0,
        "weight": 1.0,
        "passed": passed,
        "details": "clean" if passed else f"{errors} type errors",
    }


def lint() -> dict:
    src = PROJECT_ROOT / "src"
    console_logs = []
    any_annotations = []

    for f in src.rglob("*"):
        if not f.suffix in (".ts", ".tsx"):
            continue
        rel = str(f.relative_to(PROJECT_ROOT))
        if ".test." in rel or "/api/" in rel:
            continue
        try:
            content = f.read_text()
        except Exception:
            continue
        for i, line in enumerate(content.splitlines(), 1):
            if "console.log" in line:
                console_logs.append(f"{rel}:{i}")
            if re.search(r":\s*any\b|<any>|\bas\s+any\b", line):
                any_annotations.append(f"{rel}:{i}")

    issues = console_logs + any_annotations
    passed = len(issues) == 0
    return {
        "name": "lint",
        "score": 1.0 if passed else max(0.0, 1.0 - len(issues) * 0.1),
        "weight": 1.0,
        "passed": passed,
        "details": "clean" if passed else f"{len(console_logs)} console.log, {len(any_annotations)} explicit any",
    }


def tests() -> dict:
    vitest_config = any(
        (PROJECT_ROOT / name).exists()
        for name in ["vitest.config.ts", "vitest.config.js", "vitest.config.mts"]
    )
    test_files = list(PROJECT_ROOT.rglob("*.test.*"))
    count = len(test_files)
    score = min(1.0, count / 10.0) if vitest_config else min(0.5, count / 20.0)
    return {
        "name": "tests",
        "score": round(score, 2),
        "weight": 1.0,
        "passed": count > 0,
        "details": f"vitest={'yes' if vitest_config else 'no'}, {count} test files",
    }


def coverage() -> dict:
    pkg = PROJECT_ROOT / "package.json"
    has_coverage = False
    if pkg.exists():
        content = pkg.read_text()
        has_coverage = "@vitest/coverage-v8" in content
    return {
        "name": "coverage",
        "score": 1.0 if has_coverage else 0.0,
        "weight": 0.5,
        "passed": has_coverage,
        "details": "coverage-v8 detected" if has_coverage else "no coverage tooling",
    }


def observability() -> dict:
    src = PROJECT_ROOT / "src"
    logger_imports = 0
    log_statements = 0
    for f in src.rglob("*"):
        if not f.suffix in (".ts", ".tsx"):
            continue
        try:
            content = f.read_text()
        except Exception:
            continue
        for line in content.splitlines():
            if re.search(r"(import.*pino|import.*logger|require.*pino|require.*logger)", line):
                logger_imports += 1
            if re.search(r"logger\.(info|warn|error|debug|trace|fatal)\(", line):
                log_statements += 1
    total = logger_imports + log_statements
    score = min(1.0, total / 5.0)
    return {
        "name": "observability",
        "score": round(score, 2),
        "weight": 0.5,
        "passed": total > 0,
        "details": f"{logger_imports} logger imports, {log_statements} log statements",
    }


def capability_surface() -> dict:
    src = PROJECT_ROOT / "src"
    lib_dir = src / "lib"

    modules = list(lib_dir.rglob("*.ts")) + list(lib_dir.rglob("*.tsx")) if lib_dir.exists() else []

    exported_fns = 0
    for f in modules:
        try:
            content = f.read_text()
        except Exception:
            continue
        exported_fns += len(re.findall(r"export\s+(async\s+)?function\s+", content))
        exported_fns += len(re.findall(r"export\s+const\s+\w+\s*=", content))

    api_dir = src / "app" / "api"
    entry_points = list(api_dir.rglob("route.ts")) if api_dir.exists() else []

    return {
        "name": "capability_surface",
        "score": round(min(1.0, (len(modules) + len(entry_points)) / 20.0), 2),
        "weight": 1.0,
        "passed": len(modules) > 0 or len(entry_points) > 0,
        "details": f"{len(modules)} lib modules, {exported_fns} exports, {len(entry_points)} API routes",
    }


def main():
    results = [
        type_check(),
        lint(),
        tests(),
        coverage(),
        observability(),
        capability_surface(),
    ]
    total = sum(r["score"] * r["weight"] for r in results) / sum(r["weight"] for r in results)
    output = {"total": round(total, 4), "results": results}
    print(json.dumps(output, indent=2))
    return 0 if all(r["passed"] for r in results if r["weight"] >= 1.0) else 1


if __name__ == "__main__":
    sys.exit(main())
