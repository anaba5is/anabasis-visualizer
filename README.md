# Anabasis Visualizer

[Open the atlas](https://anaba5is.github.io/anabasis-visualizer/) to follow Xenophon’s *Anabasis* from Sardis to Pergamum. Fifteen illustrated stops cover all seven books on a rotatable globe.

## Explore

- **Begin the journey** or **Route** takes you from the globe overview to the expedition. Drag to rotate, scroll or pinch to zoom, and use **Globe** to return to the overview.
- Choose a pin, a phase, or a timeline stop. On phones, **Stops** expands the timeline. **Play** traces each incoming leg. The playback menu controls speed and camera following.
- **Layers** toggles terrain, the expedition, approximate political borders, and several kinds of labels and sites. **World view** rotates to a region. **Browse states and sites** opens the historical index with notes, sources, and globe links.
- Open the selected scene for illustrations, text, and citations. Scene links use `#stop=<id>`.
- With the globe focused, the arrow keys rotate it. With a timeline stop focused, the left and right arrows step through stops, and Home and End jump to the endpoints.

## Run locally

From the repository root:

```sh
python3 -m http.server 8041 --bind 127.0.0.1
```

Open [the local atlas](http://127.0.0.1:8041/). The site uses native JavaScript modules and self-hosted assets. It needs no build step or API key.

The loopback preview adds a **Type** menu for comparing the production fonts with Old Standard TT / Sofia Sans and the original Instrument Serif / system pairing. Direct comparison links accept `?type=greek`, `?type=scholar`, or `?type=current`.

## Code and checks

| Area | Where to start |
| --- | --- |
| App, camera, and scene navigation | [atlas.mjs](atlas.mjs) |
| Globe projection and WebGL / Canvas rendering | [globe.mjs](globe.mjs) |
| Stop and place labels | [map-labels.mjs](map-labels.mjs), [label-geometry.mjs](label-geometry.mjs) |
| Political borders and administrative labels | [historical-layer.mjs](historical-layer.mjs), [historical-data.mjs](historical-data.mjs) |
| World polities and archaeological context | [world-history.mjs](world-history.mjs), [world-sites.mjs](world-sites.mjs), [world-context-asia.mjs](world-context-asia.mjs), [world-context-west.mjs](world-context-west.mjs) |
| Timeline and playback | [timeline.mjs](timeline.mjs), [playback.mjs](playback.mjs) |
| Narrative, citations, and artwork | [story.mjs](story.mjs), [scenes.mjs](scenes.mjs) |
| Production typography | [typography.css](typography.css), [font licenses](assets/fonts) |

```sh
node --test tests/*.test.mjs
```

The tests cover label geometry near screen edges and route pins, plus dates, sources, and scope for world records. For a browser check, open an illustrated stop, toggle political borders in **Layers**, switch between **Route** and **Globe**, and try the mobile dock and scene reader.

## Publish

GitHub Pages deploys `main` from the repository root. After pushing, check the Pages build and open the published atlas. Query versions on static stylesheets and modules help clients fetch changed assets during a rollout. [Pages settings](https://github.com/anaba5is/anabasis-visualizer/settings/pages)

## Historical sources and assets

The route is a reconstruction of selected stops in Xenophon’s narrative. Dashed legs and borders indicate uncertainty. The physical terrain is modern, and the historical fills represent approximate territorial extents around 401 BCE. Artwork includes later interpretations and modern views. [Historical sources](historical-sources.md) · [Research notes](research.md) · [Design references](design-references.md)

| Generated asset | Command |
| --- | --- |
| 401 BCE world polity geometry | `uv run scripts/build-world-polities.py` |
| Regional rivers | `uv run scripts/build-map.py` |
| Regional terrain and shoreline | `uv run scripts/build-globe-detail.py` |
| Scene cards and thumbnails | `node scripts/build-scene-previews.mjs` with `cwebp` and `dwebp` installed |

The globe uses Natural Earth 1:50m data worldwide and a 1:10m high-detail overlay between 20°–52°E and 25°–47°N. [Natural Earth data](https://www.naturalearthdata.com/downloads/10m-raster-data/10m-shaded-relief/) · [Atlas audit](audit.md)
