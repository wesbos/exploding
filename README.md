# Phoneform Lab

Interactive 3D phone models built with Three.js and TypeScript, including a folding phone with HTML apps rendered onto its inner display.

## Development

```sh
npm install
npm run dev
```

Open http://localhost:6967/.

## Browser flags for apps on the phone

The interactive app display uses experimental HTML-in-Canvas APIs. Use an up-to-date **Chrome Canary** and set both of these flags to **Enabled**:

| Flag | Purpose |
| --- | --- |
| `chrome://flags/#canvas-draw-element` | Enables drawing HTML content into the phone's canvas texture. |
| `chrome://flags/#enable-experimental-web-platform-features` | Enables experimental platform features, including the canvas geometry support needed for correctly positioned, clickable controls in current Canary builds. |

**Relaunch Canary after changing the flags**, then reload http://localhost:6967/. Drawing support alone is not enough: the app also requires geometry synchronization so buttons follow the folded display.

Click **Use apps** in the toolbar directly below the 3D phone (scroll down if necessary). This opens the phone flat and turns its displays on. Click the **Calculator** icon on the phone to launch it, and **Home** to return to the launcher.

If the toolbar says **Apps preview** instead, the browser does not expose all the required APIs. That button opens a regular HTML preview rather than rendering apps on the 3D screen. Confirm that you are using Canary, both flags are enabled, and the browser has been relaunched. These APIs are experimental and may change between browser versions.

### Headed agent-browser preview

With `agent-browser` and Chrome Canary installed on macOS, launch a visible browser with the experimental features enabled:

```sh
agent-browser --session phone-apps --headed \
  --executable-path '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary' \
  --args '--enable-experimental-web-platform-features' \
  open http://localhost:6967/
```

Use a fresh agent-browser session when changing launch flags; an already-running browser retains its original settings.
