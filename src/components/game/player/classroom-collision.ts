import * as THREE from "three";

export type BoxCollider = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  radius?: number;
};

export const CLASSROOM_BOUNDS = {
  minX: -11.4,
  maxX: 11.4,
  minZ: -8.4,
  maxZ: 8.4,
};

export const CLASSROOM_COLLIDERS: BoxCollider[] = [
  // Front teaching stage & main display board
  { minX: -8.0, maxX: 8.0, minZ: -10.5, maxZ: -6.8 },

  // Student desk & chair rows
  { minX: -6.2, maxX: -4.0, minZ: 2.0, maxZ: 8.0 },
  { minX: -1.2, maxX: 1.2, minZ: 2.0, maxZ: 8.0 },
  { minX: 4.0, maxX: 6.2, minZ: 2.0, maxZ: 8.0 },

  // Left bookcase
  { minX: -11.8, maxX: -9.5, minZ: 8.0, maxZ: 11.2 },

  // Right bookcase & Portal wall area
  { minX: 9.5, maxX: 11.8, minZ: 8.0, maxZ: 11.2 },
  { minX: 9.8, maxX: 11.8, minZ: -1.5, maxZ: 1.5 }, // Portal structure
];

export function isPositionColliding(pos: THREE.Vector3, playerRadius = 0.5): boolean {
  for (const box of CLASSROOM_COLLIDERS) {
    if (
      pos.x + playerRadius > box.minX &&
      pos.x - playerRadius < box.maxX &&
      pos.z + playerRadius > box.minZ &&
      pos.z - playerRadius < box.maxZ
    ) {
      return true;
    }
  }
  return false;
}
