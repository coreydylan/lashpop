#!/usr/bin/env python3
"""
Thin SVG Icon Script

Creates thinner versions of filled SVG icons using proper geometric offsetting.
Properly handles SVG transforms.
"""

import re
from pathlib import Path
from shapely.geometry import Polygon, MultiPolygon, GeometryCollection
from shapely.ops import unary_union
from shapely import affinity
import xml.etree.ElementTree as ET


def parse_transform(transform_str: str) -> tuple:
    """Parse SVG transform string and return (translate_x, translate_y, scale_x, scale_y)."""
    tx, ty, sx, sy = 0, 0, 1, 1

    translate_match = re.search(r'translate\s*\(\s*([^,\)]+)\s*,?\s*([^,\)]*)\s*\)', transform_str)
    if translate_match:
        tx = float(translate_match.group(1))
        ty = float(translate_match.group(2)) if translate_match.group(2) else 0

    scale_match = re.search(r'scale\s*\(\s*([^,\)]+)\s*,?\s*([^,\)]*)\s*\)', transform_str)
    if scale_match:
        sx = float(scale_match.group(1))
        sy = float(scale_match.group(2)) if scale_match.group(2) else sx

    return tx, ty, sx, sy


def parse_path_to_subpaths(d: str) -> list[list[tuple[float, float]]]:
    """Parse SVG path 'd' attribute into list of subpaths."""
    d = d.replace(',', ' ')
    d = re.sub(r'([a-zA-Z])', r' \1 ', d)
    d = re.sub(r'\s+', ' ', d).strip()

    tokens = d.split()

    subpaths = []
    current_subpath = []
    current_x, current_y = 0, 0
    start_x, start_y = 0, 0
    i = 0
    current_cmd = None

    while i < len(tokens):
        token = tokens[i]

        if token.isalpha():
            current_cmd = token
            i += 1
            continue

        if current_cmd is None:
            i += 1
            continue

        try:
            if current_cmd == 'M':
                if current_subpath and len(current_subpath) >= 3:
                    subpaths.append(current_subpath)
                current_x = float(tokens[i])
                current_y = float(tokens[i + 1])
                start_x, start_y = current_x, current_y
                current_subpath = [(current_x, current_y)]
                i += 2
                current_cmd = 'L'

            elif current_cmd == 'm':
                if current_subpath and len(current_subpath) >= 3:
                    subpaths.append(current_subpath)
                current_x += float(tokens[i])
                current_y += float(tokens[i + 1])
                start_x, start_y = current_x, current_y
                current_subpath = [(current_x, current_y)]
                i += 2
                current_cmd = 'l'

            elif current_cmd == 'L':
                current_x = float(tokens[i])
                current_y = float(tokens[i + 1])
                current_subpath.append((current_x, current_y))
                i += 2

            elif current_cmd == 'l':
                current_x += float(tokens[i])
                current_y += float(tokens[i + 1])
                current_subpath.append((current_x, current_y))
                i += 2

            elif current_cmd == 'H':
                current_x = float(tokens[i])
                current_subpath.append((current_x, current_y))
                i += 1

            elif current_cmd == 'h':
                current_x += float(tokens[i])
                current_subpath.append((current_x, current_y))
                i += 1

            elif current_cmd == 'V':
                current_y = float(tokens[i])
                current_subpath.append((current_x, current_y))
                i += 1

            elif current_cmd == 'v':
                current_y += float(tokens[i])
                current_subpath.append((current_x, current_y))
                i += 1

            elif current_cmd == 'C':
                x1, y1 = float(tokens[i]), float(tokens[i+1])
                x2, y2 = float(tokens[i+2]), float(tokens[i+3])
                x3, y3 = float(tokens[i+4]), float(tokens[i+5])

                for t in [0.2, 0.4, 0.6, 0.8, 1.0]:
                    bx = (1-t)**3 * current_x + 3*(1-t)**2*t * x1 + 3*(1-t)*t**2 * x2 + t**3 * x3
                    by = (1-t)**3 * current_y + 3*(1-t)**2*t * y1 + 3*(1-t)*t**2 * y2 + t**3 * y3
                    current_subpath.append((bx, by))

                current_x, current_y = x3, y3
                i += 6

            elif current_cmd == 'c':
                x1 = current_x + float(tokens[i])
                y1 = current_y + float(tokens[i+1])
                x2 = current_x + float(tokens[i+2])
                y2 = current_y + float(tokens[i+3])
                x3 = current_x + float(tokens[i+4])
                y3 = current_y + float(tokens[i+5])

                start_bx, start_by = current_x, current_y
                for t in [0.2, 0.4, 0.6, 0.8, 1.0]:
                    bx = (1-t)**3 * start_bx + 3*(1-t)**2*t * x1 + 3*(1-t)*t**2 * x2 + t**3 * x3
                    by = (1-t)**3 * start_by + 3*(1-t)**2*t * y1 + 3*(1-t)*t**2 * y2 + t**3 * y3
                    current_subpath.append((bx, by))

                current_x, current_y = x3, y3
                i += 6

            elif current_cmd in ('Z', 'z'):
                if current_subpath:
                    current_subpath.append((start_x, start_y))
                i += 1

            else:
                i += 1
        except (IndexError, ValueError):
            i += 1

    if current_subpath and len(current_subpath) >= 3:
        subpaths.append(current_subpath)

    return subpaths


