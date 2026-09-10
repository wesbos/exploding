const model = new URLSearchParams(window.location.search).get('model')
if (model === 'duo') {
  await import('./duo/main')
} else {
  await import('./iphone15')
}
export {}
