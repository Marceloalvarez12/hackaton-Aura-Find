"""Genera la narración por segmento con edge-tts y mide duraciones con ffprobe.

Uso: video/.venv/Scripts/python video/tts.py
Salida: video/out/audio/<id>.mp3 + video/out/audio/durations.json
"""
import asyncio
import json
import subprocess
from pathlib import Path

import edge_tts

HERE = Path(__file__).parent
OUT = HERE / "out" / "audio"


def duration(path: Path) -> float:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(r.stdout.strip())


async def main() -> None:
    script = json.loads((HERE / "script.json").read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    durations: dict[str, float] = {}
    for section in ("pitch", "demo"):
        for seg in script[section]:
            path = OUT / f"{seg['id']}.mp3"
            await edge_tts.Communicate(seg["text"], script["voice"], rate=script["rate"]).save(str(path))
            durations[seg["id"]] = round(duration(path), 3)
            print(f"{seg['id']:<18} {durations[seg['id']]:6.2f}s")
    (OUT / "durations.json").write_text(json.dumps(durations, indent=2))
    for section in ("pitch", "demo"):
        total = sum(durations[s["id"]] for s in script[section])
        print(f"TOTAL {section}: {total:.1f}s")


asyncio.run(main())
