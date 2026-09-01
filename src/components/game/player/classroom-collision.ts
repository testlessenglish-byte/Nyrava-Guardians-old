import * as THREE from "three";

export type ClassroomCollisionRoom = "security" | "builder" | "communication" | "truth";

export type BoxCollider = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

/**
 * Allows the player to step through an open doorway without letting them wander
 * indefinitely outside the classroom shell.
 */
export const CLASSROOM_TRAVEL_BOUNDS = {
  minX: -13.9,
  maxX: 13.35,
  minZ: -10.35,
  maxZ: 11.1,
};

const WALL_X = 12.8;
const WALL_Z = 9.8;
const WALL_HALF_THICKNESS = 0.22;
const MAIN_DOOR_HALF_WIDTH = 1.2;
const HALL_DOOR_CENTER_Z = -4.5;
const HALL_DOOR_HALF_WIDTH = 1.1;

const SECURITY_INTERIOR: BoxCollider[] = [
  // Front teaching stage.
  { minX: -7.2, maxX: 7.2, minZ: -9.55, maxZ: -7.45 },
  // Actual left/right desk rows used by AcademyClassroomSet.
  { minX: -7.9, maxX: -5.1, minZ: 1.65, maxZ: 3.35 },
  { minX: -7.9, maxX: -5.1, minZ: 5.15, maxZ: 6.85 },
  { minX: 5.1, maxX: 7.9, minZ: 1.65, maxZ: 3.35 },
  { minX: 5.1, maxX: 7.9, minZ: 5.15, maxZ: 6.85 },
  // Mission portal structure on the right wall.
  { minX: 10.55, maxX: 12.65, minZ: 0.25, maxZ: 3.75 },
];

const SIMPLE_ROOM_INTERIOR: BoxCollider[] = [
  // Builder / Communication / Truth currently share the same front stage footprint.
  { minX: -7.2, maxX: 7.2, minZ: -9.55, maxZ: -7.45 },
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
  const inMainOpening = mainDoorOpen && Math.abs(pos.x) < MAIN_DOOR_HALF_WIDTH - Math.min(radius * 0.25, 0.12);
  const touchingRearWall = pos.z + radius > WALL_Z - WALL_HALF_THICKNESS && pos.z - radius < WALL_Z + WALL_HALF_THICKNESS;
  if (touchingRearWall && !inMainOpening) return true;

  const touchingFrontWall = pos.z - radius < -WALL_Z + WALL_HALF_THICKNESS && pos.z + radius > -WALL_Z - WALL_HALF_THICKNESS;
  if (touchingFrontWall) return true;

  const hallwayOpen = room === "security" && openDoorIds.has("hallway-door");
  const inHallOpening = hallwayOpen && Math.abs(pos.z - HALL_DOOR_CENTER_Z) < HALL_DOOR_HALF_WIDTH - Math.min(radius * 0.25, 0.12);
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
