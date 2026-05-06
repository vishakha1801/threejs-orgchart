# Three.js Organization Chart

Prototype demo of a 3D org chart in React and Three.js. Built to be extended for future demos.

The hierarchy renders flat in 2D. Toggling "Show Agents" tilts the camera into 3D and reveals each person's agents along the Z axis.

## Run

```
npm i
npm run dev
```

Requires Node 18+.

## What's in

2D to 3D camera transition, view toggles (headshots, titles, locations, agents), zoom levels 1–4, click-to-detail panel, and an in-app JSON editor for the org data.

## Notes

Mock data lives in `src/data.js`. Zoom snaps the camera to discrete distances rather than collapsing tree depth. Desktop only.
