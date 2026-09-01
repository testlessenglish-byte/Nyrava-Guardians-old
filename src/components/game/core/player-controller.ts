import * as THREE from "three";
import { type GameInputState } from "./input-manager";
import { type PlayerMode, isMovementAllowed } from "./player-state-machine";

const WALK_SPEED = 4.0;
const RUN_SPEED = 6.5;
const ACCELERATION = 14;
const DECELERATION = 18;

const tempCameraForward = new THREE.Vector3();
const tempCameraRight = new THREE.Vector3();
const tempDesiredDirection = new THREE.Vector3();
const tempUp = new THREE.Vector3(0, 1, 0);
const candidatePos = new THREE.Vector3();
const candidateXOnly = new THREE.Vector3();
const candidateZOnly = new THREE.Vector3();

export function dampAngle(current: number, target: number, lambda: number, delta: number): number {
  const difference = THREE.MathUtils.euclideanModulo(target - current + Math.PI, Math.PI * 2) - Math.PI;
  return current + difference * (1 - Math.exp(-lambda * delta));
}

export class PlayerController {
  velocity = new THREE.Vector3();
  rotationY = 0;
  isMoving = false;

  update(
    playerPosition: THREE.Vector3,
    camera: THREE.Camera,
    input: GameInputState,
    mode: PlayerMode,
    delta: number,
    bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
    checkCollision?: (nextPos: THREE.Vector3) => boolean
  ) {
    if (!isMovementAllowed(mode)) {
      this.velocity.set(0, 0, 0);
      this.isMoving = false;
      return;
    }

    camera.getWorldDirection(tempCameraForward);
    tempCameraForward.y = 0;
    if (tempCameraForward.lengthSq() > 0.0001) tempCameraForward.normalize();
    else tempCameraForward.set(0, 0, -1);

    tempCameraRight.crossVectors(tempCameraForward, tempUp).normalize();
    tempDesiredDirection.set(0, 0, 0);
    tempDesiredDirection.addScaledVector(tempCameraRight, input.moveX);
    tempDesiredDirection.addScaledVector(tempCameraForward, input.moveY);

    this.isMoving = tempDesiredDirection.lengthSq() > 0.000001;
    const targetSpeed = input.run ? RUN_SPEED : WALK_SPEED;
    const rate = this.isMoving ? ACCELERATION : DECELERATION;

    this.velocity.x = THREE.MathUtils.damp(this.velocity.x, this.isMoving ? tempDesiredDirection.x * targetSpeed : 0, rate, delta);
    this.velocity.z = THREE.MathUtils.damp(this.velocity.z, this.isMoving ? tempDesiredDirection.z * targetSpeed : 0, rate, delta);

    if (this.isMoving && (Math.abs(this.velocity.x) > 0.01 || Math.abs(this.velocity.z) > 0.01)) {
      const targetRotation = Math.atan2(this.velocity.x, this.velocity.z);
      this.rotationY = dampAngle(this.rotationY, targetRotation, 12, delta);
    }

    const clampedX = THREE.MathUtils.clamp(playerPosition.x + this.velocity.x * delta, bounds.minX, bounds.maxX);
    const clampedZ = THREE.MathUtils.clamp(playerPosition.z + this.velocity.z * delta, bounds.minZ, bounds.maxZ);

    candidatePos.set(clampedX, playerPosition.y, clampedZ);
    if (!checkCollision || !checkCollision(candidatePos)) {
      playerPosition.x = clampedX;
      playerPosition.z = clampedZ;
      return;
    }

    candidateXOnly.set(clampedX, playerPosition.y, playerPosition.z);
    if (!checkCollision(candidateXOnly)) playerPosition.x = clampedX;
    else this.velocity.x = 0;

    candidateZOnly.set(playerPosition.x, playerPosition.y, clampedZ);
    if (!checkCollision(candidateZOnly)) playerPosition.z = clampedZ;
    else this.velocity.z = 0;
  }
}
