import * as THREE from 'three'

interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

function packComponents(sizes: readonly { width: number; height: number }[], aspect: number) {
  const items = sizes.map((size, index) => ({ ...size, index }))
    .sort((a, b) => b.width * b.height - a.width * a.height || b.height - a.height || a.index - b.index)
  const area = items.reduce((sum, item) => sum + item.width * item.height, 0)

  // MaxRects: place each component in its tightest free rectangle, then split
  // every intersected free region so later, smaller pieces can fill the gaps.
  function fit(width: number) {
    let free: Rectangle[] = [{ x: 0, y: 0, width, height: width / aspect }]
    const placed: (Rectangle & { index: number })[] = []
    for (const item of items) {
      let best: Rectangle | undefined
      let bestShort = Infinity
      let bestLong = Infinity
      for (const space of free) {
        const dx = space.width - item.width
        const dy = space.height - item.height
        if (dx < 0 || dy < 0) continue
        const short = Math.min(dx, dy)
        const long = Math.max(dx, dy)
        if (short < bestShort || short === bestShort && long < bestLong) {
          best = space
          bestShort = short
          bestLong = long
        }
      }
      if (!best) return null
      const box = { ...item, x: best.x, y: best.y }
      placed.push(box)
      const right = box.x + box.width
      const bottom = box.y + box.height
      const split: Rectangle[] = []
      for (const space of free) {
        const spaceRight = space.x + space.width
        const spaceBottom = space.y + space.height
        if (box.x >= spaceRight || right <= space.x || box.y >= spaceBottom || bottom <= space.y) {
          split.push(space)
          continue
        }
        if (box.x > space.x) split.push({ ...space, width: box.x - space.x })
        if (right < spaceRight) split.push({ ...space, x: right, width: spaceRight - right })
        if (box.y > space.y) split.push({ ...space, height: box.y - space.y })
        if (bottom < spaceBottom) split.push({ ...space, y: bottom, height: spaceBottom - bottom })
      }
      free = split.filter((space, index) => !split.some((other, otherIndex) => {
        if (index === otherIndex) return false
        const contains = other.x <= space.x && other.y <= space.y &&
          other.x + other.width >= space.x + space.width &&
          other.y + other.height >= space.y + space.height
        const equal = other.x === space.x && other.y === space.y && other.width === space.width && other.height === space.height
        return contains && (!equal || otherIndex < index)
      }))
    }
    return placed
  }

  let lower = Math.max(Math.sqrt(area * aspect), ...items.map(item => Math.max(item.width, item.height * aspect)))
  let upper = lower
  let packed = fit(upper)
  while (!packed) {
    upper *= 1.25
    packed = fit(upper)
  }
  // Find a compact bin with the viewport's proportions, retaining the best fit.
  for (let iteration = 0; iteration < 16; iteration++) {
    const middle = (lower + upper) / 2
    const candidate = fit(middle)
    if (candidate) {
      upper = middle
      packed = candidate
    } else lower = middle
  }
  return packed
}

/** Measure complete components in their own coordinates, independent of the rig. */
export function createKnollingLayout(parts: readonly { id: string; group: THREE.Group }[], rearFacing: readonly string[] = []) {
  if (parts.length === 0) throw new Error('Cannot create a knolling layout without components')
  const entries = parts.map(({ id, group }) => {
    group.updateWorldMatrix(true, true)
    const inverse = group.matrixWorld.clone().invert()
    const bounds = new THREE.Box3()
    group.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return
      object.geometry.computeBoundingBox()
      if (object.geometry.boundingBox) {
        const matrix = inverse.clone().multiply(object.matrixWorld)
        bounds.union(object.geometry.boundingBox.clone().applyMatrix4(matrix))
      }
    })
    if (bounds.isEmpty()) throw new Error(`Cannot lay out empty component: ${id}`)
    const size = bounds.getSize(new THREE.Vector3())
    const rotation = new THREE.Quaternion()
    // Lay the thinnest dimension on the shared plane, using only right angles.
    if (size.x < size.y && size.x < size.z) rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2)
    else if (size.y < size.z) rotation.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2)
    else if (rearFacing.includes(id)) rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI)
    let aligned = bounds.clone().applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(rotation))
    const alignedSize = aligned.getSize(new THREE.Vector3())
    if (alignedSize.x > alignedSize.y) {
      rotation.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2))
      aligned = bounds.clone().applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(rotation))
    }
    return {
      group, rotation, bounds: aligned,
      position: group.position.clone(), quaternion: group.quaternion.clone(),
      destination: new THREE.Vector3(),
    }
  })
  const width = Math.max(...entries.map(entry => entry.bounds.max.x - entry.bounds.min.x))
  const height = Math.max(...entries.map(entry => entry.bounds.max.y - entry.bounds.min.y))
  const gap = Math.max(width, height) * 0.04
  const sizes = entries.map(entry => ({
    width: entry.bounds.max.x - entry.bounds.min.x + gap,
    height: entry.bounds.max.y - entry.bounds.min.y + gap,
  }))
  let previousAspect = 0
  let applied = false

  return {
    restore() {
      if (!applied) return
      for (const entry of entries) {
        entry.group.position.copy(entry.position)
        entry.group.quaternion.copy(entry.quaternion)
      }
      applied = false
    },
    apply(amount: number, aspect: number) {
      if (amount === 0) return
      if (!Number.isFinite(aspect) || aspect <= 0) throw new Error(`Invalid knolling aspect ratio: ${aspect}`)
      if (aspect !== previousAspect) {
        const packed = packComponents(sizes, aspect)
        const packedWidth = Math.max(...packed.map(box => box.x + box.width)) - gap
        const packedHeight = Math.max(...packed.map(box => box.y + box.height)) - gap
        for (const box of packed) {
          const entry = entries[box.index]
          const center = entry.bounds.getCenter(new THREE.Vector3())
          entry.destination.set(
            box.x + (box.width - gap) / 2 - packedWidth / 2 - center.x,
            packedHeight / 2 - box.y - (box.height - gap) / 2 - center.y,
            -entry.bounds.min.z,
          )
        }
        previousAspect = aspect
      }
      for (const entry of entries) {
        entry.position.copy(entry.group.position)
        entry.quaternion.copy(entry.group.quaternion)
        entry.group.position.lerp(entry.destination, amount)
        entry.group.quaternion.slerp(entry.rotation, amount)
      }
      applied = true
    },
  }
}
