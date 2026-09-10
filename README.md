# iPhone Duo 3D

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

Click **Use apps** in the toolbar directly below the 3D phone (scroll down if necessary). This opens the phone flat and turns its displays on. Click an app icon on the phone to launch it, and the bottom home indicator to return to the launcher.

### App interface

The Home Screen includes all 42 apps, an eight-app dock, and working app search. Click either bottom home indicator or press **Escape** to return from an app. App instances remain mounted in memory when switching, preserving their current state.

The [42-app survey and implementation plan](docs/app-plans/README.md) tracks real browser workflows, persistence, external-service handoffs, and remaining native iOS limitations. The **15 Pro** viewer also provides an **Apps preview** button for the same app library; it opens a shared two-pane HTML preview rather than drawing apps onto the 15 Pro model.

Apps release foreground resources through activation/deactivation hooks when you switch apps, close the preview, hide the page, or hide the Duo display. Settings appearance controls affect the app interface only, not the host operating system. Browser-stored data is local to this site and browser profile; use app exports for backups.

The interface targets iOS 26's app-specific typography, colors, iconography, lists, and controls without reproducing the Liquid Glass rendering effect. These are interactive HTML recreations, not iOS running in a simulator. The two-pane folding display is an adaptation rather than a pixel-identical layout from a shipping Apple device. Visual references include the [iPhone User Guide](https://support.apple.com/guide/iphone/welcome/ios), [Calculator](https://support.apple.com/guide/iphone/use-the-basic-calculator-iph1ac0b5cc/ios), and [Notes](https://support.apple.com/guide/iphone/get-started-with-notes-iph9e04f3be2/ios).

If the browser does not expose all the required APIs, an alert above the viewer explains which Canary flags to enable and how to relaunch. The toolbar also says **Apps preview** instead. That button opens a regular HTML preview rather than rendering apps on the 3D screen. Confirm that you are using Canary, both flags are enabled, and the browser has been relaunched. These APIs are experimental and may change between browser versions.

### Headed agent-browser preview

With `agent-browser` and Chrome Canary installed on macOS, launch a visible browser with the experimental features enabled:

```sh
agent-browser --session phone-apps --headed \
  --executable-path '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary' \
  --args '--enable-experimental-web-platform-features' \
  open http://localhost:6967/
```

Use a fresh agent-browser session when changing launch flags; an already-running browser retains its original settings.
