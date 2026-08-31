import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { cameraMovement } from "@/services/game/input";
import { Environment, Html, Lightformer, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { Character } from "./character";
import { CLASS_GUARDIANS, type ClassGuardian } from "@/lib/class-guardians";
import { getZone, type PropSpec, type Zone } from "@/lib/worlds";
import { controls, setClassState, travelTo, useClassState } from "@/lib/class-store";

const SPEED = 4.6;

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="rounded-full border border-primary/40 bg-background/80 px-4 py-2 font-mono text-sm text-foreground">
        Materialising world… {Math.round(progress)}%
      </div>
    </Html>
  );
}

function Prop({ spec }: { spec: PropSpec }) {
  const [a, b, c] = spec.size;
  return (
    <mesh
      position={spec.pos}
      rotation-x={spec.kind === "torus" ? (spec.rot ?? 0) : 0}
      castShadow
      receiveShadow
    >
      {spec.kind === "box" && <boxGeometry args={[a, b, c]} />}
      {spec.kind === "cyl" && <cylinderGeometry args={[a, b, c, 24]} />}
      {spec.kind === "cone" && <coneGeometry args={[a, b, 20]} />}
      {spec.kind === "sphere" && <sphereGeometry args={[a, 24, 20]} />}
      {spec.kind === "torus" && <torusGeometry args={[a, b, 14, 48]} />}
      <meshStandardMaterial
        color={spec.color}
        emissive={spec.emissive ?? "#000000"}
        emissiveIntensity={spec.emissiveIntensity ?? 0}
        metalness={0.45}
        roughness={0.45}
      />
    </mesh>
  );
}

function Ground({ zone }: { zone: Zone }) {
  const textures = useLoader(THREE.TextureLoader, [
    "/textures/floor_diff.jpg",
    "/textures/floor_nor_gl.jpg",
    "/textures/floor_rough.jpg",
  ]) as THREE.Texture[];
  const [map, normalMap, roughnessMap] = textures as [THREE.Texture, THREE.Texture, THREE.Texture];

  useMemo(() => {
    textures.forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(8, 8);
    });
    map.colorSpace = THREE.SRGBColorSpace;
  }, [textures, map]);

  const size = zone.radius * 2 + 6;

  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[size, size]} />
      {zone.groundTextured ? (
        <meshStandardMaterial
          key="textured"
          map={map}
          normalMap={normalMap}
          roughnessMap={roughnessMap}
          color={zone.ground}
          metalness={0.25}
        />
      ) : (
        <meshStandardMaterial key="plain" color={zone.ground} metalness={0.3} roughness={0.75} />
      )}
    </mesh>
  );
}

function World({ zone }: { zone: Zone }) {
  const R = zone.radius;
  const wall = (position: [number, number, number], rotation: number, key: string) => (
    <mesh key={key} position={position} rotation-y={rotation} receiveShadow>
      <planeGeometry args={[R * 2 + 6, 6]} />
      <meshStandardMaterial
        color="#111826"
        metalness={0.5}
        roughness={0.6}
        side={THREE.DoubleSide}
      />
    </mesh>
  );

  return (
    <group>
      <Ground zone={zone} />

      {zone.walls && (
        <>
          {wall([0, 3, -R - 2], 0, "n")}
          {wall([0, 3, R + 2], Math.PI, "s")}
          {wall([-R - 2, 3, 0], Math.PI / 2, "w")}
          {wall([R + 2, 3, 0], -Math.PI / 2, "e")}
        </>
      )}

      {/* Zone banner */}
      <mesh position={[0, 3.2, -R - 1.8]}>
        <planeGeometry args={[12, 4]} />
        <meshStandardMaterial
          color="#050b12"
          emissive={zone.accent}
          emissiveIntensity={0.45}
          metalness={0.4}
          roughness={0.2}
        />
      </mesh>
      <Html position={[0, 3.2, -R - 1.7]} transform distanceFactor={9} occlude={false}>
        <div className="w-[520px] select-none text-center font-display">
          <p className="text-4xl font-black tracking-tight" style={{ color: zone.accent }}>
            {zone.banner}
          </p>
          <p className="mt-2 text-xl text-foreground/70">{zone.bannerSub}</p>
        </div>
      </Html>

      {/* Ceiling / sky light bars */}
      {[-R * 0.5, 0, R * 0.5].map((z) => (
        <mesh key={z} position={[0, 5.8, z]}>
          <boxGeometry args={[R * 1.3, 0.15, 0.5]} />
          <meshStandardMaterial color="#0b1220" emissive={zone.accent} emissiveIntensity={1.3} />
        </mesh>
      ))}

      {zone.props.map((spec, i) => (
        <Prop key={`${zone.id}-${spec.kind}-${i}`} spec={spec} />
      ))}
    </group>
  );
}

