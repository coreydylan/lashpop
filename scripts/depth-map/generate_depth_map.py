#!/usr/bin/env python3
"""
Depth Map Generator using MiDaS
Generates a grayscale depth map from an input image for use in 3D parallax effects.
"""

import torch
import cv2
import urllib.request
from pathlib import Path
import argparse
import sys

# --------- Default Config ---------
DEFAULT_MODEL_TYPE = "DPT_Large"  # Options: "DPT_BEiT_L_384", "DPT_Large", "DPT_Hybrid", "MiDaS_small"
# Note: "DPT_BEiT_L_384" is highest quality but requires more VRAM
# "DPT_Large" is a good balance of quality and speed
# ----------------------------------


def main():
    parser = argparse.ArgumentParser(description="Generate depth map from an image using MiDaS")
    parser.add_argument("input", help="Path to input image")
    parser.add_argument("-o", "--output", help="Path to output depth map (default: input_depth.png)")
    parser.add_argument(
        "-m", "--model",
        default=DEFAULT_MODEL_TYPE,
        choices=["DPT_BEiT_L_384", "DPT_Large", "DPT_Hybrid", "MiDaS_small"],
        help=f"MiDaS model type (default: {DEFAULT_MODEL_TYPE})"
    )
    parser.add_argument("--invert", action="store_true", help="Invert depth map (white = near)")

    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: Input file not found: {input_path}")
        sys.exit(1)

    if args.output:
        output_path = Path(args.output)
    else:
        output_path = input_path.parent / f"{input_path.stem}_depth.png"

    print(f"Input:  {input_path}")
    print(f"Output: {output_path}")
    print(f"Model:  {args.model}")
    print()

    # Determine device
    if torch.cuda.is_available():
        device = torch.device("cuda")
        print("Using CUDA GPU")
    elif torch.backends.mps.is_available():
        device = torch.device("mps")
        print("Using Apple Silicon MPS")
    else:
        device = torch.device("cpu")
        print("Using CPU (this will be slower)")

    print("Loading MiDaS model...")

    # Load model + transforms from MiDaS
    model = torch.hub.load("isl-org/MiDaS", args.model)
    model.eval().to(device)

    midas_transforms = torch.hub.load("isl-org/MiDaS", "transforms")
    if "DPT" in args.model:
        transform = midas_transforms.dpt_transform
    else:
        transform = midas_transforms.small_transform

    print("Loading and processing image...")

    # Load image (BGR -> RGB)
    img_bgr = cv2.imread(str(input_path))
    if img_bgr is None:
        print(f"Error: Could not read image: {input_path}")
        sys.exit(1)

    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    original_h, original_w = img_rgb.shape[:2]
    print(f"Image size: {original_w}x{original_h}")

    # Preprocess + run model
    input_batch = transform(img_rgb).to(device)

    print("Running depth estimation...")
    with torch.no_grad():
        prediction = model(input_batch)
        prediction = torch.nn.functional.interpolate(
            prediction.unsqueeze(1),
            size=(original_h, original_w),
            mode="bicubic",
            align_corners=False,
        ).squeeze()

    depth = prediction.cpu().numpy()

    # Normalize to 0-255 (relative depth)
    depth_min = depth.min()
    depth_max = depth.max()
    depth_norm = (depth - depth_min) / (depth_max - depth_min + 1e-8)
    depth_8bit = (depth_norm * 255).astype("uint8")

    # Invert if requested (white = near, black = far)
    if args.invert:
        depth_8bit = 255 - depth_8bit
        print("Depth map inverted (white = near)")

    # Save as PNG
    cv2.imwrite(str(output_path), depth_8bit)
    print(f"\nSaved depth map to: {output_path}")
    print("Done!")


if __name__ == "__main__":
    main()
