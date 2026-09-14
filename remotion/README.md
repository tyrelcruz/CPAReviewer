# KABIS Remotion assets

Renders the animated hero visual for the landing page's "Everything you need.
All in one place." section (`frontend/src/components/landing/WhyKabisSection.tsx`).

## Develop

```
npm install
npx remotion studio src/index.ts
```

## Render

```
npm run render
```

Then copy `out/why-kabis-hero.mp4` into `frontend/src/assets/videos/`.

**Always render via `npm run render` (or with the same `--color-space=bt709
--image-format=png` flags), not a bare `remotion render`.** Without them,
Remotion's default H.264 encode shifts dark background colors noticeably
(e.g. this composition's `#2E0D0A` decoded as roughly `#270100` in-browser —
visibly mismatched from the landing page section's actual background,
breaking the "video blends seamlessly into the page" effect the whole
composition depends on). `bt709` + a lossless PNG frame pipeline fixes this;
confirmed via a canvas pixel-sample of the decoded video (see git history
around when this file was added for the exact before/after RGB values).