def apply_transform(points, tx, ty, sx, sy):
    """Apply SVG transform to points."""
    return [(x * sx + tx, y * sy + ty) for x, y in points]


def polygon_to_svg_path(geom) -> str:
    """Convert shapely geometry to SVG path."""
    if geom is None or geom.is_empty:
        return ""

    paths = []

    def process_polygon(poly):
        coords = list(poly.exterior.coords)
        if coords:
            d = f"M {coords[0][0]:.2f},{coords[0][1]:.2f}"
            for x, y in coords[1:]:
                d += f" L {x:.2f},{y:.2f}"
            d += " Z"
            paths.append(d)

        for interior in poly.interiors:
            coords = list(interior.coords)
            if coords:
                d = f"M {coords[0][0]:.2f},{coords[0][1]:.2f}"
                for x, y in coords[1:]:
                    d += f" L {x:.2f},{y:.2f}"
                d += " Z"
                paths.append(d)

    if isinstance(geom, Polygon):
        process_polygon(geom)
    elif isinstance(geom, MultiPolygon):
        for poly in geom.geoms:
            process_polygon(poly)
    elif isinstance(geom, GeometryCollection):
        for g in geom.geoms:
            if isinstance(g, (Polygon, MultiPolygon)):
                paths.append(polygon_to_svg_path(g))

    return " ".join(paths)


def create_thin_version(input_svg: str, output_svg: str, inset_amount: float) -> bool:
    """Create a thinner version of the SVG by insetting the filled shapes."""
    print(f"  Processing with inset {inset_amount}...")

    tree = ET.parse(input_svg)
    root = tree.getroot()

    ET.register_namespace('', 'http://www.w3.org/2000/svg')

    g_elem = root.find('.//{http://www.w3.org/2000/svg}g')
    if g_elem is None:
        g_elem = root.find('.//g')

    transform_str = g_elem.get('transform', '') if g_elem is not None else ''
    tx, ty, sx, sy = parse_transform(transform_str)

    path_elem = root.find('.//{http://www.w3.org/2000/svg}path')
    if path_elem is None:
        path_elem = root.find('.//path')

    if path_elem is None:
        print("    Error: No path element found")
        return False

    d = path_elem.get('d')
    if not d:
        print("    Error: Path has no 'd' attribute")
        return False

    subpaths = parse_path_to_subpaths(d)

    # Apply transform and create polygons
    polygons = []
    for sp in subpaths:
        if len(sp) < 3:
            continue

        transformed = apply_transform(sp, tx, ty, sx, sy)

        try:
            poly = Polygon(transformed)
            if not poly.is_valid:
                poly = poly.buffer(0)
            if poly.is_valid and not poly.is_empty and poly.area > 0:
                polygons.append(poly)
        except Exception:
            pass

    if not polygons:
        print("    Error: No valid polygons")
        return False

    # Combine polygons based on count
    if len(polygons) == 1:
        combined = polygons[0]
    elif len(polygons) == 2:
        # Two polygons: likely outer shape with inner cutout (like brow icon)
        if polygons[0].area > polygons[1].area:
            outer, inner = polygons[0], polygons[1]
        else:
            outer, inner = polygons[1], polygons[0]
        combined = outer.difference(inner)
    else:
        # Multiple polygons: union them all (like lash icons with multiple strands)
        combined = unary_union(polygons)

    original_area = combined.area

    # Apply inset
    if inset_amount > 0:
        thinned = combined.buffer(-inset_amount, resolution=16, join_style=2)
    else:
        thinned = combined

    if thinned is None or thinned.is_empty:
        print(f"    Warning: Inset too large, shape disappeared")
        return False

    # Create new SVG
    new_d = polygon_to_svg_path(thinned)

    if not new_d:
        print(f"    Warning: Could not convert geometry to path")
        return False

    minx, miny, maxx, maxy = thinned.bounds
    padding = 5
    width = maxx - minx + 2 * padding
    height = maxy - miny + 2 * padding

    new_svg = f'''<?xml version="1.0" standalone="no"?>
<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
 viewBox="{minx - padding} {miny - padding} {width} {height}"
 preserveAspectRatio="xMidYMid meet">
<g fill="#cc947f" stroke="none">
<path d="{new_d}"/>
</g>
</svg>
'''

    with open(output_svg, 'w') as f:
        f.write(new_svg)

    pct = 100 * thinned.area / original_area if original_area > 0 else 0
    print(f"    Saved: {Path(output_svg).name} ({pct:.0f}% of original)")
    return True


