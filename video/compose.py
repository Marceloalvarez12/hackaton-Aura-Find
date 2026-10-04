"""Ensambla los videos finales: video grabado + narración (es-AR) + subtítulos en inglés.

Uso: python video/compose.py demo|pitch
Entrada: video/out/raw/<name>.webm, video/out/<name>-timings.json, video/out/audio/*.mp3
Salida:  video/out/final/aura-fint-<name>.mp4 (subs quemados) + aura-fint-<name>.en.srt
"""
import json
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).parent
OUT = HERE / "out"
FINAL = OUT / "final"
MAX_CHARS = 110  # ~2 líneas de subtítulo


def chunks(text: str) -> list[str]:
    """Parte el texto en frases y las agrupa en bloques legibles."""
    sentences = re.split(r"(?<=[.!?:])\s+", text.strip())
    out: list[str] = []
    for s in sentences:
        words, cur = s.split(), ""
        for w in words:
            if len(cur) + len(w) + 1 > MAX_CHARS and cur:
                out.append(cur)
                cur = w
            else:
                cur = f"{cur} {w}".strip()
        if cur:
            out.append(cur)
    return out


def ts(t: float) -> str:
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def wrap(line: str) -> str:
    if len(line) <= MAX_CHARS // 2:
        return line
    mid = len(line) // 2
    cut = min((i for i, c in enumerate(line) if c == " "), key=lambda i: abs(i - mid))
    return line[:cut] + "\n" + line[cut + 1 :]


def main(name: str) -> None:
    script = json.loads((HERE / "script.json").read_text(encoding="utf-8"))
    durations = json.loads((OUT / "audio" / "durations.json").read_text())
    timings = json.loads((OUT / f"{name}-timings.json").read_text())
    section = {s["id"]: s for s in script[name]}
    FINAL.mkdir(parents=True, exist_ok=True)

    # Subtítulos: cada bloque dura proporcional a su largo dentro de la narración.
    srt, n = [], 1
    for t in timings["timings"]:
        start, dur = t["start"], durations[t["id"]]
        parts = chunks(section[t["id"]]["en"])
        total = sum(len(p) for p in parts)
        cur = start
        for p in parts:
            d = dur * len(p) / total
            srt.append(f"{n}\n{ts(cur)} --> {ts(cur + d - 0.05)}\n{wrap(p)}\n")
            cur += d
            n += 1
    srt_name = f"aura-fint-{name}.en.srt"
    (FINAL / srt_name).write_text("\n".join(srt), encoding="utf-8")

    # Audio: cada mp3 posicionado en el inicio de su escena.
    # Rutas relativas a OUT (cwd): el filtro subtitles no tolera rutas Windows con ':' y espacios.
    inputs, filters = ["-i", f"raw/{name}.webm"], []
    for i, t in enumerate(timings["timings"], start=1):
        inputs += ["-i", f"audio/{t['id']}.mp3"]
        delay = int(t["start"] * 1000)
        filters.append(f"[{i}:a]adelay={delay}|{delay}[a{i}]")
    k = len(timings["timings"])
    mix = "".join(f"[a{i}]" for i in range(1, k + 1))
    filters.append(f"{mix}amix=inputs={k}:normalize=0,loudnorm=I=-16:TP=-1.5[aout]")
    style = (
        "FontName=Segoe UI,FontSize=11,PrimaryColour=&H00FFFFFF,OutlineColour=&H80000000,"
        "BackColour=&H99000000,BorderStyle=4,Outline=0,Shadow=0,MarginV=12,Bold=0"
    )
    filters.append(
        f"[0:v]scale=1920:1080:flags=lanczos,fps=30,subtitles=final/{srt_name}:force_style='{style}'[vout]"
    )
    mp4 = f"final/aura-fint-{name}.mp4"
    cmd = [
        "ffmpeg", "-v", "error", "-y", *inputs,
        "-filter_complex", ";".join(filters),
        "-map", "[vout]", "-map", "[aout]",
        "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-t", str(timings["end"]), "-movflags", "+faststart",
        mp4,
    ]
    subprocess.run(cmd, cwd=OUT, check=True)
    print(f"ok: {OUT / mp4}  ({n - 1} subtítulos)")


main(sys.argv[1] if len(sys.argv) > 1 else "demo")
