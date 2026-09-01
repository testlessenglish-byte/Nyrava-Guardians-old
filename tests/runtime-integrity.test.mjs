import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { InputManager } from "../src/components/game/core/input-manager.ts";
import { isRoomPositionColliding } from "../src/components/game/player/classroom-collision.ts";

function keyEvent(key, { repeat = false, code = key === " " ? "Space" : `Key${key.toUpperCase()}` } = {}) {
  return {
    key,
    code,
    repeat,
    target: null,
    preventDefault() {},
  };
}

test("keyboard interact is consumed exactly once per physical E press", () => {
  const manager = new InputManager();
  manager.onKeyDown(keyEvent("e"));
  assert.equal(manager.getSnapshot().interactPressed, true);
  assert.equal(manager.getSnapshot().interactPressed, false);

  manager.onKeyDown(keyEvent("e", { repeat: true }));
  assert.equal(manager.getSnapshot().interactPressed, false);

  manager.onKeyUp(keyEvent("e"));
  manager.onKeyDown(keyEvent("e"));
  assert.equal(manager.getSnapshot().interactPressed, true);
  manager.dispose();
});

test("touch interact is queued for one frame only", () => {
  const manager = new InputManager();
  manager.triggerInteract();
  assert.equal(manager.getSnapshot().interactPressed, true);
  assert.equal(manager.getSnapshot().interactPressed, false);
  manager.dispose();
});

test("disabled runtime input cannot move or interact", () => {
  const manager = new InputManager();
  manager.onKeyDown(keyEvent("w"));
  manager.triggerInteract();
  manager.setEnabled(false);
  const snapshot = manager.getSnapshot();
  assert.equal(snapshot.moveY, 0);
  assert.equal(snapshot.interactPressed, false);
  manager.dispose();
});

test("closed classroom main door blocks the wall opening", () => {
  const position = new THREE.Vector3(0, 0, 9.8);
  assert.equal(isRoomPositionColliding("security", position, new Set()), true);
});

test("open classroom main door creates a passable collision opening", () => {
  const position = new THREE.Vector3(0, 0, 9.8);
  assert.equal(isRoomPositionColliding("security", position, new Set(["main-door"])), false);
});

test("wall remains solid beside an open classroom door", () => {
  const position = new THREE.Vector3(4, 0, 9.8);
  assert.equal(isRoomPositionColliding("security", position, new Set(["main-door"])), true);
});

test("non-security rooms use their own stage and seat collision instead of Security desk rows", () => {
  assert.equal(isRoomPositionColliding("builder", new THREE.Vector3(0, 0, -8.8), new Set()), true);
  assert.equal(isRoomPositionColliding("builder", new THREE.Vector3(-6.5, 0, 3.9), new Set()), true);
  assert.equal(isRoomPositionColliding("builder", new THREE.Vector3(0, 0, 4.5), new Set()), false);
});
