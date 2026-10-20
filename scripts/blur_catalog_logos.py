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
    "audi-a8-d5": [(76, 159, 18, 10)],
    "audi-q3-f3": [(61, 216, 18, 11)],
    "bmw-m3-f80": [(586, 211, 11, 11)],
    "bmw-m4-g82": [(541, 182, 12, 12)],
    "bmw-m5-f10": [(610, 174, 11, 11)],
    "bmw-x1-f48": [(565, 156, 11, 11)],
    "bmw-x3-g01": [(545, 145, 11, 11)],
    "bmw-x4-g02": [(105, 157, 11, 11)],
    "bmw-x6-g06": [(165, 181, 11, 11)],
    "bmw-x7-g07": [(78, 157, 11, 11)],
    "bmw-z4-e89": [(590, 165, 11, 11)],
    "chevrolet-aveo-t250": [(120, 286, 18, 10)],
    "chevrolet-aveo-t300": [(182, 253, 18, 10)],
    "chevrolet-camaro-2010": [(550, 242, 18, 10)],
    "chevrolet-captiva-first": [(511, 251, 18, 10)],
    "chevrolet-corvette-c7": [(322, 215, 20, 13)],
    "chevrolet-epica-v250": [(425, 303, 18, 10)],
    "chevrolet-niva": [(526, 250, 18, 10)],
    "chevrolet-orlando-first": [(516, 232, 18, 10)],
    "chevrolet-spark-m300": [(551, 268, 18, 10)],
    "fiat-bravo-type-198": [(558, 216, 13, 13)],
    "fiat-doblo-mk1": [(310, 246, 13, 13)],
    "fiat-linea": [(65, 277, 13, 13)],
    "fiat-punto-1993": [(103, 300, 7, 5)],
    "fiat-punto-1999": [(490, 250, 11, 11)],
    "ford-explorer-fifth": [(558, 200, 19, 10)],
    "ford-fiesta-mk6": [(559, 264, 18, 9)],
    "ford-kuga-second": [(590, 163, 18, 9)],
    "ford-mondeo-mkiii": [(518, 274, 18, 9)],
    "ford-mondeo-mkiv": [(568, 205, 18, 9)],
    "ford-mustang-vi": [(318, 188, 20, 11)],
    "ford-s-max-1st": [(516, 279, 18, 9)],
    "land-rover-discovery-4": [(463, 148, 66, 8)],
    "land-rover-discovery-5": [(126, 209, 18, 10), (123, 163, 88, 12)],
    "land-rover-freelander-2nd": [(146, 153, 18, 10), (145, 132, 70, 8)],
    "land-rover-range-rover-evoque-l551": [(555, 174, 75, 8)],
    "land-rover-range-rover-velar": [(528, 129, 66, 8)],
    "lexus-is-xe30": [(305, 215, 15, 13)],
    "lexus-ls-xf50": [(520, 285, 15, 13)],
    "lexus-nx-az20": [(505, 218, 58, 9)],
    "opel-antara": [(148, 279, 15, 14)],
    "opel-astra-h": [(532, 222, 15, 14)],
    "opel-corsa-c": [(460, 314, 12, 12)],
    "opel-corsa-d": [(87, 189, 15, 14)],
    "opel-meriva-a": [(66, 207, 15, 14)],
    "opel-mokka-a": [(100, 190, 15, 14)],
    "opel-vectra-b": [(320, 303, 15, 14)],
    "opel-vectra-c": [(126, 229, 15, 14)],
    "opel-zafira-b": [(556, 227, 15, 14)],
    "peugeot-207": [(146, 244, 15, 15)],
    "peugeot-3008-b": [(135, 217, 30, 7), (104, 241, 9, 15)],
    "peugeot-307-2005": [(90, 210, 15, 15)],
    "peugeot-308-a": [(548, 205, 15, 15)],
    "peugeot-407": [(100, 141, 15, 15)],
    "peugeot-508-ii": [(97, 250, 12, 19)],
    "porsche-taycan": [(345, 151, 13, 15)],
    "renault-arkana-b0": [(82, 315, 7, 8)],
    "renault-clio-ii": [(416, 310, 15, 17)],
    "renault-fluence": [(590, 172, 15, 17)],
    "renault-kaptur": [(393, 205, 18, 22)],
    "renault-koleos-ii": [(552, 190, 15, 17)],
    "renault-laguna-iii": [(570, 273, 15, 17)],
    "renault-megane-ii": [(548, 202, 15, 17)],
    "renault-megane-iii": [(129, 220, 15, 22)],
    "renault-sandero-ii": [(510, 174, 15, 17)],
    "renault-scenic-iii": [(114, 261, 15, 17)],
    "renault-symbol-i": [(96, 212, 12, 14)],
    "skoda-fabia-i": [(555, 195, 13, 13)],
    "skoda-fabia-ii": [(78, 178, 13, 13)],
    "skoda-karoq": [(580, 216, 13, 13)],
    "skoda-kodiaq-i": [(42, 185, 13, 13)],
    "skoda-octavia-i": [(84, 185, 13, 13)],
    "skoda-superb-ii": [(570, 178, 13, 13)],
    "skoda-superb-iii": [(95, 181, 13, 13)],
    "skoda-yeti": [(142, 278, 13, 13)],
    "suzuki-liana": [(70, 238, 13, 11)],
    "suzuki-splash": [(148, 302, 15, 13)],
    "suzuki-swift-2004": [(554, 198, 15, 13)],
    "suzuki-sx4-1st": [(540, 208, 15, 13)],
    "suzuki-vitara-4th": [(102, 218, 15, 13)],
    "toyota-alphard-ah30": [(86, 257, 15, 13)],
    "toyota-auris-e150": [(515, 155, 15, 13)],
    "toyota-fj-cruiser": [(145, 235, 40, 15)],
    "toyota-highlander-xu50": [(322, 230, 16, 14)],
    "toyota-land-cruiser-j100": [(92, 240, 15, 13)],
    "toyota-yaris": [(92, 237, 16, 14)],
    "volkswagen-bora-i": [(555, 185, 15, 15)],
    "volkswagen-golf-iv": [(508, 233, 15, 15)],
    "volkswagen-golf-vi": [(535, 174, 15, 15)],
    "volkswagen-golf-vii": [(100, 253, 15, 15)],
    "volkswagen-new-beetle": [(320, 244, 15, 15)],
    "volkswagen-passat-b5": [(128, 269, 15, 15)],
    "volkswagen-passat-b6": [(95, 165, 15, 15)],
    "volkswagen-passat-b8": [(142, 287, 15, 15)],
    "volkswagen-touareg-iii": [(108, 216, 15, 15)],
    "volkswagen-touran-ii": [(540, 210, 15, 15)],
    "volvo-s40-p1": [(101, 276, 16, 16)],
    "volvo-s60-2nd": [(110, 252, 16, 16)],
    "volvo-s90-spa": [(438, 235, 31, 30)],
    "volvo-xc70-p24": [(575, 258, 16, 16)],
    "volvo-xc90-spa": [(430, 345, 16, 16)],
}

