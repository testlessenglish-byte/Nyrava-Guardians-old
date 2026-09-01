import * as THREE from "three";

export type ClassroomCollisionRoom = "security" | "builder" | "communication" | "truth";

export type BoxCollider = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

/**
 * Classroom movement is bounded by the visible room shell plus a short landing
 * outside the main entrance. The player should never hit invisible walls in
 * the middle of visible floor space.
 */
export const CLASSROOM_TRAVEL_BOUNDS = {
  minX: -13.4,
  maxX: 13.4,
  minZ: -10.1,
  maxZ: 14.2,
};

/** Legacy export name kept so older tests/callers do not break. */
export const CLASSROOM_BOUNDS = CLASSROOM_TRAVEL_BOUNDS;

const WALL_X = 12.8;
const WALL_Z = 9.8;
const WALL_HALF_THICKNESS = 0.22;
const MAIN_DOOR_HALF_WIDTH = 1.35;
const HALL_DOOR_CENTER_Z = -4.5;
const HALL_DOOR_HALF_WIDTH = 1.2;

const SECURITY_INTERIOR: BoxCollider[] = [
  // Front teaching stage only. The teaching display itself is wall-mounted and
  // must not create a separate invisible blocker in the room.
  { minX: -6.6, maxX: 6.6, minZ: -9.55, maxZ: -8.0 },
  // Actual left/right desk rows used by AcademyClassroomSet.
  { minX: -7.9, maxX: -5.1, minZ: 1.65, maxZ: 3.35 },
  { minX: -7.9, maxX: -5.1, minZ: 5.15, maxZ: 6.85 },
  { minX: 5.1, maxX: 7.9, minZ: 1.65, maxZ: 3.35 },
  { minX: 5.1, maxX: 7.9, minZ: 5.15, maxZ: 6.85 },
  // Only the physical base of the Mission Hub portal blocks movement. This
  // keeps the visible approach area open instead of stopping the player early.
  { minX: 11.05, maxX: 12.65, minZ: 0.65, maxZ: 3.35 },
];

/** Legacy Security-room collider list retained for compatibility. */
export const CLASSROOM_COLLIDERS = SECURITY_INTERIOR;

const SIMPLE_ROOM_INTERIOR: BoxCollider[] = [
  { minX: -6.6, maxX: 6.6, minZ: -9.55, maxZ: -8.0 },
];

const SECURITY_SEATS: Array<[number, number]> = [
  [-6.5, 3.9],
  [-5.3, 3.9],
  [-6.5, 7.4],
  [-5.3, 7.4],
  [5.3, 3.9],
  [6.5, 3.9],
];

const STANDARD_SEATS: Array<[number, number]> = [
  [-6.5, 3.9],
  [-5.3, 3.9],
  [5.3, 3.9],
  [6.5, 3.9],
];

function overlapsBox(pos: THREE.Vector3, box: BoxCollider, radius: number) {
  return (
    pos.x + radius > box.minX &&
    pos.x - radius < box.maxX &&
    pos.z + radius > box.minZ &&
    pos.z - radius < box.maxZ
  );
}

function collidesWithSeat(pos: THREE.Vector3, room: ClassroomCollisionRoom, radius: number) {
  const seats = room === "security" ? SECURITY_SEATS : STANDARD_SEATS;
  const seatRadius = 0.42;
  for (const [x, z] of seats) {
    if (Math.hypot(pos.x - x, pos.z - z) < radius + seatRadius) return true;
  }
  return false;
}

function collidesWithShell(
  room: ClassroomCollisionRoom,
  pos: THREE.Vector3,
  radius: number,
  openDoorIds: ReadonlySet<string>,
) {
  const mainDoorId = room === "security"
    ? "main-door"
    : room === "builder"
      ? "b-door-main"
      : room === "communication"
        ? "c-door-main"
        : "t-door-main";

  const mainDoorOpen = openDoorIds.has(mainDoorId);
  const inMainOpening = mainDoorOpen && Math.abs(pos.x) < MAIN_DOOR_HALF_WIDTH - Math.min(radius * 0.15, 0.08);
  const touchingRearWall = pos.z + radius > WALL_Z - WALL_HALF_THICKNESS && pos.z - radius < WALL_Z + WALL_HALF_THICKNESS;
  if (touchingRearWall && !inMainOpening) return true;

  const touchingFrontWall = pos.z - radius < -WALL_Z + WALL_HALF_THICKNESS && pos.z + radius > -WALL_Z - WALL_HALF_THICKNESS;
  if (touchingFrontWall) return true;

  const hallwayOpen = room === "security" && openDoorIds.has("hallway-door");
  const inHallOpening = hallwayOpen && Math.abs(pos.z - HALL_DOOR_CENTER_Z) < HALL_DOOR_HALF_WIDTH - Math.min(radius * 0.15, 0.08);
  const touchingLeftWall = pos.x - radius < -WALL_X + WALL_HALF_THICKNESS && pos.x + radius > -WALL_X - WALL_HALF_THICKNESS;
  if (touchingLeftWall && !inHallOpening) return true;

  const touchingRightWall = pos.x + radius > WALL_X - WALL_HALF_THICKNESS && pos.x - radius < WALL_X + WALL_HALF_THICKNESS;
  if (touchingRightWall) return true;

  return false;
}

export function isRoomPositionColliding(
  room: ClassroomCollisionRoom,
  pos: THREE.Vector3,
  openDoorIds: ReadonlySet<string> = new Set<string>(),
  playerRadius = 0.45,
): boolean {
  if (collidesWithShell(room, pos, playerRadius, openDoorIds)) return true;

  const interior = room === "security" ? SECURITY_INTERIOR : SIMPLE_ROOM_INTERIOR;
  for (const box of interior) {
    if (overlapsBox(pos, box, playerRadius)) return true;
  }

  return collidesWithSeat(pos, room, playerRadius);
}

/** Backward-compatible Security-room helper retained for existing tests/imports. */
export function isPositionColliding(pos: THREE.Vector3, playerRadius = 0.5): boolean {
  return isRoomPositionColliding("security", pos, new Set<string>(), playerRadius);
}
