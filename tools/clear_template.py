#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
clear_template.py - Erase photo-of-people slots from a photo booth template,
leaving the frame decoration intact with transparent holes where photos go.

Requirements:
  pip3 install Pillow numpy

Usage examples:

  # Auto-detect and write
  python3 tools/clear_template.py input.png output.png

  # Template is two identical strips side-by-side — crop to left half
  python3 tools/clear_template.py input.png output.png --crop-half

  # Preview without writing
  python3 tools/clear_template.py input.png --dry-run

  # Manual slot boxes when auto-detect struggles
  python3 tools/clear_template.py input.png output.png \\
      --slots 35,173,331,355  35,360,331,540  35,550,331,730  35,735,331,912
"""

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image
    import numpy as np
except ImportError:
    sys.exit("Install dependencies first:  pip3 install Pillow numpy")


def parse_slot(s: str) -> tuple:
    parts = [int(x.strip()) for x in s.split(",")]
    if len(parts) != 4:
        raise ValueError(f"Slot must be 'x1,y1,x2,y2', got: {s!r}")
    return tuple(parts)


def detect_slots(
    img: Image.Image,
    skin_ratio: float = 0.03,
    diversity_ratio: float = 0.35,
    min_band_h_frac: float = 0.07,
    min_band_w_frac: float = 0.20,
) -> list:
    """
    Detect photo-slot regions using two combined signals:

    Signal A — YCbCr skin-tone range (Cb:77-127, Cr:133-173, Y:60-220).
      Reliable for photos with visible skin. A luminance guard prevents cream
      separators and pure-white regions from being mistaken for skin.

    Signal B — per-row color diversity: fraction of pixels that are a unique
      quantized color (5-bit per channel). Photos — even dark ones — have high
      color diversity; frame separators and solid borders do not.

    A row is 'photo content' when EITHER signal fires. This handles:
      - Standard portraits (signal A)
      - Covered/hijab subjects, dark interiors, muted scenes (signal B)

    Returns a list of (x1, y1, x2, y2) tuples.
    """
    arr = np.array(img.convert("RGB"))
    H, W = arr.shape[:2]

    # ----- Signal A: skin-tone mask -----
    ycbcr = np.array(img.convert("YCbCr"), dtype=np.int32)
    Y2, Cb, Cr = ycbcr[:, :, 0], ycbcr[:, :, 1], ycbcr[:, :, 2]
    skin = (Cb >= 77) & (Cb <= 127) & (Cr >= 133) & (Cr <= 173) & (Y2 > 60) & (Y2 < 220)
    skin_row = skin.mean(axis=1) >= skin_ratio

    # ----- Signal B: color diversity -----
    q = (arr >> 3).astype(np.uint32)  # 5-bit quantisation per channel (32 levels)
    keys = q[:, :, 0] * (32 * 32) + q[:, :, 1] * 32 + q[:, :, 2]
    div_row = np.array([len(np.unique(keys[y])) / W for y in range(H)]) >= diversity_ratio

    # ----- Combined: either signal -----
    photo_row = skin_row | div_row

    # ----- Group into contiguous y-bands -----
    bands = []
    start = None
    for y in range(H + 1):
        active = bool(photo_row[y]) if y < H else False
        if active and start is None:
            start = y
        elif not active and start is not None:
            bands.append((start, y - 1))
            start = None

    min_h = H * min_band_h_frac

    # ----- Per-band y filter and skin-only x extent -----
    # Row detection used the broad combined signal. For x-extent we use skin only
    # (diversity would fire on frame borders, giving full-width false positives).
    # Bands with no skin pixels get x=None; we fill those in below via median.
    band_data = []  # (x1|None, y1, x2|None, y2)
    for y1, y2 in bands:
        if y2 - y1 < min_h:
            continue
        col_skin = skin[y1:y2 + 1, :].any(axis=0)
        xs = np.where(col_skin)[0]
        x1_s = int(xs[0]) if len(xs) > 0 else None
        x2_s = int(xs[-1]) if len(xs) > 0 else None
        band_data.append((x1_s, y1, x2_s, y2))

    if not band_data:
        return []

    # ----- Filter bands by height relative to median -----
    heights = [y2 - y1 for _, y1, _, y2 in band_data]
    median_h = float(np.median(heights))
    band_data = [(x1, y1, x2, y2) for (x1, y1, x2, y2) in band_data if y2 - y1 >= median_h * 0.50]

    # ----- Derive common x from skin-detected bands, apply to all -----
    valid_x1 = [x1 for x1, _, _, _ in band_data if x1 is not None]
    valid_x2 = [x2 for _, _, x2, _ in band_data if x2 is not None]

    if valid_x1 and valid_x2:
        common_x1 = int(np.median(valid_x1))
        common_x2 = int(np.median(valid_x2))
    else:
        # No skin at all (e.g. template already cleared or non-human content)
        margin = W // 8
        common_x1, common_x2 = margin, W - margin

    slots = [
        (common_x1, y1, common_x2, y2)
        for (_, y1, _, y2) in band_data
        if common_x2 - common_x1 >= W * min_band_w_frac
    ]

    return slots


def apply_slots(img: Image.Image, slots: list) -> Image.Image:
    """Make the given (x1,y1,x2,y2) boxes fully transparent."""
    arr = np.array(img.convert("RGBA"))
    for x1, y1, x2, y2 in slots:
        arr[y1:y2 + 1, x1:x2 + 1, 3] = 0
    return Image.fromarray(arr)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Erase people-photo slots from a photo booth template, making them transparent."
    )
    parser.add_argument("input", help="Source template PNG (with people photos in slots)")
    parser.add_argument("output", nargs="?", help="Output RGBA PNG with transparent slot holes")
    parser.add_argument(
        "--crop-half", action="store_true",
        help="Crop to left half before processing (for twin-strip templates)",
    )
    parser.add_argument(
        "--skin-ratio", type=float, default=0.03, metavar="RATIO",
        help="Skin-tone threshold per row (default 0.03). Raise to reduce false positives.",
    )
    parser.add_argument(
        "--diversity-ratio", type=float, default=0.35, metavar="RATIO",
        help="Color-diversity threshold per row (default 0.35). "
             "Raise if frame decoration is detected; lower if dark slots are missed.",
    )
    parser.add_argument(
        "--slots", nargs="+", metavar="x1,y1,x2,y2",
        help="Manually specify slot boxes in pixels (bypasses auto-detect).",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Print detected slot boxes without writing output.",
    )
    args = parser.parse_args()

    if not args.dry_run and not args.output:
        parser.error("Provide an output path or pass --dry-run.")

    src = Path(args.input)
    if not src.exists():
        sys.exit(f"Input not found: {src}")

    img = Image.open(src)
    print(f"Loaded: {src}  ({img.width}x{img.height}  mode={img.mode})")

    if args.crop_half:
        img = img.crop((0, 0, img.width // 2, img.height))
        print(f"Cropped to left half: {img.width}x{img.height}")

    if args.slots:
        slots = [parse_slot(s) for s in args.slots]
        print(f"Using {len(slots)} manually specified slot(s):")
    else:
        print(f"Auto-detecting (skin-ratio={args.skin_ratio}, diversity-ratio={args.diversity_ratio})...")
        slots = detect_slots(img, skin_ratio=args.skin_ratio, diversity_ratio=args.diversity_ratio)
        print(f"Detected {len(slots)} slot(s):")

    if not slots:
        print("  (none)\nTip: use --slots x1,y1,x2,y2 to specify positions manually.")
        return

    total_area = img.width * img.height
    slot_area = sum((x2 - x1) * (y2 - y1) for x1, y1, x2, y2 in slots)
    if slot_area / total_area > 0.75:
        print("  WARNING: detected region covers >75% of image — this may be a product photo")
        print("  rather than a template file. Consider using --slots to specify manually.")

    for i, (x1, y1, x2, y2) in enumerate(slots, 1):
        print(f"  Slot {i}: x={x1}-{x2}  y={y1}-{y2}  size={x2-x1}x{y2-y1}px")

    if args.dry_run:
        return

    out_img = apply_slots(img, slots)
    dst = Path(args.output)
    dst.parent.mkdir(parents=True, exist_ok=True)
    out_img.save(dst, format="PNG")
    print(f"Saved: {dst}  ({out_img.width}x{out_img.height}  RGBA)")


if __name__ == "__main__":
    main()