def process_icon(icon_name: str, input_path: str, output_dir: Path, inset_amounts: list):
    """Process a single icon with multiple inset amounts."""
    print(f"\n{'='*50}")
    print(f"Processing: {icon_name}")
    print(f"{'='*50}")

    results = []

    # Create reference (0 inset)
    ref_output = output_dir / f"{icon_name}-original-ref.svg"
    if create_thin_version(input_path, str(ref_output), 0):
        results.append(("original-ref", 0, ref_output.name))

    # Create thinned versions
    for inset, suffix in inset_amounts:
        output_file = output_dir / f"{icon_name}-{suffix}.svg"
        if create_thin_version(input_path, str(output_file), inset):
            results.append((suffix, inset, output_file.name))

    return results


def create_master_preview(output_dir: Path, all_results: dict):
    """Create a master preview HTML showing all icons and versions."""

    icons_html = ""

    for icon_name, results in all_results.items():
        icon_display_name = icon_name.replace("-", " ").title()

        icons_html += f'''
    <div class="icon-section">
      <h2>{icon_display_name}</h2>
      <div class="icon-row">
'''
        # Add original from source
        icons_html += f'''
        <div class="icon-card">
          <h3>Original (source)</h3>
          <div class="preview-bg light-bg">
            <img src="../lashpop-images/services/thin/{icon_name}-icon.svg" alt="Original">
          </div>
          <p>Source file</p>
        </div>
'''

        for suffix, inset, filename in results:
            if suffix == "original-ref":
                label = "Processed (100%)"
            else:
                label = suffix.replace("-", " ").title()

            icons_html += f'''
        <div class="icon-card">
          <h3>{label}</h3>
          <div class="preview-bg light-bg">
            <img src="{filename}" alt="{label}">
          </div>
          <p>Inset: {inset}</p>
        </div>
'''

        icons_html += '''
      </div>
    </div>
'''

    html = f'''<!DOCTYPE html>
<html>
<head>
  <title>Icon Thickness Comparison - All Icons</title>
  <style>
    body {{
      font-family: system-ui, -apple-system, sans-serif;
      padding: 40px;
      background: #1a1a1a;
      color: #fff;
    }}
    h1 {{ color: #cc947f; text-align: center; }}
    h2 {{ color: #cc947f; margin-top: 40px; border-bottom: 1px solid #444; padding-bottom: 10px; }}
    .icon-section {{ margin-bottom: 50px; }}
    .icon-row {{
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      justify-content: flex-start;
    }}
    .icon-card {{
      background: #2a2a2a;
      border-radius: 12px;
      padding: 15px;
      text-align: center;
      min-width: 180px;
      max-width: 220px;
    }}
    .icon-card h3 {{
      color: #cc947f;
      font-size: 14px;
      margin: 0 0 10px 0;
    }}
    .icon-card img {{
      width: 160px;
      height: 60px;
      object-fit: contain;
    }}
    .icon-card p {{
      margin: 10px 0 0 0;
      font-size: 12px;
      color: #888;
    }}
    .preview-bg {{
      padding: 15px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60px;
    }}
    .light-bg {{ background: #f5f5f5; }}
  </style>
</head>
<body>
  <h1>Icon Thickness Comparison</h1>
  <p style="text-align: center; color: #888;">Pick the thickness you like for each icon</p>
{icons_html}
</body>
</html>
'''

    preview_path = output_dir / "master-preview.html"
    with open(preview_path, 'w') as f:
        f.write(html)

    print(f"\nMaster preview saved: {preview_path}")


def main():
    base_dir = Path("/Users/coreydylan/Developer/lashpop/public/lashpop-images/services/thin")
    output_dir = Path("/Users/coreydylan/Developer/lashpop/public/icon-tests")
    output_dir.mkdir(parents=True, exist_ok=True)

    # Icons to process
    icons = {
        "brows": base_dir / "brows-icon.svg",
        "lash-lifts": base_dir / "lash-lifts-icon.svg",
        "lashes": base_dir / "lashes-icon.svg",
    }

    # Inset amounts - different for each icon due to different sizes
    inset_configs = {
        "brows": [
            (5, "v1-slight"),
            (10, "v2-medium"),
            (15, "v3-thin"),
            (20, "v4-very-thin"),
        ],
        "lash-lifts": [
            (0.5, "v1-slight"),
            (1.0, "v2-medium"),
            (1.5, "v3-thin"),
            (2.0, "v4-very-thin"),
        ],
        "lashes": [
            (5, "v1-slight"),
            (10, "v2-medium"),
            (15, "v3-thin"),
            (20, "v4-very-thin"),
        ],
    }

    all_results = {}

    for icon_name, icon_path in icons.items():
        if icon_path.exists():
            insets = inset_configs.get(icon_name, [(5, "v1"), (10, "v2"), (15, "v3")])
            results = process_icon(icon_name, str(icon_path), output_dir, insets)
            all_results[icon_name] = results
        else:
            print(f"Warning: {icon_path} not found")

    # Create master preview
    create_master_preview(output_dir, all_results)

    print("\n" + "=" * 50)
    print("Done! Open master-preview.html to compare all icons")
    print("=" * 50)


if __name__ == "__main__":
    main()
