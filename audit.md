# Atlas review and improvements

Reviewed the published atlas at `c4cb53a` in parallel across phone usability and accessibility, rendering and payload cost, and primary-text storytelling. The changes below were implemented in the static site.

## Layout

The original phone view reserved a full timeline, separate scene card, map controls and legend. The phone view now puts the selected scene and playback in a single dock with the scrubber always visible. **Stops** reveals the fifteen stops, book bands and playback settings. The Layers menu also contains the legend. Short landscape places the dock beside the map. Desktop opens with the historical premise and the globe, then reveals the field notes as the reader enters the route.

| Viewport | Unobstructed map height before | After, stops closed |
| --- | ---: | ---: |
| 320 × 568 | 130 px | 340 px |
| 390 × 844 | 393 px | 616 px |
| 568 × 320 | 86 px | 199 px |

Values are rounded browser layout measurements from the earlier mobile redesign. The available camera area ran between the visible controls. The session kept the measurements in its notes. The default portrait dock fell from 168 px to 98 px. The separate scene card is included in the new dock. Verified portrait and landscape geometry, slider hits, stop-list expansion, focus return, scene navigation, Layers and playback. The desktop timeline is 149 px at 1280 × 800, down from 166 px.

## Rendering and resources

- The whole-globe view skips the 880,310-byte regional texture. The high-detail image loads on a close view that can use it. The former startup prefetch of the 87,310-byte Tarsus image was removed. The initial phone scene uses a 3,248-byte preview of Sardis.
- WebGL draws directly to the visible canvas, removing a per-frame canvas copy. Scissoring limits fragment work outside the visible sphere. Scissoring reduced the shader area in the earlier 480 × 720 overview fixture. The session did not retain a trace for a browser timing comparison. A forced context loss and restoration test verified the Canvas 2D fallback and the return to WebGL.
- Camera viewport geometry is cached between layout changes. Overlays share the same camera projector. The renderer skips unchanged camera frames, and the river module is 18,711 bytes smaller raw with identical river geometry.

Phone viewport measurements use browser emulation.

## Narrative

The fifteen stops now follow four turning points from Cyrus’s concealed war to the survivors’ return to paid service. Chapter introductions link to Xenophon, with additional context for Cunaxa, the election of new commanders, Theches, Byzantium and the closing scene at Pergamum. The scene reader moves to the adjacent stop without closing and retains image credits and passage links. The review also corrected the Tarsus pay negotiations, the Cerasus muster and Pergamum’s regional designation. [Xenophon’s *Anabasis*](https://en.wikisource.org/wiki/Anabasis_(Dakyns))


## November 27 follow-up

Claude reproduced a clipped desktop timeline, overlapping route labels, a cropped scene action, and missing context after world jumps at the cited viewports. The follow-up fixes those cases and adds a phone opening, approximate date labels, and source context for Theches and later artwork.

The 1024 × 768 Chromium check selected Pergamum from the timeline and measured the following in the page.

```js
const rail = document.querySelector('#journey-stations');
const end = document.querySelector('.route-timeline__stop[aria-current]').getBoundingClientRect();
const action = document.querySelector('.scene-action-label').getBoundingClientRect();
const card = document.querySelector('#story-panel').getBoundingClientRect();
console.log({
  rail: [rail.clientWidth, rail.scrollWidth],
  endVisible: end.right <= rail.getBoundingClientRect().right,
  actionBottom: Math.round(action.bottom),
  cardBottom: Math.round(card.bottom),
});
```

The widths were 967 and 967 px. The selected last stop fit. The action ended at y=582 px inside the card's y=591 px boundary. The visible stop-label and pin rectangles showed zero intersections in that view.

The 390 × 844 fresh-load resource inventory showed the compact globe and world catalogue, with river geometry deferred. The disk sizes are reproducible with `wc -c assets/globe-relief*.webp` (793,366 bytes for the full image and 230,616 bytes for the compact image). These are asset sizes. Chromium emulation was used for phone and landscape checks.
