#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import zipfile
from pathlib import Path

EXCLUDED_PARTS = {"node_modules", "dist", ".env", "__pycache__", ".pytest_cache", ".git"}


def main() -> int:
    parser = argparse.ArgumentParser(description="Build an uploadable Agent Radar plugin ZIP")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[1]
    manifest = json.loads((root / ".codex-plugin" / "plugin.json").read_text(encoding="utf-8"))
    output = args.output or root.parent.parent.parent / "outputs" / f"agent-radar-plugin-{manifest['version']}.zip"
    output.parent.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(root.rglob("*")):
            if not path.is_file() or any(part in EXCLUDED_PARTS for part in path.parts):
                continue
            if path == output:
                continue
            archive.write(path, path.relative_to(root).as_posix())

    size_mb = output.stat().st_size / (1024 * 1024)
    if size_mb >= 50:
        raise SystemExit(f"Plugin ZIP is too large: {size_mb:.2f} MB")
    print(json.dumps({"ok": True, "output": str(output), "size_mb": round(size_mb, 3)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
