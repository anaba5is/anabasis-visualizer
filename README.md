# Anabasis Visualizer

A full-viewport globe and illustrated timeline of Xenophon’s *Anabasis*. Fifteen scenes follow all seven books, from Cyrus the Younger’s muster at Sardis to the handover of the surviving Greek mercenaries at Pergamum.

[Open the GitHub Pages site](https://anaba5is.github.io/anabasis-visualizer/)

## Explore the expedition

- The site opens on the whole Earth. **Begin the journey** on desktop and **Route** on any screen zoom to the expedition. Drag or use the arrow keys to rotate, use the wheel or zoom buttons to move in and out, or pinch on a touch screen. **Scene** toggles the desktop field notes. Phones keep the current scene and scrubber in one compact dock. Open **Stops** for the book rail and playback settings. The fullscreen control expands the globe beyond the browser chrome where supported.
- Select a route phase, map pin, book-band stop, or the journey scrubber to see the corresponding scene. Use **Previous**, **Next stop**, or **Play** to travel in order. Playback traces each incoming leg, and its settings offer speed and camera-follow controls. Each selected stop has a shareable URL.
- Open **Layers** to toggle the expedition, terrain relief, approximate political outlines, satrapies and seats, nearby peoples and cities, place names, or the geographic grid.
- With the map focused, use the arrow keys to rotate the globe. With a timeline stop focused, use the left and right arrows to step between stops, or Home and End to jump to the first or last scene.
- Open a scene from the desktop card or phone dock for the full image and story. Use the previous and next scene buttons in the reader to move through the account. **Passages & image credit** lists Xenophon’s passages, location certainty, and the illustration’s source.

## Run locally

Run the following command from the repository root.

```sh
python3 -m http.server 8041
```

Open [the local site](http://localhost:8041/). The static site runs without a build step or API key.

## GitHub Pages

In the repository’s Pages settings, choose **Deploy from a branch**, select `main` and `/(root)`, and save. GitHub serves the static files from that branch. [Pages settings](https://github.com/anaba5is/anabasis-visualizer/settings/pages) · [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## Sources and cartography

The route connects selected places in Xenophon’s narrative order. Lines are reconstructions, dashed legs are especially uncertain, and some pins mark broad regions or disputed sites. The physical basemap depicts modern geography. Scene imagery includes later artwork and modern views, with credits and licenses recorded in [scenes.mjs](scenes.mjs).

The map and scene controls draw on Ostellus Atlas, Chronas, Ancient Earth, earth.nullschool.net and the Guardian’s *Bussed Out*. [Design references](design-references.md)

The research notes document earlier Anabasis map projects, editions of the primary text, and scholarship on uncertain locations. [Research notes](research.md)

The high-detail terrain and shoreline use Natural Earth 1:10m data within 20°–52°E and 25°–47°N. The globe uses the coarser 1:50m layer elsewhere. [Historical borders and administrative sources](historical-sources.md) · [Natural Earth shaded relief](https://www.naturalearthdata.com/downloads/10m-raster-data/10m-shaded-relief/)

To regenerate the regional rivers, install [uv](https://docs.astral.sh/uv/) and run `uv run scripts/build-map.py`. The script downloads the public-domain Natural Earth river vectors and writes `assets/map-geometry.mjs`. [Natural Earth terms of use](https://www.naturalearthdata.com/about/terms-of-use/)

Run `uv run scripts/build-globe-detail.py` to generate the higher-resolution regional texture using Natural Earth 1:10m terrain and coastline data.

Run `node scripts/build-scene-previews.mjs` with the WebP tools `cwebp` and `dwebp` available to regenerate the phone thumbnails and desktop card previews from the full scene images.

[Design, code, performance, and narrative review](audit.md)
