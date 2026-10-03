from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "reports" / "truck-chotot-slot-v01"


def compose(name: str, source_path: Path, implementation_path: Path, target_width: int) -> None:
    source = Image.open(source_path).convert("RGB")
    implementation = Image.open(implementation_path).convert("RGB")
    source = source.resize((target_width, round(source.height * target_width / source.width)), Image.Resampling.LANCZOS)
    if implementation.width != target_width:
        implementation = implementation.resize(
            (target_width, round(implementation.height * target_width / implementation.width)),
            Image.Resampling.LANCZOS,
        )
    header = 30
    panel_height = max(source.height, implementation.height)
    canvas = Image.new("RGB", (target_width * 2, panel_height + header), "white")
    draw = ImageDraw.Draw(canvas)
    draw.text((12, 8), "CHOTOT REFERENCE", fill="#222222")
    draw.text((target_width + 12, 8), "BOBAEDREAM TRUCK V01", fill="#222222")
    canvas.paste(source, (0, header + (panel_height - source.height) // 2))
    canvas.paste(implementation, (target_width, header + (panel_height - implementation.height) // 2))
    canvas.save(OUT / f"comparison-{name}.png")


compose(
    "mobile-brand",
    ROOT / "reports" / "qf-100" / "chotot-m-393-brand-row.png",
    OUT / "implementation-mobile-brand-row.png",
    390,
)
compose(
    "pc-brand",
    ROOT / "reports" / "qf-100" / "chotot-pc-1440-brand-row.png",
    OUT / "implementation-pc-brand-row.png",
    1200,
)

