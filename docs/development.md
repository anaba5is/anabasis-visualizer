# Development

The atlas is a static site. Edit the files in the repository root and use a local HTTP server to test changes to native JavaScript modules.

```sh
python3 -m http.server 8041 --bind 127.0.0.1
node --test tests/*.test.mjs  # Run in a separate terminal.
```

## Code map

| Area | Start here |
| --- | --- |
| App state and control wiring | [atlas.mjs](../atlas.mjs) |
| Globe and viewport | [globe.mjs](../globe.mjs), [map-viewport.mjs](../map-viewport.mjs), [layout.css](../layout.css) |
| Map overlays and label placement | [historical-layer.mjs](../historical-layer.mjs), [map-labels.mjs](../map-labels.mjs), [label-geometry.mjs](../label-geometry.mjs) |
| Timeline, playback, and scene reader | [timeline.mjs](../timeline.mjs), [playback.mjs](../playback.mjs), [scene-reader.mjs](../scene-reader.mjs), [journey-format.mjs](../journey-format.mjs) |
| Narrative and artwork | [story.mjs](../story.mjs), [scene-context.mjs](../scene-context.mjs), [scenes.mjs](../scenes.mjs) |
| World atlas and bookmarks | [world-panel.mjs](../world-panel.mjs), [world-history.mjs](../world-history.mjs), [atlas-location.mjs](../atlas-location.mjs) |

## Browser checks

Verify desktop at 1024 × 768 and 1440 × 900, then use 390 × 844 and 568 × 320 for the phone layouts.

1. Open the root URL. Begin the journey and verify that the timeline, including Pergamum, Book VII, and the scrubber, fits on desktop. Use the arrow keys and End to navigate. On phones, expand **Stops** and use the scrubber.
2. Open a scene. Check the desktop reader with the globe and timeline still interactive. Zoom in and choose another stop. The selected pin should stay beside the panel. Check focus restoration after closing. On phones, check the modal sheet.
3. Visit Mount Theches. Check that map labels clear the sea quote and that **Passages & image credit** opens the location-study link.
4. Rotate to East and Inner Asia from **Layers**, then find Monte Albán in the world catalogue. Reload its bookmark, check the world detail card and marker, and use **Return to route**.
5. In the network panel, check that a fresh phone load requests `globe-relief-compact.webp` and the route view requests `map-geometry.mjs`. Check the console for errors.

Use the [atlas audit](../audit.md) for previous measurements and reproduction notes.

## README screenshots

Capture the viewport alone, with the terrain and fonts loaded. The repository previews use Calpe Harbor with its scene open at 1440 × 900, East and Inner Asia at 1440 × 900, and Mount Theches on the map at 390 × 844. The [screenshots directory](screenshots) holds the resulting JPEGs. The phone thumbnail shows Hermann Vogel’s [public-domain illustration](https://commons.wikimedia.org/wiki/File:The_Return_of_the_Ten_Thousand_under_Xenophon.jpg).

## Generated assets

| Asset | Regenerate from the repository root |
| --- | --- |
| Approximate world polity geometry | `uv run scripts/build-world-polities.py` |
| Regional rivers | `uv run scripts/build-map.py` |
| Regional terrain and shoreline | `uv run scripts/build-globe-detail.py` |
| Scene cards and thumbnails | `node scripts/build-scene-previews.mjs` with `cwebp` and `dwebp` installed |

The globe uses [Natural Earth](https://www.naturalearthdata.com/downloads/10m-raster-data/10m-shaded-relief/) 1:50m data worldwide and a 1:10m high-detail overlay between 20°–52°E and 25°–47°N. See the [historical sources](../historical-sources.md) for the political and archaeological layers and the [font directory](../assets/fonts) for typography licenses.

## Publish

GitHub Pages deploys `main` from the repository root. After pushing, check that the Pages build serves the new commit and open the published atlas. When markup and changed styles or modules need to ship together, give those changed files a shared release query to refresh cached copies.
