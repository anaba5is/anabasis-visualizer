# Working on Anabasis Visualizer

Start with [README.md](README.md) and [historical-sources.md](historical-sources.md). Run `node --test tests/*.test.mjs` before modifying behavior.

- Keep commits focused so each change can be reviewed and reverted on its own.
- Edit the owning CSS section or module. Keep map, timeline, world catalogue, and renderer logic in their named files.
- Verify browser changes at 1024 × 768, 1440 × 900, 390 × 844, and 568 × 320. Use the [browser checklist](README.md#browser-checks) to record what passed.
- Give measurements a reproducible check. Say which browser and viewport you used. Mark physical-device and assistive-technology behavior as unverified unless tested directly.
- Give dates and disputed places source links. Political outlines show one approximate snapshot around 401 BCE.
