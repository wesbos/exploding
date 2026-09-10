---
name: html-in-canvas
description: Use when working with the experimental HTML-in-Canvas APIs — layoutsubtree, drawable, paint event, requestPaint, drawElementImage, texElementSubImage2D, drawElementImageToTexture, captureElementImage, ElementImage, updateElementGeometry — to render DOM/HTML into 2D, WebGL, or WebGPU canvases, sync hit-testing/accessibility geometry, or debug these APIs throwing/missing. Covers the WICG html-in-canvas proposal and the chrome://flags/#canvas-draw-element Chromium flag.
---

# HTML-in-Canvas

Experimental Chromium APIs for rendering HTML/DOM content into 2D and 3D `<canvas>`.
Source of truth: <https://github.com/WICG/html-in-canvas> (living explainer — re-fetch it when in doubt).

- Behind flag `chrome://flags/#canvas-draw-element` (Chrome Canary).
- Feature-detect before use: `typeof ctx.drawElementImage === 'function'`.
- Older demos/docs use legacy shapes: `texElementImage2D` (now `texElementSubImage2D`), `copyElementImageToTexture` (now `drawElementImageToTexture`), a `drawElementImage` that *returned* a transform to apply via `element.style.transform` (now handled by `updateElementGeometry`), and no `drawable` attribute (now required).

## The five primitives

1. **`layoutsubtree`** attribute on `<canvas>`: opts descendants into layout while keeping them non-visible until drawn. Descendants get static positioning, are not initially hit-testable, and appear in the accessibility tree without geometry.
2. **`drawable`** attribute on a canvas descendant: **required for drawing**. Implies `isolation: isolate` and makes the element a containing block. Nestable; a *drawable subtree* = the element + descendants, excluding nested `drawable` descendants.
3. **`paint`** event on `<canvas>`: fires when a `drawable` descendant's snapshot would draw differently. `event.changedElements` lists changed elements. Fires in reverse document order (descendants before ancestors). Canvas draws in the handler land in the current frame; DOM changes do not.
   - `canvas.requestPaint()`: schedules a one-shot `paint` on the next rendering opportunity even if nothing changed — the rAF analog for continuous rendering.
4. **Draw calls** — draw the last snapshot of a `drawable` element (or `ElementImage`):
   - 2D: `ctx.drawElementImage(element, dx, dy [, dw, dh] [, sx, sy, sw, sh, dx, dy, dw, dh], options?)` — like `drawImage`; source rect can outset beyond the border box (ink overflow), dest rect positions/scales.
   - WebGL: `gl.texElementSubImage2D(target, level, xoffset, yoffset, element, config?)`.
   - WebGPU: `device.queue.drawElementImageToTexture(source, destination)`.
   - `canvas.captureElementImage(element)` → transferable `ElementImage` (`width`, `height`, `close()`) for OffscreenCanvas/worker use.
