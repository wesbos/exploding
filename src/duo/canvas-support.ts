import './canvas-support.css'

export function createCanvasSupportNotice() {
  const notice = document.createElement('div')
  notice.className = 'canvas-support-notice'
  notice.innerHTML = `
    <h2>Enable HTML-in-Canvas to use apps on the phone</h2>
    <p>Your browser is missing the experimental drawing or geometry support required for interactive apps on the 3D display. Open this page in <strong>Chrome Canary</strong>, then:</p>
    <ol>
      <li>Paste <code>chrome://flags/#canvas-draw-element</code> into the address bar and set it to <strong>Enabled</strong>.</li>
      <li>Paste <code>chrome://flags/#enable-experimental-web-platform-features</code> into the address bar and set it to <strong>Enabled</strong>.</li>
      <li><strong>Relaunch Canary</strong> and reload this page.</li>
    </ol>
    <p>You can still explore the 3D model or use <strong>Apps preview</strong> for a regular HTML preview.</p>
  `
  return notice
}
