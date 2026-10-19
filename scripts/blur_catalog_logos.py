#!/usr/bin/env python3
"""Blur visible manufacturer badges in AutoFlip's local car photographs.

Coordinates are intentionally explicit: a broad automatic blur would damage the
cars and backgrounds.  Run from the repository root.  The script also rebuilds
the catalogue thumbnails from the edited originals.
"""

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


CAR_DIRS = (Path("cloudflare/app/assets/cars"), Path("assets/cars"))

# (centre x, centre y, radius x, radius y), measured on the pristine 640 px originals.
# Every point was re-audited against a coordinate grid on 2026-10-19.
MASKS = {
    "audi-a8-d4": [(582, 112, 15, 8)],
    "audi-a8-d5": [(76, 151, 18, 10)],
    "audi-q3-f3": [(61, 198, 18, 11)],
    "bmw-m3-f80": [(586, 211, 11, 11)],
    "bmw-m4-g82": [(541, 182, 12, 12)],
    "bmw-m5-f10": [(610, 166, 11, 11)],
    "bmw-x1-f48": [(565, 164, 11, 11)],
    "bmw-x3-g01": [(590, 145, 11, 11)],
    "bmw-x4-g02": [(62, 157, 11, 11)],
    "bmw-x6-g06": [(165, 181, 11, 11)],
    "bmw-x7-g07": [(78, 157, 11, 11)],
    "bmw-z4-e89": [(590, 165, 11, 11)],
    "chevrolet-aveo-t250": [(106, 269, 18, 10)],
    "chevrolet-aveo-t300": [(225, 239, 18, 10)],
    "chevrolet-camaro-2010": [(550, 242, 18, 10)],
    "chevrolet-captiva-first": [(511, 251, 18, 10)],
    "chevrolet-corvette-c7": [(322, 215, 20, 13)],
    "chevrolet-epica-v250": [(450, 279, 18, 10)],
    "chevrolet-niva": [(526, 250, 18, 10)],
    "chevrolet-orlando-first": [(516, 218, 18, 10)],
    "chevrolet-spark-m300": [(558, 244, 18, 10)],
    "fiat-bravo-type-198": [(558, 216, 13, 13)],
    "fiat-doblo-mk1": [(310, 246, 13, 13)],
    "fiat-linea": [(60, 262, 13, 13)],
    "fiat-punto-1993": [(103, 300, 7, 5)],
    "fiat-punto-1999": [(490, 250, 11, 11)],
    "ford-explorer-fifth": [(558, 200, 19, 10)],
    "ford-fiesta-mk6": [(559, 252, 18, 9)],
    "ford-kuga-second": [(590, 163, 18, 9)],
    "ford-mondeo-mkiii": [(518, 274, 18, 9)],
    "ford-mondeo-mkiv": [(568, 205, 18, 9)],
    "ford-mustang-vi": [(318, 178, 20, 11)],
    "ford-s-max-1st": [(516, 279, 18, 9)],
    "land-rover-discovery-4": [(463, 133, 66, 8)],
    "land-rover-discovery-5": [(126, 209, 18, 10), (101, 145, 61, 8)],
    "land-rover-freelander-2nd": [(146, 145, 18, 10)],
    "land-rover-range-rover-evoque-l551": [(493, 164, 66, 8)],
    "land-rover-range-rover-velar": [(528, 129, 66, 8)],
    "lexus-is-xe30": [(320, 215, 15, 13)],
    "lexus-ls-xf50": [(548, 238, 15, 13)],
    "lexus-nx-az20": [(505, 218, 58, 9)],
    "opel-antara": [(148, 279, 15, 14)],
    "opel-astra-h": [(532, 222, 15, 14)],
    "opel-corsa-c": [(431, 314, 12, 12)],
    "opel-corsa-d": [(87, 189, 15, 14)],
    "opel-meriva-a": [(66, 207, 15, 14)],
    "opel-mokka-a": [(84, 174, 15, 14)],
    "opel-vectra-b": [(320, 303, 15, 14)],
    "opel-vectra-c": [(126, 229, 15, 14)],
    "opel-zafira-b": [(556, 227, 15, 14)],
    "peugeot-207": [(146, 244, 15, 15)],
    "peugeot-3008-b": [(135, 217, 30, 7), (104, 241, 9, 15)],
    "peugeot-307-2005": [(74, 210, 15, 15)],
    "peugeot-308-a": [(548, 205, 15, 15)],
    "peugeot-407": [(115, 126, 15, 15)],
    "peugeot-508-ii": [(97, 250, 12, 19)],
    "porsche-taycan": [(320, 131, 13, 15)],
    "renault-arkana-b0": [(92, 315, 7, 8)],
    "renault-clio-ii": [(430, 310, 15, 17)],
    "renault-fluence": [(590, 162, 15, 17)],
    "renault-kaptur": [(393, 205, 24, 31)],
    "renault-koleos-ii": [(552, 190, 15, 17)],
    "renault-laguna-iii": [(570, 273, 15, 17)],
    "renault-megane-ii": [(570, 202, 15, 17)],
    "renault-megane-iii": [(129, 220, 15, 22)],
    "renault-sandero-ii": [(510, 174, 15, 17)],
    "renault-scenic-iii": [(114, 261, 15, 17)],
    "renault-symbol-i": [(96, 212, 12, 14)],
    "skoda-fabia-i": [(555, 195, 13, 13)],
    "skoda-fabia-ii": [(78, 178, 13, 13)],
    "skoda-karoq": [(580, 216, 13, 13)],
    "skoda-kodiaq-i": [(42, 195, 13, 13)],
    "skoda-octavia-i": [(84, 185, 13, 13)],
    "skoda-superb-ii": [(570, 178, 13, 13)],
    "skoda-superb-iii": [(80, 181, 13, 13)],
    "skoda-yeti": [(142, 270, 13, 13)],
    "suzuki-liana": [(58, 226, 13, 11)],
    "suzuki-splash": [(148, 302, 15, 13)],
    "suzuki-swift-2004": [(527, 198, 15, 13)],
    "suzuki-sx4-1st": [(540, 208, 15, 13)],
    "suzuki-vitara-4th": [(37, 205, 15, 13)],
    "toyota-alphard-ah30": [(86, 257, 15, 13)],
    "toyota-auris-e150": [(515, 155, 15, 13)],
    "toyota-fj-cruiser": [(145, 235, 40, 15)],
    "toyota-highlander-xu50": [(322, 230, 16, 14)],
    "toyota-land-cruiser-j100": [(92, 240, 15, 13)],
    "toyota-yaris": [(92, 237, 16, 14)],
    "volkswagen-bora-i": [(495, 177, 15, 15)],
    "volkswagen-golf-iv": [(508, 225, 15, 15)],
    "volkswagen-golf-vi": [(535, 166, 15, 15)],
    "volkswagen-golf-vii": [(129, 253, 15, 15)],
    "volkswagen-new-beetle": [(320, 244, 15, 15)],
    "volkswagen-passat-b5": [(128, 269, 15, 15)],
    "volkswagen-passat-b6": [(95, 165, 15, 15)],
    "volkswagen-passat-b8": [(142, 287, 15, 15)],
    "volkswagen-touareg-iii": [(108, 216, 15, 15)],
    "volkswagen-touran-ii": [(561, 210, 15, 15)],
    "volvo-s40-p1": [(113, 259, 16, 16)],
    "volvo-s60-2nd": [(110, 252, 16, 16)],
    "volvo-s90-spa": [(438, 235, 31, 30)],
    "volvo-xc70-p24": [(575, 258, 16, 16)],
    "volvo-xc90-spa": [(430, 300, 16, 16)],
}