# License plates and plate-shaped showroom labels. Coordinates are
# (left, top, right, bottom) on the same pristine originals.  Rectangles are
# deliberately a little wider than the glyphs so no edge remains legible after
# WebP recompression or thumbnail resizing.
PLATE_MASKS = {
    "fiat-punto-1999": [(420, 306, 535, 347)],
    "fiat-bravo-type-198": [(526, 250, 616, 291)],
    "fiat-doblo-mk1": [(236, 336, 384, 393)],
    "fiat-punto-1993": [(65, 323, 137, 356)],
    "ford-mondeo-mkiii": [(505, 306, 625, 350)],
    "ford-mondeo-mkiv": [(409, 261, 501, 300)],
    "ford-kuga-second": [(594, 220, 640, 249)],
    "ford-explorer-fifth": [(560, 277, 635, 313)],
    "ford-s-max-1st": [(471, 313, 582, 374)],
    "peugeot-307-2005": [(43, 250, 143, 302)],
    "peugeot-308-a": [(548, 248, 636, 288)],
    "peugeot-3008-b": [(54, 266, 134, 299)],
    "peugeot-508-ii": [(50, 265, 140, 316)],
    "renault-clio-ii": [(297, 325, 478, 381)],
    "renault-symbol-i": [(74, 255, 127, 290)],
    "renault-megane-ii": [(521, 232, 592, 273)],
    "renault-megane-iii": [(67, 270, 175, 329)],
    "renault-sandero-ii": [(466, 213, 574, 266)],
    "renault-koleos-ii": [(558, 238, 640, 294)],
    "renault-scenic-iii": [(55, 308, 163, 372)],
    "opel-corsa-c": [(424, 278, 497, 314)],
    "opel-corsa-d": [(42, 233, 125, 280)],
    "opel-astra-h": [(314, 313, 459, 348)],
    "opel-vectra-b": [(218, 366, 434, 423)],
    "opel-vectra-c": [(51, 313, 164, 354)],
    "opel-meriva-a": [(24, 297, 116, 333)],
    "opel-zafira-b": [(522, 266, 623, 322)],
    "opel-mokka-a": [(40, 269, 185, 304)],
    "volkswagen-golf-iv": [(454, 228, 574, 292)],
    "volkswagen-golf-vi": [(514, 214, 631, 254)],
    "volkswagen-passat-b5": [(60, 299, 147, 332)],
    "volkswagen-passat-b6": [(0, 180, 170, 320)],
    "volkswagen-passat-b8": [(112, 275, 205, 309)],
    "volkswagen-bora-i": [(512, 213, 580, 244)],
    "volkswagen-touareg-iii": [(0, 175, 160, 320)],
    "volkswagen-touran-ii": [(462, 241, 563, 301)],
    "skoda-fabia-i": [(500, 245, 624, 289)],
    "skoda-fabia-ii": [(44, 234, 151, 275)],
    "skoda-octavia-i": [(39, 239, 126, 276)],
    "skoda-superb-ii": [(401, 243, 538, 280)],
    "skoda-superb-iii": [(18, 269, 137, 316)],
    "skoda-kodiaq-i": [(13, 239, 87, 276)],
    "suzuki-swift-2004": [(524, 224, 616, 270)],
    "suzuki-sx4-1st": [(574, 264, 640, 306)],
    "chevrolet-aveo-t250": [(74, 329, 186, 376)],
    "chevrolet-aveo-t300": [(84, 279, 186, 326)],
    "chevrolet-epica-v250": [(424, 326, 514, 385)],
    "chevrolet-orlando-first": [(508, 230, 630, 310)],
    "chevrolet-camaro-2010": [(539, 294, 626, 341)],
    "toyota-auris-e150": [(452, 187, 580, 270)],
    "toyota-highlander-xu50": [(283, 317, 382, 371)],
    "toyota-alphard-ah30": [(58, 313, 132, 397)],
    "toyota-land-cruiser-j100": [(50, 308, 214, 344)],
    "volvo-s60-2nd": [(96, 294, 181, 335)],
    "volvo-xc70-p24": [(514, 274, 612, 316)],
    "audi-a8-d4": [(548, 132, 632, 181)],
    "audi-a8-d5": [(20, 166, 121, 214)],
    "audi-q3-f3": [(34, 263, 137, 311)],
    "bmw-m3-f80": [(554, 255, 640, 303)],
    "bmw-m4-g82": [(520, 170, 640, 245)],
    "bmw-x1-f48": [(552, 239, 616, 280)],
    "bmw-x3-g01": [(502, 208, 582, 246)],
    "bmw-x6-g06": [(69, 269, 201, 316)],
    "bmw-z4-e89": [(594, 218, 640, 282)],
    "chevrolet-niva": [(458, 230, 546, 257)],
    "fiat-linea": [(39, 324, 146, 371)],
    "land-rover-discovery-4": [(510, 230, 584, 268)],
    "land-rover-discovery-5": [(60, 263, 168, 306)],
    "land-rover-freelander-2nd": [(390, 209, 541, 248)],
    "land-rover-range-rover-velar": [(534, 204, 640, 251)],
    "lexus-nx-az20": [(397, 244, 507, 286)],
    "opel-antara": [(75, 326, 212, 392)],
    "peugeot-207": [(69, 339, 146, 396)],
    "peugeot-407": [(35, 188, 128, 240)],
    "renault-fluence": [(493, 295, 640, 342)],
    "renault-kaptur": [(294, 254, 436, 306)],
    "skoda-karoq": [(500, 326, 625, 375)],
    "skoda-yeti": [(44, 332, 171, 384)],
    "suzuki-liana": [(24, 304, 126, 351)],
    "suzuki-splash": [(55, 305, 205, 390)],
    "volkswagen-new-beetle": [(270, 305, 390, 380)],
}

