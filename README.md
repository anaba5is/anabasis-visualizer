# Anabasis Visualizer

A full-viewport globe and illustrated timeline of Xenophon’s *Anabasis*. Fifteen scenes follow all seven books, from Cyrus the Younger’s muster at Sardis to the handover of the surviving Greek mercenaries at Pergamum.

[Open the GitHub Pages site](https://anaba5is.github.io/anabasis-visualizer/)

## Explore the expedition

- The site opens on the whole Earth. **Route** zooms to the expedition. Drag or use the arrow keys to rotate, use the wheel or zoom buttons to move in and out, or pinch on a touch screen. **Scene** toggles the illustrated panel. The fullscreen control expands the globe beyond the browser chrome where supported.
- Select a route phase, map pin, or timeline stop to see the corresponding scene. Use **Previous**, **Next stop**, or **Play** to follow the story in order. Each selected stop has a shareable URL.
- With the map focused, use the arrow keys to rotate the globe. With a timeline stop focused, use the left and right arrows to step between stops, or Home and End to jump to the first or last scene.
- Open **Passage & image credit** to find the relevant passage from Xenophon, the location’s level of certainty, and the illustration’s source.

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

To regenerate the regional map geometry and shaded relief, install [uv](https://docs.astral.sh/uv/) and run `uv run scripts/build-map.py`. The script downloads the public-domain Natural Earth inputs and writes `assets/map-geometry.mjs` and `assets/anabasis-relief.webp`. [Natural Earth terms of use](https://www.naturalearthdata.com/about/terms-of-use/)
