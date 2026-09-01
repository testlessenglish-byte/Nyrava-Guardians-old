export interface GameInputState {
  moveX: number;
  moveY: number;
  lookX: number;
  lookY: number;
  run: boolean;
  jump: boolean;
  interactPressed: boolean;
  menuPressed: boolean;
  inputMethod: "keyboard" | "mouse" | "touch";
}

let gameInputPaused = false;
const managers = new Set<InputManager>();

export function setGameInputPaused(paused: boolean) {
  gameInputPaused = paused;
  if (paused) {
    managers.forEach((manager) => manager.reset());
    if (typeof window !== "undefined") window.dispatchEvent(new Event("nyrava-input-reset"));
  }
}

export function isGameInputPaused() {
  return gameInputPaused;
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}

export class InputManager {
  private keys = new Set<string>();
  private prevInteract = false;
  private currentInteract = false;
  private queuedInteract = false;

  joystickX = 0;
  joystickY = 0;
  lookDeltaX = 0;
  lookDeltaY = 0;
  sprint = false;
  jump = false;
  inputMethod: "keyboard" | "mouse" | "touch" = "keyboard";

  constructor() {
    managers.add(this);
  }

  triggerInteract() {
    if (gameInputPaused) return;
    this.queuedInteract = true;
    this.inputMethod = "touch";
  }

  onKeyDown(e: KeyboardEvent) {
    if (gameInputPaused || isTypingTarget(e.target)) return;
    const key = e.key.toLowerCase();
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
      if (key.startsWith("arrow")) e.preventDefault();
      this.keys.add(key);
      this.inputMethod = "keyboard";
    }
    if (key === "shift") this.sprint = true;
    if (key === "e") {
      this.currentInteract = true;
      this.inputMethod = "keyboard";
    }
    if (e.code === "Space") {
      e.preventDefault();
      this.jump = true;
    }
  }

  onKeyUp(e: KeyboardEvent) {
    const key = e.key.toLowerCase();
    this.keys.delete(key);
    if (key === "shift") this.sprint = false;
    if (key === "e") this.currentInteract = false;
    if (e.code === "Space") this.jump = false;
  }

  reset() {
    this.keys.clear();
    this.joystickX = 0;
    this.joystickY = 0;
    this.sprint = false;
    this.jump = false;
    this.prevInteract = false;
    this.currentInteract = false;
    this.queuedInteract = false;
  }

  dispose() {
    this.reset();
    managers.delete(this);
  }

  getSnapshot(): GameInputState {
    if (gameInputPaused) {
      return {
        moveX: 0,
        moveY: 0,
        lookX: 0,
        lookY: 0,
        run: false,
        jump: false,
        interactPressed: false,
        menuPressed: true,
        inputMethod: this.inputMethod,
      };
    }

    let moveX = 0;
    let moveY = 0;
    if (this.keys.has("w") || this.keys.has("arrowup")) moveY += 1;
    if (this.keys.has("s") || this.keys.has("arrowdown")) moveY -= 1;
    if (this.keys.has("d") || this.keys.has("arrowright")) moveX += 1;
    if (this.keys.has("a") || this.keys.has("arrowleft")) moveX -= 1;

    if (Math.hypot(this.joystickX, this.joystickY) > 0.08) {
      moveX += this.joystickX;
      moveY += -this.joystickY;
      this.inputMethod = "touch";
    }

    const len = Math.hypot(moveX, moveY);
    if (len > 1) {
      moveX /= len;
      moveY /= len;
    }

    const interactPressed = this.queuedInteract || (this.currentInteract && !this.prevInteract);
    this.queuedInteract = false;
    this.prevInteract = this.currentInteract;

    return {
      moveX,
      moveY,
      lookX: this.lookDeltaX,
      lookY: this.lookDeltaY,
      run: this.sprint,
      jump: this.jump,
      interactPressed,
      menuPressed: false,
      inputMethod: this.inputMethod,
    };
  }
}
