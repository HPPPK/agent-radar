#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED_DIRS = {".git", "node_modules", "dist", "coverage", "__pycache__"}
REQUIRED_FILES = {
    "LICENSE", "NOTICE", "README.md", "PRIVACY.md", "TERMS.md", "SECURITY.md",
    "THIRD_PARTY_NOTICES.md", "docs/DATA-SOURCE-POLICY.md", "docs/EMAIL-SUBSCRIPTION-DESIGN.md",
}
DISALLOWED_NAMES = {".env", "id_rsa", "id_ed25519", "qq-smtp-password.dpapi"}
DISALLOWED_SUFFIXES = {".pem", ".p12", ".pfx"}
SECRET_PATTERNS = {
    "private_key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "openai_key": re.compile(r"\bsk-[A-Za-z0-9_-]{20,}\b"),
    "github_token": re.compile(r"\bgh(?:p|o|u|s|r)_[A-Za-z0-9_]{20,}\b"),
    "aws_access_key": re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    "bearer_token": re.compile(r"Bearer\s+[A-Za-z0-9._~-]{32,}"),
}
PLACEHOLDER_MARKERS = ("replace-with", "example", "your_", "your-", "test-secret", "local-development", "openssl rand")


def iter_files():
    for path in ROOT.rglob("*"):
        if not path.is_file() or any(part in EXCLUDED_DIRS for part in path.relative_to(ROOT).parts):
            continue
        yield path


def scan_text(path: Path, findings: list[dict[str, str]]) -> None:
    try:
        text = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        return
    relative = path.relative_to(ROOT).as_posix()
    for name, pattern in SECRET_PATTERNS.items():
        if pattern.search(text):
            findings.append({"type": name, "file": relative})
    for line_number, line in enumerate(text.splitlines(), 1):
        if re.search(r"(?:ADMIN_API_KEY|SMTP_PASSWORD|SMTP_AUTH_CODE|SECRET_KEY)\s*=", line, re.I):
            lowered = line.lower()
            value = line.split("=", 1)[-1].strip().strip('"').strip("'")
            if value and not any(marker in lowered for marker in PLACEHOLDER_MARKERS) and not value.startswith("$" + "{"):
                findings.append({"type": "non_placeholder_secret_assignment", "file": relative, "line": str(line_number)})


def check_digest(findings: list[dict[str, str]]) -> None:
    for path in sorted((ROOT / "server" / "data").glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8-sig"))
        required_root = {"generated_at", "content_notice", "ai_assisted", "human_reviewed", "review_status", "source_policy"}
        missing = sorted(required_root - data.keys())
        if missing:
            findings.append({"type": "missing_digest_provenance", "file": path.relative_to(ROOT).as_posix(), "detail": ",".join(missing)})
        for group, url_field in (("agent_updates", "source_url"), ("github_items", "url")):
            for index, item in enumerate(data.get(group, [])):
                required = {url_field, "source_type", "source_checked_at", "source_check_status", "ai_assisted", "human_reviewed"}
                absent = sorted(required - item.keys())
                if absent:
                    findings.append({"type": "missing_item_provenance", "file": path.relative_to(ROOT).as_posix(), "detail": f"{group}[{index}]:{','.join(absent)}"})


def check_archives(findings: list[dict[str, str]]) -> None:
    for archive in ROOT.parent.parent.parent.glob("outputs/agent-radar-plugin-*.zip"):
        try:
            with zipfile.ZipFile(archive) as bundle:
                for name in bundle.namelist():
                    parts = Path(name).parts
                    if any(part in EXCLUDED_DIRS or part in DISALLOWED_NAMES for part in parts):
                        findings.append({"type": "disallowed_archive_entry", "file": str(archive), "detail": name})
        except zipfile.BadZipFile:
            findings.append({"type": "bad_zip", "file": str(archive)})


def main() -> int:
    findings: list[dict[str, str]] = []
    for required in sorted(REQUIRED_FILES):
        if not (ROOT / required).is_file():
            findings.append({"type": "missing_required_file", "file": required})
    for path in iter_files():
        if path.name in DISALLOWED_NAMES or path.suffix.lower() in DISALLOWED_SUFFIXES:
            findings.append({"type": "disallowed_file", "file": path.relative_to(ROOT).as_posix()})
        scan_text(path, findings)
    manifest = json.loads((ROOT / ".codex-plugin" / "plugin.json").read_text(encoding="utf-8"))
    if manifest.get("license") != "Apache-2.0":
        findings.append({"type": "manifest_license_mismatch", "file": ".codex-plugin/plugin.json"})
    check_digest(findings)
    check_archives(findings)
    result = {"ok": not findings, "root": str(ROOT), "files_scanned": sum(1 for _ in iter_files()), "findings": findings}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if not findings else 1


if __name__ == "__main__":
    raise SystemExit(main())
