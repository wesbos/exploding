const model = new URLSearchParams(window.location.search).get('model')
if (model === '15') {
  await import('./iphone15')
} else {
  await import('./duo/main')
}
export {}
