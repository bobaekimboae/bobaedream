#!/usr/bin/env python3
"""공식 브랜드 사진으로 커뮤니티 자동차 게시판 배너를 만든다.

생성형 이미지는 사용하지 않는다. 공식 미디어센터의 원본 사진을 내려받아
1200x357 크기로 crop/resize하고 WEBP로 저장하는 작업만 수행한다.
출처와 이용 조건은 board-banner-source-manifest.json에 기록한다.
"""

from pathlib import Path
from urllib.request import Request, urlopen

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / ".cache" / "community-official-banners"
OUT = ROOT / "public" / "community" / "assets" / "board-banners"
SIZE = (1200, 357)

SOURCES = {
    "genesis-gv60": "https://www.genesis.com/content/dam/genesis-p2/kr/assets/genesis/roadtrip/roadtrip-overview/genesis-kr-roadtrip-overview-key-visual-yeosu-gv60-2560x900.jpg",
    "volkswagen-golf": "https://uploads.vw-mms.de/system/production/images/vwn/088/949/images/50d24a2cfdbf18c343243ddc055562fe63329932/DB2026AU01051_web_1600.jpg?1793366300=",
    "bmw-area-m": "https://mediapool.bmwgroup.com/download/edown/pressclub/publicq?actEvent=scaleBig&attachment=1&dokNo=P90629284&quality=90&square=0",
    "porsche-911-gt3": "https://porschepictures.flowcenter.de/pmdb/thumbnail.cgi?crop=1&cs=7b18b3fc1f0b2c0f&h=609&id=298388&public=1&w=1080",
    "aston-martin-db12": "https://media.astonmartin.com/wp-content/uploads/2024/10/fb82ab0c2df5b62e4b45317fadc3f8a0-l.jpg",
    "mercedes-glb-family": "https://img.youtube.com/vi/IasPbYdD0DY/maxresdefault.jpg",
}

# 게시판 → (원본, 가로 중심, 세로 중심)
BOARDS = {
    "home": ("genesis-gv60", .53, .52),
    "all": ("volkswagen-golf", .55, .59),
    "best": ("porsche-911-gt3", .56, .56),
    "free": ("mercedes-glb-family", .56, .48),
    "car-news": ("volkswagen-golf", .55, .58),
    "foreign-car-news": ("aston-martin-db12", .50, .58),
    "brand-car-info": ("volkswagen-golf", .55, .58),
    "vehicle-review": ("porsche-911-gt3", .58, .56),
    "tuhu-review": ("bmw-area-m", .55, .55),
    "fuel-economy": ("volkswagen-golf", .56, .59),
    "test-drive": ("bmw-area-m", .55, .55),
    "celebrity-car": ("aston-martin-db12", .50, .59),
    "domestic-car": ("genesis-gv60", .53, .52),
    "import-car": ("porsche-911-gt3", .58, .56),
    "bmw": ("bmw-area-m", .55, .55),
    "mercedes-benz": ("mercedes-glb-family", .56, .48),
    "my-car-photo": ("porsche-911-gt3", .58, .56),
    "scoop": ("aston-martin-db12", .50, .59),
    "car-media": ("porsche-911-gt3", .58, .56),
    "installation": ("bmw-area-m", .55, .55),
    "free-media": ("aston-martin-db12", .50, .58),
    "oldcar-memory": ("aston-martin-db12", .50, .58),
}


def download(name: str, url: str) -> Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    target = CACHE / f"{name}.jpg"
    if target.exists() and target.stat().st_size > 20_000:
        return target
    request = Request(url, headers={"User-Agent": "Mozilla/5.0 BobaedreamCommunity/1.0"})
    with urlopen(request, timeout=60) as response:
        target.write_bytes(response.read())
    return target


def crop(image: Image.Image, center_x: float, center_y: float) -> Image.Image:
    target_ratio = SIZE[0] / SIZE[1]
    source_ratio = image.width / image.height
    if source_ratio >= target_ratio:
        height = image.height
        width = round(height * target_ratio)
    else:
        width = image.width
        height = round(width / target_ratio)
    left = min(max(0, round(image.width * center_x - width / 2)), image.width - width)
    top = min(max(0, round(image.height * center_y - height / 2)), image.height - height)
    return image.crop((left, top, left + width, top + height)).resize(SIZE, Image.Resampling.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    files = {name: download(name, url) for name, url in SOURCES.items()}
    for board, (source, center_x, center_y) in BOARDS.items():
        with Image.open(files[source]) as image:
            result = crop(image.convert("RGB"), center_x, center_y)
            result.save(OUT / f"{board}.webp", "WEBP", quality=84, method=6)
        print(f"{board}.webp <- {source}")


if __name__ == "__main__":
    main()
