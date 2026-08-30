import { useRef, useState } from "react";
import { controls } from "@/lib/class-store";

/** Touch/drag joystick that writes straight into the shared control channel. */
export function Joystick() {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const active = useRef(false);

  const update = (clientX: number, clientY: number) => {
    const rect = base.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const radius = rect.width / 2;
    let dx = (clientX - cx) / radius;
    let dy = (clientY - cy) / radius;
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    controls.joystick.x = dx;
    controls.joystick.y = dy;
    setKnob({ x: dx * radius * 0.6, y: dy * radius * 0.6 });
  };

  const stop = () => {
    active.current = false;
    controls.joystick.x = 0;
    controls.joystick.y = 0;
    setKnob({ x: 0, y: 0 });
  };

  return (
    <div
      ref={base}
      onPointerDown={(e) => {
        active.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => active.current && update(e.clientX, e.clientY)}
      onPointerUp={stop}
      onPointerCancel={stop}
      className="pointer-events-auto size-32 touch-none rounded-full border border-primary/30 bg-background/40 backdrop-blur-md"
    >
      <div
        className="absolute left-1/2 top-1/2 size-12 rounded-full bg-primary/70 shadow-lg"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  );
}
