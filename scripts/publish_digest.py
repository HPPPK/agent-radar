#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Publish one Agent Radar digest to a deployed server")
    parser.add_argument("digest", type=Path)
    parser.add_argument("--base-url", default=os.environ.get("AGENT_RADAR_BASE_URL", ""))
    parser.add_argument("--api-key", default=os.environ.get("AGENT_RADAR_ADMIN_API_KEY", ""))
    args = parser.parse_args()

    if not args.base_url.startswith("https://"):
        raise SystemExit("--base-url must be an HTTPS URL")
    if not args.api_key:
        raise SystemExit("Provide --api-key or AGENT_RADAR_ADMIN_API_KEY")

    payload = json.loads(args.digest.read_text(encoding="utf-8-sig"))
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        args.base_url.rstrip("/") + "/api/admin/digests",
        data=body,
        method="POST",
        headers={
            "Authorization": "Bearer " + args.api_key,
            "Content-Type": "application/json; charset=utf-8",
            "User-Agent": "agent-radar-publisher/0.1.1",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            print(response.read().decode("utf-8"))
            return 0
    except urllib.error.HTTPError as error:
        print(error.read().decode("utf-8", errors="replace"), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
