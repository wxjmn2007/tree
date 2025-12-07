import * as THREE from 'three';

export enum TreeState {
  CHAOS = 'CHAOS',
  FORMED = 'FORMED'
}

export interface OrnamentData {
  chaosPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  targetRot: THREE.Euler;
  color: THREE.Color;
  scale: number;
  speed: number; // For varying lerp speeds (heavy vs light)
}

export interface FoliageUniforms {
  uTime: { value: number };
  uProgress: { value: number };
  uColorA: { value: THREE.Color };
  uColorB: { value: THREE.Color };
}