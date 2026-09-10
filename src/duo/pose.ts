import type { DuoPose } from './types'

function approach(value: number, destination: number, delta: number, tolerance: number) {
  const next = destination + (value - destination) * Math.exp(-7 * delta)
  return Math.abs(next - destination) < tolerance ? destination : next
}

/** Separate only in the flat service pose; reunite the layers before folding. */
export function stepPose(current: DuoPose, requested: DuoPose, delta: number, instant = false): DuoPose {
  const target = { ...requested, fold: requested.explosion > 0 ? 180 : requested.fold }
  if (instant) return target
  if (target.explosion > 0 && current.fold < 180) {
    return { fold: approach(current.fold, 180, delta, 0.04), explosion: 0 }
  }
  if (target.fold < 180 && current.explosion > 0) {
    return { fold: 180, explosion: approach(current.explosion, 0, delta, 0.0005) }
  }
  return {
    fold: approach(current.fold, target.fold, delta, 0.04),
    explosion: approach(current.explosion, target.explosion, delta, 0.0005),
  }
}
