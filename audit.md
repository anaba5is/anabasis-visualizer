# Atlas review and improvements

Reviewed the published atlas at `c4cb53a` in parallel across phone usability and accessibility, rendering and payload cost, and primary-text storytelling. The changes below were implemented in the static site.

## Layout

The original phone view reserved a full timeline, separate scene card, map controls and legend. The phone view now puts the selected scene and playback in a single dock with the scrubber always visible. **Stops** reveals the fifteen stops, book bands and playback settings. The Layers menu also contains the legend. Short landscape places the dock beside the map. Desktop opens with the historical premise and the globe, then reveals the field notes as the reader enters the route.

| Viewport | Unobstructed map height before | After, stops closed |
| --- | ---: | ---: |
| 320 × 568 | 130 px | 340 px |
| 390 × 844 | 393 px | 616 px |
| 568 × 320 | 86 px | 199 px |

Values are rounded browser layout measurements of the available camera area between the visible controls. The default portrait dock fell from 168 px to 98 px. The separate scene card is included in the new dock. Verified portrait and landscape geometry, slider hits, stop-list expansion, focus return, scene navigation, Layers and playback. The desktop timeline is 149 px at 1280 × 800, down from 166 px.

## Rendering and resources

- The whole-globe view skips the 880,310-byte regional texture. The high-detail image loads on a close view that can use it. The former startup prefetch of the 87,310-byte Tarsus image was removed. The initial phone scene uses a 3,248-byte preview of Sardis.
- WebGL draws directly to the visible canvas, removing a per-frame canvas copy. Scissoring limits fragment work outside the visible sphere. A 480 × 720 overview test shaded approximately 42% fewer pixels. A forced context loss and restoration test verified the Canvas 2D fallback and the return to WebGL.
- Camera viewport geometry is cached between layout changes. Overlays share the same camera projector. The renderer skips unchanged camera frames, and the river module is 18,711 bytes smaller raw with identical river geometry.

The pixel count is for the stated test camera. It measures shader work in that view. Phone viewport measurements use browser emulation.

## Narrative

The fifteen stops now follow four turning points from Cyrus’s concealed war to the survivors’ return to paid service. Chapter introductions link to Xenophon, with additional context for Cunaxa, the election of new commanders, Theches, Byzantium and the closing scene at Pergamum. The scene reader moves to the adjacent stop without closing and retains image credits and passage links. The review also corrected the Tarsus pay negotiations, the Cerasus muster and Pergamum’s regional designation. [Xenophon’s *Anabasis*](https://en.wikisource.org/wiki/Anabasis_(Dakyns))
