# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow>=11,<14", "shapely>=2.1,<3"]
# ///
"""Build the public-domain regional texture with `uv run scripts/build-globe-detail.py`."""

import argparse
import json
from pathlib import Path
from shutil import copyfileobj
from tempfile import TemporaryDirectory
from urllib.request import urlopen
from zipfile import ZipFile

from PIL import Image, ImageDraw
from shapely import make_valid
from shapely.geometry import box, shape


ROOT = Path(__file__).resolve().parents[1]
# These geographic bounds match the regional texture in globe.mjs.
WEST, SOUTH, EAST, NORTH = 20, 25, 52, 47
REGION = box(WEST, SOUTH, EAST, NORTH)
COAST_PIXELS_PER_DEGREE = 120
VECTOR_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson"
RELIEF_URL = "https://naciscdn.org/naturalearth/10m/raster/SR_HR.zip"
SOURCES = {
    "SR_HR.zip": RELIEF_URL,
    "ne_10m_land.geojson": f"{VECTOR_URL}/ne_10m_land.geojson",
    "ne_10m_lakes.geojson": f"{VECTOR_URL}/ne_10m_lakes.geojson",
}


def polygon_parts(geometry):
    if geometry.is_empty:
        return
    if geometry.geom_type == "Polygon":
        yield geometry
    elif hasattr(geometry, "geoms"):
        for part in geometry.geoms:
            yield from polygon_parts(part)


def regional_polygons(path, *, lakes=False):
    features = json.loads(path.read_text(encoding="utf-8"))["features"]
    for feature in features:
        if lakes and feature["properties"]["featurecla"] == "Reservoir":
            continue
        geometry = shape(feature["geometry"])
        if geometry.intersects(REGION):
            yield from polygon_parts(make_valid(geometry).intersection(REGION))


def land_mask(source, size):
    # Render the shore oversampled for clean partial coverage of small islands
    # and narrow straits before filtering down to the shipped texture size.
    supersample = COAST_PIXELS_PER_DEGREE * 2
    mask = Image.new("L", (size[0] * 2, size[1] * 2))
    draw = ImageDraw.Draw(mask)

    def pixels(ring):
        return [((x - WEST) * supersample - .5, (NORTH - y) * supersample - .5) for x, y in ring.coords]

    for layer, fill in (("land", 255), ("lakes", 0)):
        polygons = regional_polygons(source / f"ne_10m_{layer}.geojson", lakes=layer == "lakes")
        for polygon in sorted(polygons, key=lambda item: item.area, reverse=True):
            draw.polygon(pixels(polygon.exterior), fill=fill)
            for hole in polygon.interiors:
                draw.polygon(pixels(hole), fill=255 - fill)

    return mask.resize(size, Image.Resampling.LANCZOS)


def shaded_relief(source, temporary, size):
    with ZipFile(source / "SR_HR.zip") as archive:
        scale_x, _, _, scale_y, x_center, y_center = map(float, archive.read("SR_HR.tfw").split())
        x_edge = x_center - scale_x / 2
        y_edge = y_center - scale_y / 2
        left, right = (round((lon - x_edge) / scale_x) for lon in (WEST, EAST))
        top, bottom = (round((lat - y_edge) / scale_y) for lat in (NORTH, SOUTH))
        # The official large relief raster is 21600 × 10800.
        Image.MAX_IMAGE_PIXELS = 21600 * 10800
        path = temporary / "SR_HR.tif"
        with archive.open("SR_HR.tif") as raster, path.open("wb") as target:
            copyfileobj(raster, target)
        with Image.open(path) as raster:
            return raster.crop((left, top, right, bottom)).convert("L").resize(size, Image.Resampling.BICUBIC)


def download_sources(destination):
    for filename, url in SOURCES.items():
        with urlopen(url, timeout=90) as response, (destination / filename).open("wb") as file:
            copyfileobj(response, file)


def build(source, temporary):
    size = ((EAST - WEST) * COAST_PIXELS_PER_DEGREE, (NORTH - SOUTH) * COAST_PIXELS_PER_DEGREE)
    coverage = land_mask(source, size)
    relief = shaded_relief(source, temporary, size)
    texture = Image.merge("RGBA", (relief, relief, relief, coverage))
    texture.save(ROOT / "assets/globe-detail.webp", quality=87, method=6)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sources", type=Path, help="Read previously downloaded source files from this directory")
    args = parser.parse_args()
    with TemporaryDirectory() as folder:
        temporary = Path(folder)
        source = args.sources or temporary
        if not args.sources:
            download_sources(source)
        build(source, temporary)
