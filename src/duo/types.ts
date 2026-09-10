import * as THREE from 'three'

// Geometry units are centimetres; the source dimensions are millimetres.
export const DUO = {
  width: 16.46,
  height: 11.78,
  halfWidth: 8.10,
  gap: 0.26,
  depth: 0.52,
  halfCenter: 4.18,
  pivotZ: 0.305,
  foldedWidth: 8.41,
  foldedDepth: 1.13,
  innerWidth: 15.76,
  innerHeight: 11.08,
  coverWidth: 7.72,
  coverHeight: 11.22,
} as const

export type DuoSide = 'left' | 'right' | 'center'
export type DuoFinish = 'white' | 'night'
export type Evidence = 'documented' | 'approximation'

export interface DuoPart {
  id: string
  name: string
  detail: string
  evidence: Evidence
  side: DuoSide
  group: THREE.Group
  offset: THREE.Vector3
}

export interface DuoPose {
  /** 180 = flat open, 0 = fully closed. */
  fold: number
  explosion: number
}

export function foldRadians(degrees: number) {
  return THREE.MathUtils.degToRad(180 - THREE.MathUtils.clamp(degrees, 0, 180))
}

export function chassisOffset(side: 'left' | 'right') {
  return new THREE.Vector3(side === 'left' ? -1.5 : 1.5, 0, -0.25)
}