5. **Geometry sync** (canvas → DOM): `canvas.updateElementGeometry(element, options)` sets hit-test order (`preserveHitTestOrder`) and the *canvas element transform* (`canvasTransform`: `DOMMatrixInit` mapping the element's border box, pre-CSS-transform, to its drawn canvas location). `clearElementGeometry()` clears; `getElementTransform()` reads (identity if unset). Setting geometry also gives the element accessibility geometry and makes it hit-testable (hit testing goes canvas → element directly, skipping intervening clips/transforms).
   - 2D `drawElementImage` runs `updateElementGeometry` automatically; disable with `{ preserveElementGeometry: true }` in `DrawElementImageOptions`.
   - WebGL/WebGPU **must** call `updateElementGeometry` explicitly.
   - Worker/OffscreenCanvas updates only accept `ElementImage`, are batched via microtask + posted to main thread; `elementgeometryupdate` event then fires on the associated `HTMLCanvasElement` (with `.elements`).

## Examples

### Basic 2D draw (interactive + accessible form)

```html
<canvas id="canvas" style="width: 400px; height: 200px;" layoutsubtree>
  <form drawable id="form_element">
    <label for="name">name:</label>
    <input id="name">
  </form>
</canvas>

<script>
  const ctx = document.getElementById('canvas').getContext('2d');

  canvas.onpaint = () => {
    ctx.reset();
    // Auto-updates geometry: hit-testing works, a11y gets geometry,
    // form.getBoundingClientRect() reflects the drawn position.
    ctx.drawElementImage(form_element, 100, 0);
  };

  canvas.requestPaint();

  // Keep the backing store matched to CSS size × DPR.
  new ResizeObserver(([entry]) => {
    canvas.width = entry.contentRect.width * devicePixelRatio;
    canvas.height = entry.contentRect.height * devicePixelRatio;
  }).observe(canvas);
</script>
```

### Transformed drawing (rotate/scale around a draw)

```js
const ctx = canvas.getContext('2d');

canvas.onpaint = () => {
  ctx.reset();
  ctx.rotate((15 * Math.PI) / 180);
  ctx.translate(80 * devicePixelRatio, -20 * devicePixelRatio);
  ctx.drawElementImage(draw_element, 0, 0);
};
canvas.requestPaint();

// Exact device pixels, avoiding DPR rounding:
new ResizeObserver(([entry]) => {
  canvas.width = entry.devicePixelContentBoxSize[0].inlineSize;
  canvas.height = entry.devicePixelContentBoxSize[0].blockSize;
}).observe(canvas, { box: 'device-pixel-content-box' });
```

Note: CSS transforms on the *source* element are ignored when drawn — rotate the *context* instead, or bake it into `canvasTransform`.

### Continuous animation loop

```js
let t = 0;
function frame() {
  t += 0.02;
  ctx.reset();
  ctx.translate(Math.sin(t) * 100 + 100, 50);
  ctx.drawElementImage(el, 0, 0);
  canvas.requestPaint(); // next paint even if el's snapshot is unchanged
}
canvas.onpaint = frame;
canvas.requestPaint();
```

### Manual geometry control (preserve + getElementTransform)

```js
// Draw twice at different spots without clobbering geometry each time:
ctx.drawElementImage(el, 0, 0);                          // sets geometry
ctx.drawElementImage(el, 500, 0, { preserveElementGeometry: true });

// Or manage it entirely by hand:
canvas.updateElementGeometry(el, {
  canvasTransform: new DOMMatrix().translate(100, 50).rotate(15),
  preserveHitTestOrder: true,
});
const m = canvas.getElementTransform(el); // DOMMatrix; identity if never set
```

### Accessibility: separate draws, preserved semantics

```html
<canvas id="canvas" layoutsubtree>
  <figure id="figure">
    <img drawable id="image" src="..." alt="image alt text" />
    <figcaption drawable id="caption">A caption</figcaption>
  </figure>
</canvas>
<script>
  canvas.onpaint = () => {
    const ctx = canvas.getContext('2d');
    ctx.reset();
    ctx.drawElementImage(image, 0, 0);      // each draw auto-updates geometry,
    ctx.drawElementImage(caption, 0, 200);  // keeping the a11y tree accurate
  };
</script>
```

Drawable elements *without* updated geometry are still exposed to a11y, but with no geometry — AT can filter them out. Hide no-longer-drawn content with `aria-hidden="true"` or remove it. Focus rings and carets **are** drawn.

### Worker + OffscreenCanvas

```js
const worker = new Worker(URL.createObjectURL(new Blob([workerCode])));
const offscreen = canvas.transferControlToOffscreen();
worker.postMessage({ canvas: offscreen }, [offscreen]);

canvas.onpaint = () => {
  const img = canvas.captureElementImage(form); // ElementImage
  worker.postMessage({ form: img }, [img]);
};

// Worker: drawElementImage also exists on OffscreenCanvasRenderingContext2D.
// Geometry updates are ElementImage-only from a worker, batched via microtask:
// (in worker) ctx.canvas.updateElementGeometry(img, { canvasTransform });
canvas.onelementgeometryupdate = (e) => {
  // e.elements — geometry now applied; e.g. form.getBoundingClientRect() updated
};
```

### WebGL

```js
const gl = canvas.getContext('webgl2');
const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);

gl.texElementSubImage2D(
  gl.TEXTURE_2D, 0, 0, 0,        // target, level, xoffset, yoffset
  draw_element,                   // drawable Element or ElementImage
  { width: 512, height: 512 },   // WebGLCopyElementImageConfig: sx, sy, swidth,
);                                // sheight, width, height

// 3D contexts must sync geometry explicitly (hit-testing + a11y):
canvas.updateElementGeometry(draw_element);
```

Redraw into the texture from `canvas.onpaint` when the element's snapshot changes.

### WebGPU

```js
const texture = device.createTexture({
  size: [512, 512],
  format: navigator.gpu.getPreferredCanvasFormat(),
  usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING,
});

device.queue.drawElementImageToTexture(
  { source: draw_element, sourceX: 0, sourceY: 0, sourceWidth: 512, sourceHeight: 512 },
  { texture, size: [512, 512] }, // GPUImageCopyTextureTagged + size
);

canvas.updateElementGeometry(draw_element); // required for 3D
```

## Constraints that throw or silently bite

- `layoutsubtree` must be present on the canvas in the latest rendering update.
- Source element must have the `drawable` attribute, generate boxes (not `display: none`), and not have other canvas ancestors.
- Drawing before the first snapshot is recorded throws — run draws inside `onpaint` (snapshots are guaranteed current there).
- Rendering starts at the element's border box, before CSS transformations.
- `layoutsubtree`/`drawable` are reflected attributes: `canvas.layoutsubtree = true` / `el.drawable = true` work in JS; declare them in JSX typings when using Preact/React.

## Frame-timing model

- Browser snapshots `drawable` elements before `paint`.
- Draw calls inside `paint` use current-frame snapshots.
- DOM changes inside `paint` apply to the *next* frame — don't expect read-back of changes you just made.

## Privacy/security (read-back-allowed rendering)

Paint output and invalidation must not leak sensitive info. Excluded from drawing and from `paint` invalidation: cross-origin embedded content (iframes, images, `<url>` refs, tainted canvases, SVG `<use>`/`<pattern>`/`<feImage>`), system colors/themes/preferences, spelling/grammar markers, visited-link state, pending autofill, subpixel text anti-aliasing, captions/video controls, IME pop-ups. Not sensitive: find-in-page/text-fragment markers, scrollbar/form appearance, caret blink rate, forced-colors.

## TypeScript declarations (until these ship)

```ts
declare global {
  interface HTMLCanvasElement {
    requestPaint(): void;
    captureElementImage(element: Element): ElementImage;
    updateElementGeometry(element: Element | ElementImage, options?: UpdateElementGeometryOptions): void;
    clearElementGeometry(element: Element | ElementImage): void;
    getElementTransform(element: Element): DOMMatrix;
    onpaint: ((event: CanvasPaintEvent) => void) | null;
    onelementgeometryupdate: ((event: ElementGeometryUpdateEvent) => void) | null;
  }
  interface CanvasRenderingContext2D {
    drawElementImage(element: Element | ElementImage, dx: number, dy: number, options?: DrawElementImageOptions): void;
    drawElementImage(element: Element | ElementImage, dx: number, dy: number, dw: number, dh: number, options?: DrawElementImageOptions): void;
    drawElementImage(element: Element | ElementImage, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw?: number, dh?: number, options?: DrawElementImageOptions): void;
  }
  interface WebGLRenderingContext {
    texElementSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, element: Element | ElementImage, config?: WebGLCopyElementImageConfig): void;
  }
  interface GPUQueue {
    drawElementImageToTexture(source: { source: Element | ElementImage; sourceX?: number; sourceY?: number; sourceWidth?: number; sourceHeight?: number }, destination: { texture: GPUTexture; size: GPUExtent3D; [key: string]: unknown }): void;
  }
  interface ElementImage { readonly width: number; readonly height: number; close(): void; }
  interface CanvasPaintEvent extends Event { readonly changedElements: ReadonlyArray<Element>; }
  interface ElementGeometryUpdateEvent extends Event { readonly elements: ReadonlyArray<Element>; }
  interface UpdateElementGeometryOptions { preserveHitTestOrder?: boolean; canvasTransform?: DOMMatrixInit; }
  interface DrawElementImageOptions { preserveElementGeometry?: boolean; }
  interface WebGLCopyElementImageConfig { sx?: GLfloat; sy?: GLfloat; swidth?: GLfloat; sheight?: GLfloat; width?: GLsizei; height?: GLsizei; }
}

export {};
```

For JSX (Preact example):

```ts
declare namespace preact.JSX {
  interface HTMLAttributes<T extends EventTarget = EventTarget> {
    layoutsubtree?: boolean;
    drawable?: boolean;
  }
}
```
