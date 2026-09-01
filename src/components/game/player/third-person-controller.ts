import * as THREE from "three";

const WALK_SPEED = 4.0;
const RUN_SPEED = 6.5;
const ACCELERATION = 14;
const DECELERATION = 18;

const tempCameraForward = new THREE.Vector3();
const tempCameraRight = new THREE.Vector3();
const tempDesiredDirection = new THREE.Vector3();
const tempUp = new THREE.Vector3(0, 1, 0);

export type MovementInput = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  running?: boolean;
  joystickX?: number;
  joystickY?: number;
};

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
    input: MovementInput,
    delta: number,
    bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
    checkCollision?: (nextPos: THREE.Vector3) => boolean
  ) {
    camera.getWorldDirection(tempCameraForward);
    tempCameraForward.y = 0;
    if (tempCameraForward.lengthSq() > 0.0001) {
      tempCameraForward.normalize();
    } else {
      tempCameraForward.set(0, 0, -1);
    }

    tempCameraRight.crossVectors(tempCameraForward, tempUp).normalize();

    tempDesiredDirection.set(0, 0, 0);

    if (input.forward) tempDesiredDirection.add(tempCameraForward);
    if (input.backward) tempDesiredDirection.sub(tempCameraForward);
    if (input.right) tempDesiredDirection.add(tempCameraRight);
    if (input.left) tempDesiredDirection.sub(tempCameraRight);

    const jx = input.joystickX ?? 0;
    const jy = input.joystickY ?? 0;
    if (Math.hypot(jx, jy) > 0.08) {
      tempDesiredDirection.addScaledVector(tempCameraRight, jx);
      tempDesiredDirection.addScaledVector(tempCameraForward, -jy);
    }

    const inputLen = tempDesiredDirection.length();
    if (inputLen > 0.001) {
      tempDesiredDirection.divideScalar(Math.max(1, inputLen));
      this.isMoving = true;
    } else {
      this.isMoving = false;
    }

    const targetSpeed = input.running ? RUN_SPEED : WALK_SPEED;
    const rate = this.isMoving ? ACCELERATION : DECELERATION;

    this.velocity.x = THREE.MathUtils.damp(
      this.velocity.x,
      this.isMoving ? tempDesiredDirection.x * targetSpeed : 0,
      rate,
      delta
    );
    this.velocity.z = THREE.MathUtils.damp(
      this.velocity.z,
      this.isMoving ? tempDesiredDirection.z * targetSpeed : 0,
      rate,
      delta
    );

    if (this.isMoving && (Math.abs(this.velocity.x) > 0.01 || Math.abs(this.velocity.z) > 0.01)) {
      const targetRotation = Math.atan2(this.velocity.x, this.velocity.z);
      this.rotationY = dampAngle(this.rotationY, targetRotation, 12, delta);
    }

    const nextX = playerPosition.x + this.velocity.x * delta;
    const nextZ = playerPosition.z + this.velocity.z * delta;

    const clampedX = THREE.MathUtils.clamp(nextX, bounds.minX, bounds.maxX);
    const clampedZ = THREE.MathUtils.clamp(nextZ, bounds.minZ, bounds.maxZ);

    const candidatePos = new THREE.Vector3(clampedX, playerPosition.y, clampedZ);

    if (!checkCollision || !checkCollision(candidatePos)) {
      playerPosition.x = clampedX;
      playerPosition.z = clampedZ;
    } else {
      const candidateXOnly = new THREE.Vector3(clampedX, playerPosition.y, playerPosition.z);
      if (!checkCollision(candidateXOnly)) {
        playerPosition.x = clampedX;
      } else {
        this.velocity.x = 0;
      }

      const candidateZOnly = new THREE.Vector3(playerPosition.x, playerPosition.y, clampedZ);
      if (!checkCollision(candidateZOnly)) {
        playerPosition.z = clampedZ;
      } else {
        this.velocity.z = 0;
      }
    }
  }
}