function PortalGate({
  portal,
  accent,
}: {
  portal: { to: string; pos: [number, number]; label: string };
  accent: string;
}) {
  const ring = useRef<THREE.Mesh>(null);
  const [x, z] = portal.pos;
  const { player } = controls;
  const armed = useRef(false);

  useFrame(({ clock }, delta) => {
    if (ring.current) ring.current.rotation.z += delta * 0.8;
    const d = Math.hypot(player.x - x, player.z - z);
    if (d < 1.9 && !armed.current) {
      armed.current = true;
      travelTo(portal.to);
    }
    if (d > 3) armed.current = false;
    if (ring.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 3) * 0.04;
      ring.current.scale.setScalar(pulse);
    }
  });

  return (
    <group position={[x, 0, z]}>
      <mesh ref={ring} position={[0, 2, 0]}>
        <torusGeometry args={[1.6, 0.16, 14, 48]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.6} />
      </mesh>
      <mesh position={[0, 2, 0]}>
        <circleGeometry args={[1.5, 40]} />
        <meshStandardMaterial
          color="#04070d"
          emissive={accent}
          emissiveIntensity={0.7}
          transparent
          opacity={0.75}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
        <ringGeometry args={[1.4, 1.8, 40]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={1.1}
          transparent
          opacity={0.8}
        />
      </mesh>
      <pointLight position={[0, 2, 0]} color={accent} intensity={6} distance={9} />
      <Html position={[0, 4, 0]} center distanceFactor={12} occlude={false}>
        <div className="pointer-events-none whitespace-nowrap rounded-full bg-background/85 px-3 py-1 text-xs font-bold uppercase tracking-widest text-foreground">
          Enter · {portal.label}
        </div>
      </Html>
    </group>
  );
}

function Npc({
  guardian,
  position,
  rotation,
}: {
  guardian: ClassGuardian;
  position: [number, number, number];
  rotation: number;
}) {
  const { nearby, speaking, messages } = useClassState();
  const isNear = nearby === guardian.id;
  const isSpeaking = speaking === guardian.id;
  const last = [...messages].reverse().find((m) => m.from === guardian.id);
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.position.y = isSpeaking ? Math.sin(t * 9) * 0.04 : Math.sin(t * 1.4) * 0.01;
  });

  return (
    <group position={position} rotation-y={rotation}>
      <group ref={group}>
        <Character
          color={guardian.color}
          clip={isSpeaking ? "talk" : "idle"}
          guardianId={guardian.id}
        />
      </group>

      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.9, 1.15, 48]} />
        <meshStandardMaterial
          color={guardian.color}
          emissive={guardian.color}
          emissiveIntensity={isNear ? 2.2 : 0.8}
          transparent
          opacity={0.9}
        />
      </mesh>
      <pointLight
        position={[0, 1.6, 0]}
        color={guardian.color}
        intensity={isNear ? 8 : 3}
        distance={7}
      />

      <Html position={[0, 2.5, 0]} center distanceFactor={11} occlude={false}>
        <div className="pointer-events-none w-64 -translate-y-2 text-center">
          <span
            className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ color: guardian.color, background: "rgba(6,10,20,0.75)" }}
          >
            {guardian.name} · {guardian.role}
          </span>
          {(isSpeaking || isNear) && (
            <p className="mt-2 rounded-2xl bg-background/85 px-3 py-2 text-sm leading-snug text-foreground shadow-lg">
              {isSpeaking && last ? last.text : guardian.greeting}
            </p>
          )}
        </div>
      </Html>
    </group>
  );
}

/** Where each guardian stands in a given zone. */
function npcLayout(zone: Zone) {
  if (zone.id === "academy") {
    return zone.npcs
      .map((id) => CLASS_GUARDIANS.find((g) => g.id === id))
      .filter((g): g is ClassGuardian => Boolean(g))
      .map((g) => ({ guardian: g, position: g.position, rotation: g.rotation }));
  }
  const r = zone.radius * 0.5;
  return zone.npcs
    .map((id, i) => {
      const guardian = CLASS_GUARDIANS.find((g) => g.id === id);
      if (!guardian) return null;
      const a = (i / Math.max(zone.npcs.length, 1)) * Math.PI * 2 + Math.PI / 4;
      const position: [number, number, number] = [Math.cos(a) * r, 0, Math.sin(a) * r];
      return { guardian, position, rotation: Math.atan2(-position[0], -position[2]) };
    })
    .filter(
      (n): n is { guardian: ClassGuardian; position: [number, number, number]; rotation: number } =>
        Boolean(n),
    );
}

const move = new THREE.Vector3();
const camTarget = new THREE.Vector3();
const lookTarget = new THREE.Vector3();