# Give every approved region a small safety margin so compression and different
# card crops cannot leave the outer edge of a badge readable. The margin stays
# deliberately modest to avoid the oversized dark patches from the first pass.
MASKS = {
    name: [
        (cx, cy, max(rx + 2, round(rx * 1.15)), max(ry + 2, round(ry * 1.15)))
        for cx, cy, rx, ry in regions
    ]
    for name, regions in MASKS.items()
}


def blur_regions(
    image: Image.Image,
    regions: list[tuple[int, int, int, int]],
    plate_regions: list[tuple[int, int, int, int]],
) -> Image.Image:
    source = image.convert("RGB")
    heavily_blurred = source.filter(ImageFilter.GaussianBlur(radius=10))
    mask = Image.new("L", source.size, 0)
    draw = ImageDraw.Draw(mask)
    for cx, cy, rx, ry in regions:
        draw.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=255)
    for left, top, right, bottom in plate_regions:
        radius = max(3, min(10, (bottom - top) // 4))
        draw.rounded_rectangle((left, top, right, bottom), radius=radius, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=1))
    return Image.composite(heavily_blurred, source, mask)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source_dir", type=Path, help="directory containing pristine, unblurred WebP originals")
    parser.add_argument(
        "--only",
        nargs="*",
        help="optional list of photo stems to rebuild (useful after a mask correction)",
    )
    args = parser.parse_args()
    photos = sorted(args.source_dir.glob("*.webp"))
    if args.only:
        requested = set(args.only)
        photos = [photo for photo in photos if photo.stem in requested]
        missing = sorted(requested - {photo.stem for photo in photos})
        if missing:
            raise SystemExit(f"Requested photographs not found: {', '.join(missing)}")
    if not photos:
        raise SystemExit(f"No pristine WebP photographs found in {args.source_dir}")
    unknown = [photo.stem for photo in photos if photo.stem not in MASKS]
    for photo in photos:
        with Image.open(photo) as opened:
            opened.load()
            image = opened.convert("RGB")
        edited = blur_regions(
            image,
            MASKS.get(photo.stem, []),
            PLATE_MASKS.get(photo.stem, []),
        )
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

    print(
        f"Processed {len(photos)} photographs; blurred manufacturer marks on "
        f"{len(MASKS)} and plates on {len(PLATE_MASKS)}."
    )
    if unknown:
        print("No visible manufacturer mark found in:")
        for name in unknown:
            print(f"  {name}")


if __name__ == "__main__":
    main()