def blur_regions(image: Image.Image, regions: list[tuple[int, int, int, int]]) -> Image.Image:
    source = image.convert("RGB")
    heavily_blurred = source.filter(ImageFilter.GaussianBlur(radius=10))
    mask = Image.new("L", source.size, 0)
    draw = ImageDraw.Draw(mask)
    for cx, cy, rx, ry in regions:
        draw.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=1))
    return Image.composite(heavily_blurred, source, mask)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source_dir", type=Path, help="directory containing pristine, unblurred WebP originals")
    args = parser.parse_args()
    photos = sorted(args.source_dir.glob("*.webp"))
    if not photos:
        raise SystemExit(f"No pristine WebP photographs found in {args.source_dir}")
    unknown = [photo.stem for photo in photos if photo.stem not in MASKS]
    for photo in photos:
        with Image.open(photo) as opened:
            opened.load()
            image = opened.convert("RGB")
        edited = blur_regions(image, MASKS.get(photo.stem, []))
        for car_dir in CAR_DIRS:
            destination = car_dir / photo.name
            temporary = destination.with_suffix(".tmp.webp")
            edited.save(temporary, "WEBP", quality=88, method=6)
            temporary.replace(destination)

            thumb = edited.copy()
            thumb.thumbnail((480, 320), Image.Resampling.LANCZOS)
            thumb_path = car_dir / "thumbs" / photo.name
            temporary_thumb = thumb_path.with_suffix(".tmp.webp")
            thumb.save(temporary_thumb, "WEBP", quality=84, method=6)
            temporary_thumb.replace(thumb_path)

    print(f"Processed {len(photos)} photographs; blurred {len(MASKS)} with visible marks.")
    if unknown:
        print("No visible manufacturer mark found in:")
        for name in unknown:
            print(f"  {name}")


if __name__ == "__main__":
    main()