function Player({
  zone,
  color,
  label,
  guardianId,
  npcs,
}: {
  zone: Zone;
  color: string;
  label: string;
  guardianId: string;
  npcs: { guardian: ClassGuardian; position: [number, number, number] }[];
}) {
  const group = useRef<THREE.Group>(null);
  const [moving, setMoving] = useState(false);
  const nearbyRef = useRef<string | null>(null);

  // snap to the spawn point whenever a new world loads
  useEffect(() => {
    if (group.current) group.current.position.set(controls.spawn.x, 0, controls.spawn.z);
  }, [zone.id]);

  useFrame(({ camera }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const player = group.current;
    if (!player) return;

    const keys = controls.keys;
    let ix = (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0);
    let iz = (keys.has("w") ? 1 : 0) - (keys.has("s") ? 1 : 0);
    ix += controls.joystick.x;
    iz -= controls.joystick.y;

    const len = Math.hypot(ix, iz);
    const isMoving = len > 0.08;
    if (isMoving) {
      const yaw = controls.cameraYaw;
      const direction = cameraMovement(ix, iz, yaw);
      move.set(direction.x, 0, direction.z);
      player.position.addScaledVector(move, SPEED * delta);
      player.position.x = THREE.MathUtils.clamp(player.position.x, -zone.radius, zone.radius);
      player.position.z = THREE.MathUtils.clamp(player.position.z, -zone.radius, zone.radius);

      const targetRot = Math.atan2(move.x, move.z);
      let diff = targetRot - player.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      player.rotation.y += diff * (1 - Math.exp(-12 * delta));
    }
    if (isMoving !== moving) setMoving(isMoving);

    controls.player.x = player.position.x;
    controls.player.z = player.position.z;

    let found: string | null = null;
    let best = 3.4;
    for (const n of npcs) {
      const d = Math.hypot(player.position.x - n.position[0], player.position.z - n.position[2]);
      if (d < best) {
        best = d;
        found = n.guardian.id;
      }
    }
    if (found !== nearbyRef.current) {
      nearbyRef.current = found;
      setClassState({ nearby: found });
    }

    const yaw = controls.cameraYaw;
    camTarget.set(
      player.position.x + Math.sin(yaw) * 8 * Math.cos(controls.cameraPitch),
      player.position.y + 2.2 + Math.sin(controls.cameraPitch) * 8,
      player.position.z + Math.cos(yaw) * 8 * Math.cos(controls.cameraPitch),
    );
    const camLimit = zone.radius - 0.8;
    const camDist = Math.hypot(camTarget.x, camTarget.z);
    if (camDist > camLimit) {
      camTarget.x = (camTarget.x / camDist) * camLimit;
      camTarget.z = (camTarget.z / camDist) * camLimit;
    }
    camera.position.lerp(camTarget, 1 - Math.exp(-6 * delta));
    lookTarget.copy(player.position);
    lookTarget.y += 1.5;
    camera.lookAt(lookTarget);
  });

  return (
    <group ref={group} position={[controls.spawn.x, 0, controls.spawn.z]}>
      <Character color={color} clip={moving ? "walk" : "idle"} guardianId={guardianId} />
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.55, 0.7, 40]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.4}
          transparent
          opacity={0.8}
        />
      </mesh>
      <pointLight position={[0, 1.7, 0]} color={color} intensity={4} distance={6} />
      <Html position={[0, 2.4, 0]} center distanceFactor={11}>
        <span className="pointer-events-none rounded-full bg-background/80 px-3 py-1 text-xs font-bold uppercase tracking-widest text-foreground">
          {label}
        </span>
      </Html>
    </group>
  );
}

export function ClassroomScene({
  playerColor = "#f4f7ff",
  playerLabel = "You",
  guardianId = "lex",
}: {
  playerColor?: string;
  playerLabel?: string;
  guardianId?: string;
}) {
  const { zone: zoneId } = useClassState();
  const zone = getZone(zoneId);
  const npcs = useMemo(() => npcLayout(zone), [zone]);

  return (
    <>
      <color attach="background" args={[zone.sky]} />
      <fog attach="fog" args={[zone.sky, 26, 70]} />
      <ambientLight intensity={0.75} />
      <hemisphereLight args={["#9fd4ff", "#101522", 0.7]} />
      <directionalLight
        position={[8, 14, 6]}
        intensity={2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <Environment>
        <Lightformer
          intensity={2.4}
          position={[0, 6, 0]}
          scale={[14, 14, 1]}
          rotation-x={Math.PI / 2}
        />
        <Lightformer
          intensity={1.2}
          color="#67e8f9"
          position={[-8, 3, -6]}
          rotation-y={Math.PI / 2}
          scale={[14, 3, 1]}
        />
        <Lightformer
          intensity={1}
          color={zone.accent}
          position={[8, 3, 6]}
          rotation-y={-Math.PI / 2}
          scale={[14, 3, 1]}
        />
      </Environment>

      <Suspense fallback={<Loader />}>
        <World key={zone.id} zone={zone} />
        {npcs.map((n) => (
          <Npc
            key={n.guardian.id}
            guardian={n.guardian}
            position={n.position}
            rotation={n.rotation}
          />
        ))}
        {zone.portals.map((p) => (
          <PortalGate key={p.to} portal={p} accent={zone.accent} />
        ))}
        <Player
          zone={zone}
          color={playerColor}
          label={playerLabel}
          guardianId={guardianId}
          npcs={npcs}
        />
      </Suspense>
    </>
  );
}
