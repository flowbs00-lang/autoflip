#!/usr/bin/env python3
"""Blur visible manufacturer badges in AutoFlip's local car photographs.

Coordinates are intentionally explicit: a broad automatic blur would damage the
cars and backgrounds.  Run from the repository root.  The script also rebuilds
the catalogue thumbnails from the edited originals.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


CAR_DIR = Path("cloudflare/app/assets/cars")
THUMB_DIR = CAR_DIR / "thumbs"

# (centre x, centre y, radius x, radius y), measured on the 640 px originals.
MASKS = {
    "audi-a8-d4": [(586, 90, 25, 15)],
    "audi-a8-d5": [(76, 151, 27, 17)],
    "audi-q3-f3": [(61, 198, 27, 18)],
    "bmw-m3-f80": [(590, 206, 22, 22)],
    "bmw-m4-g82": [(50, 181, 22, 22)],
    "bmw-m5-f10": [(608, 168, 22, 22)],
    "bmw-x1-f48": [(565, 167, 22, 22)],
    "bmw-x3-g01": [(535, 160, 22, 22)],
    "bmw-x4-g02": [(61, 161, 22, 22)],
    "bmw-x6-g06": [(166, 178, 22, 22)],
    "bmw-x7-g07": [(115, 160, 22, 22)],
    "bmw-z4-e89": [(570, 176, 22, 22)],
    "chevrolet-aveo-t250": [(102, 268, 31, 20)],
    "chevrolet-aveo-t300": [(225, 239, 28, 18)],
    "chevrolet-camaro-2010": [(550, 242, 31, 20)],
    "chevrolet-captiva-first": [(505, 255, 31, 20)],
    "chevrolet-corvette-c7": [(312, 211, 30, 21)],
    "chevrolet-epica-v250": [(448, 271, 29, 19)],
    "chevrolet-niva": [(525, 246, 29, 19)],
    "chevrolet-orlando-first": [(486, 209, 31, 20)],
    "chevrolet-spark-m300": [(545, 240, 31, 20)],
    "fiat-bravo-type-198": [(542, 243, 25, 25)],
    "fiat-doblo-mk1": [(309, 218, 23, 23)],
    "fiat-linea": [(57, 260, 25, 25)],
    "fiat-punto-1993": [(90, 295, 22, 22)],
    "fiat-punto-1999": [(490, 245, 22, 22)],
    "ford-explorer-fifth": [(559, 210, 34, 20)],
    "ford-fiesta-mk6": [(560, 245, 31, 18)],
    "ford-kuga-second": [(587, 192, 34, 20)],
    "ford-mondeo-mkiii": [(515, 289, 31, 18)],
    "ford-mondeo-mkiv": [(566, 218, 34, 20)],
    "ford-mustang-vi": [(315, 141, 28, 21)],
    "ford-s-max-1st": [(516, 278, 31, 18)],
    "land-rover-discovery-4": [(485, 169, 37, 20), (458, 133, 95, 15)],
    "land-rover-discovery-5": [(150, 154, 37, 20), (101, 116, 95, 15)],
    "land-rover-freelander-2nd": [(99, 216, 37, 20)],
    "land-rover-range-rover-evoque-l551": [(558, 170, 98, 16)],
    "land-rover-range-rover-velar": [(522, 148, 98, 16)],
    "lexus-is-xe30": [(326, 214, 28, 24)],
    "lexus-ls-xf50": [(578, 278, 31, 27)],
    "lexus-nx-az20": [(562, 256, 31, 25), (500, 256, 38, 18)],
    "opel-antara": [(150, 280, 26, 24)],
    "opel-astra-h": [(532, 229, 30, 28)],
    "opel-corsa-d": [(107, 233, 30, 28)],
    "opel-meriva-a": [(90, 223, 30, 28)],
    "opel-mokka-a": [(95, 182, 30, 28)],
    "opel-vectra-b": [(320, 225, 30, 28)],
    "opel-vectra-c": [(122, 188, 26, 24)],
    "opel-zafira-b": [(553, 188, 26, 24)],
    "peugeot-207": [(154, 201, 29, 29)],
    "peugeot-3008-b": [(150, 205, 25, 25)],
    "peugeot-307-2005": [(65, 172, 25, 25)],
    "peugeot-308-a": [(540, 205, 25, 25)],
    "peugeot-407": [(92, 132, 25, 25)],
    "peugeot-508-ii": [(102, 203, 29, 29)],
    "porsche-taycan": [(320, 145, 25, 28)],
    "renault-clio-ii": [(512, 268, 29, 31)],
    "renault-fluence": [(527, 170, 25, 27)],
    "renault-kaptur": [(320, 210, 29, 31)],
    "renault-koleos-ii": [(550, 160, 25, 27)],
    "renault-laguna-iii": [(573, 165, 25, 27)],
    "renault-megane-ii": [(555, 165, 25, 27)],
    "renault-megane-iii": [(108, 176, 29, 31)],
    "renault-sandero-ii": [(508, 223, 25, 27)],
    "renault-scenic-iii": [(143, 244, 29, 31)],
    "renault-symbol-i": [(176, 186, 24, 26)],
    "skoda-fabia-i": [(553, 183, 24, 24)],
    "skoda-fabia-ii": [(80, 184, 24, 24)],
    "skoda-karoq": [(580, 214, 28, 28)],
    "skoda-kodiaq-i": [(43, 190, 28, 28)],
    "skoda-octavia-i": [(75, 175, 28, 28)],
    "skoda-superb-ii": [(570, 186, 28, 28)],
    "skoda-superb-iii": [(80, 180, 24, 24)],
    "skoda-yeti": [(142, 256, 28, 28)],
    "suzuki-liana": [(149, 230, 24, 22)],
    "suzuki-splash": [(147, 205, 28, 25)],
    "suzuki-swift-2004": [(528, 160, 28, 25)],
    "suzuki-sx4-1st": [(544, 166, 28, 25)],
    "suzuki-vitara-4th": [(41, 156, 28, 25)],
    "toyota-alphard-ah30": [(82, 266, 27, 23)],
    "toyota-auris-e150": [(512, 166, 27, 23)],
    "toyota-fj-cruiser": [(155, 202, 62, 17), (415, 23, 20, 20), (364, 23, 20, 20)],
    "toyota-highlander-xu50": [(320, 237, 31, 27)],
    "toyota-land-cruiser-j100": [(91, 232, 27, 23)],
    "toyota-yaris": [(87, 203, 31, 27)],
    "volkswagen-bora-i": [(495, 190, 29, 29)],
    "volkswagen-golf-iv": [(508, 211, 29, 29)],
    "volkswagen-golf-vi": [(535, 180, 25, 25)],
    "volkswagen-golf-vii": [(128, 192, 29, 29)],
    "volkswagen-new-beetle": [(320, 239, 25, 25)],
    "volkswagen-passat-b5": [(125, 223, 25, 25)],
    "volkswagen-passat-b6": [(92, 142, 25, 25)],
    "volkswagen-passat-b8": [(143, 186, 29, 29)],
    "volkswagen-touareg-iii": [(106, 162, 25, 25)],
    "volkswagen-touran-ii": [(520, 142, 25, 25)],
    "volvo-s40-p1": [(93, 246, 27, 27), (111, 38, 39, 29), (559, 38, 39, 29)],
    "volvo-s60-2nd": [(107, 229, 27, 27)],
    "volvo-s90-spa": [(395, 249, 34, 34)],
    "volvo-xc70-p24": [(570, 248, 27, 27)],
    "volvo-xc90-spa": [(429, 313, 27, 27)],
}


def blur_regions(image: Image.Image, regions: list[tuple[int, int, int, int]]) -> Image.Image:
    source = image.convert("RGB")
    heavily_blurred = source.filter(ImageFilter.GaussianBlur(radius=14))
    mask = Image.new("L", source.size, 0)
    draw = ImageDraw.Draw(mask)
    for cx, cy, rx, ry in regions:
        draw.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=2))
    return Image.composite(heavily_blurred, source, mask)


def main() -> None:
    photos = sorted(CAR_DIR.glob("*.webp"))
    unknown = [photo.stem for photo in photos if photo.stem not in MASKS]
    for photo in photos:
        with Image.open(photo) as opened:
            opened.load()
            image = opened.convert("RGB")
        regions = MASKS.get(photo.stem)
        if regions:
            edited = blur_regions(image, regions)
            temporary = photo.with_suffix(".tmp.webp")
            edited.save(temporary, "WEBP", quality=86, method=6)
            temporary.replace(photo)

        with Image.open(photo) as opened:
            opened.load()
            thumb = opened.convert("RGB")
        thumb.thumbnail((480, 320), Image.Resampling.LANCZOS)
        thumb_path = THUMB_DIR / photo.name
        temporary_thumb = thumb_path.with_suffix(".tmp.webp")
        thumb.save(temporary_thumb, "WEBP", quality=82, method=6)
        temporary_thumb.replace(thumb_path)

    print(f"Processed {len(photos)} photographs; blurred {len(MASKS)} with visible marks.")
    if unknown:
        print("No visible manufacturer mark found in:")
        for name in unknown:
            print(f"  {name}")


if __name__ == "__main__":
    main()
