interface ElementImage {
  readonly width: number
  readonly height: number
  close(): void
}

interface HTMLCanvasElement {
  requestPaint(): void
  captureElementImage(element: Element): ElementImage
  updateElementGeometry(element: Element, options?: { canvasTransform?: DOMMatrixInit; preserveHitTestOrder?: boolean }): void
  clearElementGeometry(element: Element): void
  getElementTransform(element: Element): DOMMatrix
}

interface CanvasRenderingContext2D {
  drawElementImage(element: Element | ElementImage, dx: number, dy: number, dw: number, dh: number, options?: { preserveElementGeometry?: boolean }): void
}

interface WebGL2RenderingContext {
  texElementSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, element: Element, config?: { width?: number; height?: number }): void
}
