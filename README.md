# Anabasis Visualizer

[Open the atlas](https://anaba5is.github.io/anabasis-visualizer/) to follow Xenophon’s *Anabasis* from Sardis to Pergamum. Fifteen illustrated stops cover all seven books on a rotatable globe.

## Explore

- **Begin the journey** or **Route** takes you from the globe overview to the expedition. Drag to rotate, scroll or pinch to zoom, and use **Globe** to return to the overview.
- Choose a pin, a phase, or a timeline stop. On phones, **Stops** expands the timeline. **Play** traces each incoming leg. The playback menu controls speed and camera following.
- **Layers** toggles terrain, the expedition, approximate political borders, and several kinds of labels and sites. **World view** rotates to a region. **Browse states and sites** opens the historical index with notes, sources, and globe links.
- Open the selected scene for illustrations, backstory, and citations. On desktop the reader sits beside the interactive globe and timeline. On phones it opens as a sheet. Scene links use `#stop=<id>`. A selected region or place gets its own information card and shareable `#world=<id>` or `#place=<id>` link.
- With the globe focused, the arrow keys rotate it. With a timeline stop focused, the left and right arrows step through stops, and Home and End jump to the endpoints.

## Run locally

From the repository root:

```sh
python3 -m http.server 8041 --bind 127.0.0.1
```

Open [the local atlas](http://127.0.0.1:8041/). The site uses native JavaScript modules and self-hosted assets. It needs no build step or API key.

## Code and checks

| Area | Where to start |
| --- | --- |
| App and camera | [atlas.mjs](atlas.mjs) |
| Scene reader | [scene-reader.mjs](scene-reader.mjs) |
| World picker, catalogue, and bookmarks | [world-panel.mjs](world-panel.mjs), [atlas-location.mjs](atlas-location.mjs) |
| Viewport, overlays, and responsive layout | [layout.css](layout.css) |
| Globe projection and WebGL / Canvas rendering | [globe.mjs](globe.mjs) |
| Stop and place labels | [map-labels.mjs](map-labels.mjs), [label-geometry.mjs](label-geometry.mjs) |
| Political borders and administrative labels | [historical-layer.mjs](historical-layer.mjs), [historical-data.mjs](historical-data.mjs) |
| World polities and archaeological context | [world-history.mjs](world-history.mjs), [world-sites.mjs](world-sites.mjs), [world-context-asia.mjs](world-context-asia.mjs), [world-context-west.mjs](world-context-west.mjs) |
| Timeline and playback | [timeline.mjs](timeline.mjs), [playback.mjs](playback.mjs) |
| Narrative, context, citations, and artwork | [story.mjs](story.mjs), [scene-context.mjs](scene-context.mjs), [scenes.mjs](scenes.mjs) |
| Production typography | [typography.css](typography.css), [font licenses](assets/fonts) |

```sh
node --test tests/*.test.mjs
```

The tests cover label geometry and pin clearance, playback, bookmarks, and journey and world data consistency.

## Browser checks

Use 1024 × 768 and 1440 × 900 for desktop, then 390 × 844 and 568 × 320 for the phone layouts.

1. Start at the root URL. Confirm the introduction and globe appear. On phones the introduction lives in the dock.
2. Choose **Begin the journey**. On desktop verify Book VII, Pergamum, and the scrubber fit inside the dock, then arrow through the stops and use End. Check that North sits beside the distance scale below the map toolbar. On phones expand **Stops** and use the scrubber.
3. At Pergamum open **Read scene**. Check that the artwork precedes the story, **Backstory** starts folded, and Close restores focus. On desktop, choose a distant stop and zoom in with the reader open. Its selected pin should stay in the clear area beside the panel. On phones confirm a modal sheet. At Theches open **Passages & image credit** and check the location study link.
4. In **Layers** rotate to East and Inner Asia. From the world index jump to Monte Albán. Reload its bookmark, check the world card and highlight, and use **Return to route**.
5. With a phone-sized viewport and a fresh reload, check the network panel for `globe-relief-compact.webp`. Switch to Route to check that `map-geometry.mjs` loads. Check the console in both views.

At 1024 × 768, the rail's `clientWidth` and `scrollWidth` should match. The [review measurements](audit.md#november-27-follow-up) give the exact probe and scope.

## Publish

GitHub Pages deploys `main` from the repository root. After pushing, check the Pages build and open the published atlas. Static modules use one URL per file. Reload after the Pages CDN picks up a new build when verifying a release. [Pages settings](https://github.com/anaba5is/anabasis-visualizer/settings/pages)

## Historical sources and assets

The route is a reconstruction of selected stops in Xenophon’s narrative. Dashed legs and borders indicate uncertainty. The physical terrain is modern, and the historical fills represent approximate territorial extents around 401 BCE. Scene artwork favors ancient objects and coins, including period analogues and objects made after the expedition. Captions identify the date, depictive scope, and source. A small number of later illustrations remain for otherwise hard-to-illustrate scenes. [Historical sources](historical-sources.md) · [Research notes](research.md) · [Design references](design-references.md)

| Generated asset | Command |
| --- | --- |
| 401 BCE world polity geometry | `uv run scripts/build-world-polities.py` |
| Regional rivers | `uv run scripts/build-map.py` |
| Regional terrain and shoreline | `uv run scripts/build-globe-detail.py` |
| Scene cards and thumbnails | `node scripts/build-scene-previews.mjs` with `cwebp` and `dwebp` installed |

The globe uses Natural Earth 1:50m data worldwide and a 1:10m high-detail overlay between 20°–52°E and 25°–47°N. [Natural Earth data](https://www.naturalearthdata.com/downloads/10m-raster-data/10m-shaded-relief/) · [Atlas audit](audit.md)
