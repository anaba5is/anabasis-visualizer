# /// script
# requires-python = ">=3.11"
# dependencies = ["ijson>=3.3,<4", "shapely>=2.1,<3"]
# ///
"""Build the 401 BCE world overlay from the pinned Cliopatria release."""

import argparse
from hashlib import file_digest
import json
from pathlib import Path
import re
from shutil import copyfileobj
from tempfile import TemporaryDirectory
import unicodedata
from urllib.request import urlopen
from zipfile import ZipFile

import ijson
from shapely.geometry import MultiPolygon, Polygon, shape
from shapely.geometry.polygon import orient


ROOT = Path(__file__).resolve().parents[1]
VERSION = "v0.2.2"
REPOSITORY = "Seshat-Global-History-Databank/cliopatria"
RELEASE = f"https://github.com/{REPOSITORY}/releases/tag/{VERSION}"
ARCHIVE = f"https://raw.githubusercontent.com/{REPOSITORY}/{VERSION}/cliopatria.geojson.zip"
ARCHIVE_SHA256 = "20d8e38baf8ea958d149883bc9b8e10f72c703bfdc79cb655b4fe16534c2f003"
PUBLICATION = "https://doi.org/10.1038/s41597-025-04516-9"
LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/"
YEAR = -401
SIMPLIFY_DEGREES = 0.06

# The atlas already draws its reviewed versions of these three boundaries.
LOCAL_POLITIES = {"Achaemenid Empire", "Macedonian Empire", "Odrysian Kingdom"}
DISPLAY_NAMES = {
    "Cimmerian Bosporus": "Bosporan Kingdom",
    "Greek City-States": "Greek city-states",
    "Magadha - Shaishunaga Dynasty": "Magadha",
    "Olmec Civilization": "Olmec civilization",
    "Zapotec Civilization": "Zapotec civilization",
}
DISPLAY_KINDS = {
    "Etruscans": "cultural region",
    "Greek City-States": "city-states",
    "Olmec Civilization": "cultural region",
    "Peloponnesian League": "alliance",
    "Scythia": "cultural region",
    "Yuezhi": "cultural region",
    "Zapotec Civilization": "cultural region",
}


def slug(name):
    unaccented = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", unaccented.lower()).strip("-")


def active_polity(properties):
    return (
        properties["Type"] == "POLITY"
        and properties["FromYear"] <= YEAR <= properties["ToYear"]
        and not properties.get("Components")
        and properties["Name"] not in LOCAL_POLITIES
    )


def coordinates(point, decimals=3):
    return [round(value, decimals) or 0 for value in point]


def polygon_rings(polygon, decimals):
    oriented = orient(polygon, sign=1)
    return [[coordinates(point, decimals) for point in ring.coords]
            for ring in (oriented.exterior, *oriented.interiors)]


def simplify(geometry, name):
    reduced = geometry.simplify(SIMPLIFY_DEGREES, preserve_topology=True)
    polygons = list(reduced.geoms) if reduced.geom_type == "MultiPolygon" else [reduced]
    for decimals in (3, 5):
        rings = [polygon_rings(polygon, decimals) for polygon in polygons]
        rounded = MultiPolygon([Polygon(exterior, holes) for exterior, *holes in rings])
        if rounded.is_valid and not rounded.is_empty:
            for polygon in rings:
                for ring in polygon:
                    # The atlas joins longitudes within one antimeridian span.
                    if any(abs(a[0] - b[0]) > 180 for a, b in zip(ring, ring[1:])):
                        raise ValueError(f"Antimeridian split needed for {name}")
            return rings, rounded
    raise ValueError(f"Could not round {name} without invalidating its geometry")


def entry(feature):
    properties = feature["properties"]
    source_name = properties["Name"]
    name = DISPLAY_NAMES.get(source_name, source_name)
    geometry = shape(feature["geometry"])
    if geometry.geom_type not in ("Polygon", "MultiPolygon") or not geometry.is_valid or geometry.is_empty:
        raise ValueError(f"Expected valid polygon geometry for {source_name}")
    polygons, rounded = simplify(geometry, source_name)
    principal = max(rounded.geoms, key=lambda polygon: polygon.area)
    anchor = principal.representative_point()
    return {
        "id": slug(name),
        "name": name,
        "sourceName": source_name,
        "kind": DISPLAY_KINDS.get(source_name, "polity"),
        "coords": coordinates((anchor.x, anchor.y), 5),
        "rings": [ring for polygon in polygons for ring in polygon],
        "bounds": coordinates(rounded.bounds, 5),
        "fromYear": properties["FromYear"],
        "toYear": properties["ToYear"],
        "areaKm2": round(properties["Area"]),
        "memberOf": properties.get("MemberOf", "").removeprefix("(").removesuffix(")"),
        "wikipedia": properties.get("Wikipedia", ""),
        "wikidata": properties.get("Wikidata", ""),
    }


def build(path):
    with path.open("rb") as source:
        if file_digest(source, "sha256").hexdigest() != ARCHIVE_SHA256:
            raise ValueError(f"The input archive does not match Cliopatria {VERSION}")
    with ZipFile(path) as archive, archive.open("cliopatria.geojson") as source:
        entries = [entry(feature) for feature in ijson.items(source, "features.item", use_float=True)
                   if active_polity(feature["properties"])]
    if not entries or len({item["id"] for item in entries}) != len(entries):
        raise ValueError(f"Missing or duplicate polity records at {abs(YEAR)} BCE")
    entries.sort(key=lambda item: (-item["areaKm2"], item["id"]))

    metadata = {
        "name": "Cliopatria",
        "version": VERSION,
        "year": YEAR,
        "release": RELEASE,
        "publication": PUBLICATION,
        "license": "CC BY 4.0",
        "licenseUrl": LICENSE_URL,
        "recordCount": len(entries),
    }
    header = (
        "// Bennett, Mutch, Tollefson et al., Cliopatria v0.2.2 (CC BY 4.0).\n"
        "// Generated by scripts/build-world-polities.py. Includes records spanning 401 BCE,\n"
        "// minus duplicate aggregates and the atlas’s three separately reviewed outlines.\n"
        "// Names lightly edited for display and outlines generalized. Unmapped areas\n"
        "// indicate a gap in the dataset, not the absence of people or societies.\n\n"
    )
    output = [header, f"export const worldPolitySource = {json.dumps(metadata, indent=2)};\n\n",
              "export const worldPolityGeometry = [\n"]
    output.extend(f"  {json.dumps(item, ensure_ascii=False, separators=(',', ':'))},\n" for item in entries)
    output.append("];\n")
    (ROOT / "assets/world-polity-geometry.mjs").write_text("".join(output), encoding="utf-8")
    print(f"Wrote {len(entries)} boundaries for {abs(YEAR)} BCE")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, help=f"Use a local copy of the {VERSION} zip archive")
    args = parser.parse_args()
    if args.source:
        build(args.source)
        return
    with TemporaryDirectory() as folder:
        archive = Path(folder) / "cliopatria.geojson.zip"
        with urlopen(ARCHIVE, timeout=90) as response, archive.open("wb") as target:
            copyfileobj(response, target)
        build(archive)


if __name__ == "__main__":
    main()
