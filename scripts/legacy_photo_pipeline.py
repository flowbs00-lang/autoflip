#!/usr/bin/env python3
"""Deterministic privacy/brand-mask pipeline for AutoFlip legacy car photos.

The game historically referenced Wikimedia files at runtime.  This tool makes
the exact set auditable, pins every source by SHA-256, applies reviewed masks,
and emits a JS source-to-local-asset map.  A build fails closed when a photo is
new, changed, unreviewed, or has neither a mask nor an explicit no-visible flag.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE_DIR = ROOT.parent / "pristine_legacy"
ANNOTATIONS = ROOT / "config" / "legacy-photo-annotations.json"
OUTPUT_DIRS = (
    ROOT / "assets" / "cars" / "legacy",
    ROOT / "cloudflare" / "app" / "assets" / "cars" / "legacy",
)
MAP_TARGETS = (
    ROOT / "legacy-photo-map.js",
    ROOT / "cloudflare" / "app" / "legacy-photo-map.js",
)
KINDS = {"badge", "brand_text", "plate"}


def js_hash(value: str) -> int:
    result = 0
    for char in value:
        result = ((result << 5) - result + ord(char)) & 0xFFFFFFFF
    if result & 0x80000000:
        result -= 0x100000000
    return abs(result)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def source_path(source_dir: Path, filename: str) -> Path:
    return source_dir / f"commons-{js_hash(filename)}.img"


def used_filenames() -> list[str]:
    base = (ROOT / "script_base.js").read_text(encoding="utf-8")
    app = (ROOT / "script.js").read_text(encoding="utf-8")
    blocks = (
        base[base.index("const exactPhotos=") : base.index("};", base.index("const exactPhotos=")) + 2],
        app[app.index("var marketPhotoPools=") : app.index("};", app.index("var marketPhotoPools=")) + 2],
    )
    result: list[str] = []
    pattern = re.compile(r"commons\((['\"])(.*?)\1\)")
    for block in blocks:
        for match in pattern.finditer(block):
            if match.group(2) not in result:
                result.append(match.group(2))
    return result


def load_annotations() -> dict:
    if not ANNOTATIONS.exists():
        return {"schemaVersion": 1, "photos": {}}
    return json.loads(ANNOTATIONS.read_text(encoding="utf-8"))


def save_annotations(document: dict) -> None:
    ANNOTATIONS.parent.mkdir(parents=True, exist_ok=True)
    ANNOTATIONS.write_text(
        json.dumps(document, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def init_annotations(source_dir: Path) -> None:
    document = load_annotations()
    photos = document.setdefault("photos", {})
    expected = used_filenames()
    for index, filename in enumerate(expected, 1):
        path = source_path(source_dir, filename)
        record = photos.setdefault(filename, {})
        record.setdefault("asset", f"legacy-{index:03}.webp")
        if path.exists():
            record.setdefault("sourceSha256", sha256(path))
        record.setdefault("reviewed", False)
        record.setdefault("regions", [])
        record.setdefault("noVisible", [])
    save_annotations(document)
    print(f"Inventory contains {len(expected)} used photographs.")


def verify(source_dir: Path, *, allow_pending: bool = False) -> tuple[dict, list[str]]:
    document = load_annotations()
    photos = document.get("photos", {})
    expected = used_filenames()
    errors: list[str] = []
    if set(photos) - set(expected):
        errors.append("annotation file contains photographs no longer used by the game")
    assets: set[str] = set()
    for filename in expected:
        record = photos.get(filename)
        if not record:
            errors.append(f"missing annotation: {filename}")
            continue
        asset = str(record.get("asset", ""))
        if not asset or asset in assets:
            errors.append(f"missing or duplicate asset name: {filename}")
        assets.add(asset)
        path = source_path(source_dir, filename)
        if not path.exists():
            errors.append(f"missing source image: {filename}")
            continue
        actual_hash = sha256(path)
        if actual_hash != record.get("sourceSha256"):
            errors.append(f"source SHA-256 changed: {filename}")
        if not record.get("reviewed") and not allow_pending:
            errors.append(f"review required: {filename}")
        regions = record.get("regions", [])
        no_visible = set(record.get("noVisible", []))
        for kind in no_visible:
            if kind not in KINDS:
                errors.append(f"unknown noVisible kind {kind}: {filename}")
        for region in regions:
            kind, box = region.get("kind"), region.get("box")
            if kind not in KINDS:
                errors.append(f"unknown region kind {kind}: {filename}")
            if not isinstance(box, list) or len(box) != 4:
                errors.append(f"invalid box: {filename}")
                continue
            if any(not isinstance(v, (int, float)) or v < 0 or v > 1 for v in box):
                errors.append(f"out-of-range box: {filename}")
            elif not (box[0] < box[2] and box[1] < box[3]):
                errors.append(f"empty box: {filename}")
        for kind in KINDS:
            if kind not in no_visible and not any(r.get("kind") == kind for r in regions):
                errors.append(f"{kind} neither masked nor explicitly marked invisible: {filename}")
    return document, errors


def pixel_box(box: list[float], width: int, height: int) -> tuple[int, int, int, int]:
    return (
        max(0, round(box[0] * width)),
        max(0, round(box[1] * height)),
        min(width, round(box[2] * width)),
        min(height, round(box[3] * height)),
    )


def blurred_image(image: Image.Image, regions: list[dict]) -> Image.Image:
    source = image.convert("RGB")
    # A strong radius is intentional: a weak blur can leave a small emblem's
    # silhouette recognizable even when the reviewed rectangle is correct.
    radius = max(18, round(max(source.size) * 0.035))
    blurred = source.filter(ImageFilter.GaussianBlur(radius=radius))
    mask = Image.new("L", source.size, 0)
    draw = ImageDraw.Draw(mask)
    for region in regions:
        box = pixel_box(region["box"], *source.size)
        if region["kind"] == "badge":
            draw.ellipse(box, fill=255)
        else:
            corner = max(3, min(box[2] - box[0], box[3] - box[1]) // 5)
            draw.rounded_rectangle(box, radius=corner, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=2))
    return Image.composite(blurred, source, mask)


def build(source_dir: Path) -> None:
    document, errors = verify(source_dir)
    if errors:
        raise SystemExit("Cannot build legacy photos:\n- " + "\n- ".join(errors))
    mapping: dict[str, str] = {}
    for filename in used_filenames():
        record = document["photos"][filename]
        with Image.open(source_path(source_dir, filename)) as opened:
            opened.load()
            image = opened.convert("RGB")
        if image.width > 960:
            image.thumbnail((960, 960), Image.Resampling.LANCZOS)
        edited = blurred_image(image, record["regions"])
        for output_dir in OUTPUT_DIRS:
            output_dir.mkdir(parents=True, exist_ok=True)
            destination = output_dir / record["asset"]
            temporary = destination.with_suffix(".tmp.webp")
            edited.save(temporary, "WEBP", quality=88, method=6)
            temporary.replace(destination)
        mapping[filename] = f"assets/cars/legacy/{record['asset']}"
    js = (
        "// Generated by scripts/legacy_photo_pipeline.py; do not edit by hand.\n"
        "window.AUTOFLIP_LEGACY_PHOTOS="
        + json.dumps(mapping, ensure_ascii=False, separators=(",", ":"))
        + ";\n"
    )
    for target in MAP_TARGETS:
        target.write_text(js, encoding="utf-8")
    print(f"Built {len(mapping)} reviewed legacy photographs in both app trees.")


def review(source_dir: Path, output_dir: Path) -> None:
    document, errors = verify(source_dir, allow_pending=True)
    structural = [error for error in errors if "review required" not in error]
    if structural:
        raise SystemExit("Cannot render review sheets:\n- " + "\n- ".join(structural))
    output_dir.mkdir(parents=True, exist_ok=True)
    font = ImageFont.load_default(size=18)
    photos = document["photos"]
    filenames = used_filenames()
    colors = {"badge": "#ff3b30", "brand_text": "#ff9f0a", "plate": "#0a84ff"}
    for page, start in enumerate(range(0, len(filenames), 6), 1):
        sheet = Image.new("RGB", (1920, 1530), "#111111")
        for slot, filename in enumerate(filenames[start : start + 6]):
            index = start + slot + 1
            record = photos[filename]
            with Image.open(source_path(source_dir, filename)) as opened:
                image = opened.convert("RGB")
            image.thumbnail((940, 690), Image.Resampling.LANCZOS)
            x = (slot % 2) * 960 + (960 - image.width) // 2
            y = (slot // 2) * 510 + 50 + (440 - image.height) // 2
            sheet.paste(image, (x, y))
            draw = ImageDraw.Draw(sheet)
            draw.rectangle(((slot % 2) * 960, (slot // 2) * 510, (slot % 2 + 1) * 960 - 1, (slot // 2) * 510 + 47), fill="#000000")
            state = "VERIFIED" if record.get("reviewed") else "PENDING"
            draw.text(((slot % 2) * 960 + 8, (slot // 2) * 510 + 8), f"{index:03} {state} {filename}", font=font, fill="white")
            for region in record.get("regions", []):
                left, top, right, bottom = pixel_box(region["box"], image.width, image.height)
                draw.rectangle((x + left, y + top, x + right, y + bottom), outline=colors[region["kind"]], width=4)
        sheet.save(output_dir / f"legacy-review-{page:02}.jpg", quality=92)
    print(f"Rendered {(len(filenames) + 5) // 6} review sheets in {output_dir}.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("init", "verify", "review", "build"))
    parser.add_argument("--source-dir", type=Path, default=DEFAULT_SOURCE_DIR)
    parser.add_argument("--review-dir", type=Path, default=ROOT.parent / "legacy_review" / "annotated")
    args = parser.parse_args()
    if args.command == "init":
        init_annotations(args.source_dir)
    elif args.command == "verify":
        _, errors = verify(args.source_dir)
        if errors:
            raise SystemExit("Legacy photo verification failed:\n- " + "\n- ".join(errors))
        print(f"Verified all {len(used_filenames())} legacy photographs.")
    elif args.command == "review":
        review(args.source_dir, args.review_dir)
    else:
        build(args.source_dir)


if __name__ == "__main__":
    main()
