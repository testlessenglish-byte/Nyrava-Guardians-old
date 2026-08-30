import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import * as THREE from "three";
import { Character } from "@/components/meta/character";
import {
  ACADEMY_DOOR,
  CRYSTALS,
  REGIONS,
  SECRETS,
  type RegionId,
} from "@/data/isla";
import {
  collectSecret,
  enterRegion,
  getIsla,
  islaControls,
  isRegionLocked,
  patchIsla,
  tryCollectCrystal,
} from "@/lib/isla-store";
import { ISLAND_RADIUS, WORLD_SCALE as S, isWalkable, terrainHeight, ws } from "@/lib/isla-terrain";

const SPEED = 9.5;
const move = new THREE.Vector3();

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function regionAt(x: number, z: number): RegionId {
  let best: RegionId = "city";
  let bestScore = Infinity;
  for (const r of REGIONS) {
    const d = Math.hypot(x - r.center[0], z - r.center[1]) - r.radius;
    if (d < bestScore) {
      bestScore = d;
      best = r.id;
    }
  }
  return best;
}

/* ------------------------------------------------------------------ terrain */

function Terrain() {
  const geometry = useMemo(() => {
    const size = ISLAND_RADIUS * 2.6;
    const seg = 300;
    const geo = new THREE.PlaneGeometry(size, size, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes['position'] as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = terrainHeight(x, z);
      pos.setY(i, h);
      const region = regionAt(x, z);
      if (h < 0.6) c.set("#e8d9a8");
      else if (region === "desert") c.set("#d9a441");
      else if (region === "beach") c.set("#f0e2b6");
      else if (region === "mountains") c.set(h > 18 ? "#e7ecff" : h > 10 ? "#7b8399" : "#4c5a52");
      else if (region === "forest") c.set("#1f6b3f");
      else if (region === "valley") c.set("#8a7a4e");
      else if (region === "spaceport") c.set("#3a4763");
      else c.set("#2f7d52");
      c.offsetHSL(0, 0, (Math.sin(x * 0.7) + Math.cos(z * 0.6)) * 0.012);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh
      geometry={geometry}
      receiveShadow
      onPointerUp={(e) => {
        if (islaControls.dragged) return;
        e.stopPropagation();
        islaControls.moveTarget = { x: e.point.x, z: e.point.z };
      }}
    >
      <meshStandardMaterial vertexColors roughness={0.96} metalness={0.02} />
    </mesh>
  );
}

function Ocean() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = Math.sin(clock.elapsedTime * 0.5) * 0.12 - 0.1;
  });
  return (
    <mesh ref={ref} rotation-x={-Math.PI / 2} position-y={-0.1}>
      <circleGeometry args={[1400, 72]} />
      <meshStandardMaterial
        color="#0e7490"
        transparent
        opacity={0.86}
        roughness={0.15}
        metalness={0.4}
        emissive="#0b3f57"
        emissiveIntensity={0.35}
      />
    </mesh>
  );
}

/* -------------------------------------------------------------------- props */

type Instance = { p: [number, number, number]; s: number; r: number };

function useScatter(
  seed: number,
  count: number,
  center: [number, number],
  radius: number,
  minHeight = 0.8,
) {
  return useMemo<Instance[]>(() => {
    const rand = mulberry32(seed);
    const out: Instance[] = [];
    let guard = 0;
    while (out.length < count && guard++ < count * 30) {
      const a = rand() * Math.PI * 2;
      const d = Math.sqrt(rand()) * radius;
      const x = center[0] + Math.cos(a) * d;
      const z = center[1] + Math.sin(a) * d;
      const y = terrainHeight(x, z);
      if (y < minHeight || !isWalkable(x, z)) continue;
      out.push({ p: [x, y, z], s: 0.7 + rand() * 0.9, r: rand() * Math.PI * 2 });
    }
    return out;
  }, [seed, count, center, radius, minHeight]);
}

function Instanced({
  items,
  color,
  children,
  yOffset = 0,
  emissive,
}: {
  items: Instance[];
  color: string;
  children: React.ReactNode;
  yOffset?: number;
  emissive?: string;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    items.forEach((item, i) => {
      dummy.position.set(item.p[0], item.p[1] + yOffset * item.s, item.p[2]);
      dummy.rotation.y = item.r;
      dummy.scale.setScalar(item.s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    // Without this the batch keeps the single-geometry bounds and the whole
    // clump vanishes as soon as you walk close to it.
    mesh.computeBoundingSphere();
    mesh.count = items.length;
  }, [items, yOffset]);

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, Math.max(items.length, 1)]}
      frustumCulled={false}
      castShadow
      receiveShadow
    >
      {children}
      <meshStandardMaterial
        color={color}
        roughness={0.8}
        emissive={emissive ?? "#000000"}
        emissiveIntensity={emissive ? 0.5 : 0}
      />
    </instancedMesh>
  );
}

function Forest() {
  const trees = useScatter(11, 420, ws([-44, -40]), 32 * S, 1.2);
  return (
    <>
      <Instanced items={trees} color="#5b3a22" yOffset={1.6}>
        <cylinderGeometry args={[0.28, 0.42, 3.4, 6]} />
      </Instanced>
      <Instanced items={trees} color="#1f8a4c" yOffset={5}>
        <coneGeometry args={[2.1, 5.2, 7]} />
      </Instanced>
      <Waterfall />
    </>
  );
}

function Waterfall() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const m = ref.current.material as THREE.MeshStandardMaterial;
      m.opacity = 0.65 + Math.sin(clock.elapsedTime * 3) * 0.1;
    }
  });
  const x = -47 * S;
  const z = -47 * S;
  return (
    <group position={[x, terrainHeight(x, z), z]}>
      <mesh ref={ref} position={[0, 3.4, 0]}>
        <planeGeometry args={[4.6, 7]} />
        <meshStandardMaterial color="#9be8ff" transparent opacity={0.7} emissive="#38bdf8" emissiveIntensity={0.6} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.06, 2.4]}>
        <circleGeometry args={[4, 24]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.75} />
      </mesh>
    </group>
  );
}

function Mountains() {
  const rocks = useScatter(21, 220, ws([44, -46]), 32 * S, 3);
  const peaks = useMemo<Instance[]>(() => {
    const rand = mulberry32(7);
    return Array.from({ length: 22 }, () => {
      const a = rand() * Math.PI * 2;
      const d = rand() * 22 * S;
      const x = 44 * S + Math.cos(a) * d;
      const z = -46 * S + Math.sin(a) * d;
      return { p: [x, terrainHeight(x, z), z] as [number, number, number], s: 1.4 + rand() * 2.2, r: rand() * 3 };
    });
  }, []);
  return (
    <>
      <Instanced items={rocks} color="#6b7280" yOffset={0.6}>
        <icosahedronGeometry args={[1.2, 0]} />
      </Instanced>
      <Instanced items={peaks} color="#94a3b8" yOffset={3.2}>
        <coneGeometry args={[3.4, 8, 6]} />
      </Instanced>
      {/* Summit observation temple */}
      <group position={[46 * S, terrainHeight(46 * S, -52 * S), -52 * S]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[Math.cos((i / 4) * Math.PI * 2) * 3.4, 2.2, Math.sin((i / 4) * Math.PI * 2) * 3.4]} castShadow>
            <cylinderGeometry args={[0.4, 0.5, 4.4, 8]} />
            <meshStandardMaterial color="#c2a373" roughness={0.9} />
          </mesh>
        ))}
        <mesh position={[0, 4.7, 0]} castShadow>
          <boxGeometry args={[9, 0.6, 9]} />
          <meshStandardMaterial color="#a5b4fc" emissive="#4338ca" emissiveIntensity={0.25} />
        </mesh>
      </group>
    </>
  );
}

function Valley() {
  const stones = useScatter(31, 150, ws([-26, 48]), 22 * S, 0.7);
  return (
    <>
      <Instanced items={stones} color="#c9b489" yOffset={1.4}>
        <cylinderGeometry args={[0.5, 0.6, 3.2, 8]} />
      </Instanced>
      <group position={[-26 * S, terrainHeight(-26 * S, 48 * S), 48 * S]}>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.07, 0]} receiveShadow>
          <ringGeometry args={[6, 12, 32]} />
          <meshStandardMaterial color="#e7d4a3" />
        </mesh>
        <mesh position={[0, 3, 0]} castShadow>
          <boxGeometry args={[2.4, 6, 2.4]} />
          <meshStandardMaterial color="#d6c396" emissive="#fbbf24" emissiveIntensity={0.15} />
        </mesh>
      </group>
    </>
  );
}

function Desert() {
  const ruins = useScatter(41, 120, ws([-58, 16]), 26 * S, 0.8);
  return (
    <Instanced items={ruins} color="#b98b3d" yOffset={1.2}>
      <boxGeometry args={[1.6, 2.6, 1.6]} />
    </Instanced>
  );
}

function Beach() {
  const palms = useScatter(51, 120, ws([30, 52]), 24 * S, 0.7);
  return (
    <>
      <Instanced items={palms} color="#8a5a2b" yOffset={2.2}>
        <cylinderGeometry args={[0.2, 0.3, 4.4, 6]} />
      </Instanced>
      <Instanced items={palms} color="#22c55e" yOffset={4.6}>
        <sphereGeometry args={[1.7, 8, 6]} />
      </Instanced>
      {/* docks + boats */}
      {[0, 1, 2].map((i) => (
        <group key={i} position={[(34 + i * 5) * S, 0.4, (62 + i * 2) * S]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[2.2, 0.3, 14]} />
            <meshStandardMaterial color="#8b5e3c" />
          </mesh>
          <mesh position={[2.6, 0.3, 5]} castShadow>
            <boxGeometry args={[2.2, 0.9, 4.4]} />
            <meshStandardMaterial color="#a9805a" roughness={0.95} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function SpacePort({ locked }: { locked: boolean }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame((_, d) => {
    if (ring.current) ring.current.rotation.z += d * 0.4;
  });
  const y = terrainHeight(62 * S, 8 * S);
  return (
    <group position={[62 * S, y, 8 * S]}>
      <mesh position={[0, 9, 0]} castShadow>
        <cylinderGeometry args={[1.6, 2.6, 18, 12]} />
        <meshStandardMaterial color="#cbb79a" metalness={0.35} roughness={0.55} />
      </mesh>
      <mesh position={[0, 19.4, 0]} castShadow>
        <coneGeometry args={[1.6, 4, 12]} />
        <meshStandardMaterial color="#c084fc" emissive="#7c3aed" emissiveIntensity={0.5} />
      </mesh>
      <mesh ref={ring} position={[0, 6, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[9, 0.3, 8, 48]} />
        <meshStandardMaterial color="#c084fc" emissive="#a855f7" emissiveIntensity={0.9} />
      </mesh>
      {locked && (
        <Text position={[0, 3, 10]} fontSize={1.5} color="#fca5a5" anchorX="center">
          🔒 LAUNCH GATE LOCKED
        </Text>
      )}
    </group>
  );
}

/** A tropical palapa hut: timber posts, sand-plaster walls, thatched roof. */
function Palapa({ position, scale = 1, rotation = 0 }: { position: [number, number, number]; scale?: number; rotation?: number }) {
  return (
    <group position={position} rotation-y={rotation} scale={scale}>
      {/* raised deck */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[3.4, 3.6, 0.7, 8]} />
        <meshStandardMaterial color="#a9805a" roughness={0.95} />
      </mesh>
      {/* walls of woven cane */}
      <mesh position={[0, 2.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.8, 3, 3.1, 8]} />
        <meshStandardMaterial color="#d9bd8c" roughness={1} />
      </mesh>
      {/* corner posts */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          position={[Math.cos((i / 4) * Math.PI * 2) * 3.1, 2.2, Math.sin((i / 4) * Math.PI * 2) * 3.1]}
          castShadow
        >
          <cylinderGeometry args={[0.16, 0.2, 4, 6]} />
          <meshStandardMaterial color="#6f4a2c" roughness={1} />
        </mesh>
      ))}
      {/* thatch roof — two stacked palm layers */}
      <mesh position={[0, 4.5, 0]} castShadow>
        <coneGeometry args={[4.6, 2.6, 8]} />
        <meshStandardMaterial color="#b98b46" roughness={1} />
      </mesh>
      <mesh position={[0, 5.6, 0]} castShadow>
        <coneGeometry args={[3.1, 2.1, 8]} />
        <meshStandardMaterial color="#9c7134" roughness={1} />
      </mesh>
      {/* warm lantern in the doorway */}
      <mesh position={[0, 1.9, 3.02]}>
        <planeGeometry args={[1.3, 2]} />
        <meshStandardMaterial color="#3b2a18" emissive="#f59e0b" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function CentralCity() {
  const towers = useMemo<Instance[]>(() => {
    const rand = mulberry32(99);
    const out: Instance[] = [];
    for (let i = 0; i < 34; i++) {
      const a = (i / 34) * Math.PI * 2 + rand() * 0.35;
      const d = (16 + rand() * 8) * S;
      const x = Math.cos(a) * d;
      const z = Math.sin(a) * d;
      out.push({ p: [x, terrainHeight(x, z), z], s: 0.8 + rand() * 1.6, r: rand() * 3 });
    }
    return out;
  }, []);

  return (
    <>
      {/* Island village: palapa huts instead of glass slabs */}
      {towers.map((hut, i) => (
        <Palapa key={i} position={hut.p} scale={0.75 + (hut.s % 1) * 0.5} rotation={hut.r} />
      ))}


      {/* Guardian Plaza */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 2.26 * S * 0.8, 0]} receiveShadow>
        <circleGeometry args={[11 * S, 64]} />
        <meshStandardMaterial color="#33465f" roughness={0.85} emissive="#0ea5e9" emissiveIntensity={0.06} />
      </mesh>

      {/* plaza inlay rings so the ground reads as built, not blank */}
      {[5, 8, 10.4].map((r) => (
        <mesh key={r} rotation-x={-Math.PI / 2} position={[0, 2.26 * S * 0.8 + 0.02, 0]}>
          <ringGeometry args={[r * S - 0.5, r * S, 72]} />
          <meshStandardMaterial color="#7dd3fc" emissive="#38bdf8" emissiveIntensity={0.7} />
        </mesh>
      ))}

      {/* Nyrava Command Center — the landmark */}
      <group position={[0, 2.26 * S * 0.8, 0]}>
        <mesh position={[0, 11, 0]} castShadow>
          <cylinderGeometry args={[2.4, 4.4, 22, 8]} />
          <meshStandardMaterial color="#c9ae86" metalness={0.25} roughness={0.6} />
        </mesh>
        <mesh position={[0, 23.4, 0]} castShadow>
          <octahedronGeometry args={[3.2, 0]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={1.2} />
        </mesh>
        <Text position={[0, 27.5, 0]} fontSize={2} color="#e0f2fe" anchorX="center">
          NYRAVA
        </Text>
      </group>

      {/* Academy entrance */}
      <group position={[ACADEMY_DOOR[0], terrainHeight(ACADEMY_DOOR[0], ACADEMY_DOOR[1]), ACADEMY_DOOR[1] - 12]}>
        <mesh position={[0, 4, 0]} castShadow receiveShadow>
          <boxGeometry args={[18, 8, 12]} />
          <meshStandardMaterial color="#d9bd8c" roughness={0.95} />
        </mesh>
        {/* thatched hip roof so the academy reads as island architecture */}
        <mesh position={[0, 9.4, 0]} rotation-y={Math.PI / 4} castShadow>
          <coneGeometry args={[14, 5, 4]} />
          <meshStandardMaterial color="#b98b46" roughness={1} />
        </mesh>
        {[-8, 8].map((x) => (
          <mesh key={x} position={[x, 4, 6]} castShadow>
            <cylinderGeometry args={[0.3, 0.36, 8, 8]} />
            <meshStandardMaterial color="#6f4a2c" roughness={1} />
          </mesh>
        ))}

        <mesh position={[0, 2.4, 6.1]}>
          <planeGeometry args={[4, 5]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#38bdf8" emissiveIntensity={0.8} />
        </mesh>
        <Text position={[0, 9.4, 0]} fontSize={1.6} color="#38bdf8" anchorX="center">
          NYRAVA ACADEMY
        </Text>
      </group>

      {/* Mission board */}
      <group position={[8 * S, terrainHeight(8 * S, 10 * S) + 1.6, 10 * S]}>
        <mesh castShadow>
          <boxGeometry args={[4, 3, 0.3]} />
          <meshStandardMaterial color="#0f172a" emissive="#22d3ee" emissiveIntensity={0.3} />
        </mesh>
        <Text position={[0, 0, 0.2]} fontSize={0.42} color="#e0f2fe" maxWidth={3.4} anchorX="center">
          CLASS 1 — DISCOVER ISLA CENTRAL
        </Text>
      </group>
    </>
  );
}

/* -------------------------------------------------------------- collectibles */

function Pickup({
  position,
  color,
  found,
  shape,
}: {
  position: [number, number];
  color: string;
  found: boolean;
  shape: "crystal" | "secret";
}) {
  const ref = useRef<THREE.Mesh>(null);
  const y = terrainHeight(position[0], position[1]);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y += 0.02;
    ref.current.position.y = 1.4 + Math.sin(clock.elapsedTime * 1.6 + position[0]) * 0.25;
  });
  if (found) return null;
  return (
    <group position={[position[0], y, position[1]]}>
      <mesh ref={ref} castShadow>
        {shape === "crystal" ? <octahedronGeometry args={[0.75, 0]} /> : <tetrahedronGeometry args={[0.55, 0]} />}
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} roughness={0.1} metalness={0.3} />
      </mesh>
      <pointLight position={[0, 1.6, 0]} color={color} intensity={7} distance={9} />
    </group>
  );
}

/* -------------------------------------------------------------------- player */

function Player({ color, name }: { color: string; name: string }) {
  const group = useRef<THREE.Group>(null);
  const [gait, setGait] = useState<"idle" | "walk" | "run" | "swim">("idle");
  const nearRef = useRef<string | null>(null);
  const regionRef = useRef<RegionId>("city");
  const vy = useRef(0);
  const airborne = useRef(false);
  const camPos = useRef(new THREE.Vector3());
  const [firstPerson, setFirstPerson] = useState(islaControls.view === "first");

  useEffect(() => {
    const onView = () => setFirstPerson(islaControls.view === "first");
    window.addEventListener("isla-view", onView);
    return () => window.removeEventListener("isla-view", onView);
  }, []);

  useEffect(() => {
    if (group.current) {
      const sx = 0;
      const sz = 12 * S;
      group.current.position.set(sx, terrainHeight(sx, sz), sz);
      islaControls.player.x = sx;
      islaControls.player.z = sz;
    }
  }, []);

  useFrame(({ camera }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const player = group.current;
    if (!player) return;
    const snapshot = getIsla();
    const busy = !!snapshot.challengeFor || snapshot.reporting;

    const keys = islaControls.keys;
    let ix = (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0);
    let iz = (keys.has("w") ? 1 : 0) - (keys.has("s") ? 1 : 0);
    ix += islaControls.joystick.x;
    iz -= islaControls.joystick.y;

    let len = Math.hypot(ix, iz);
    const yaw = islaControls.cameraYaw;

    // Camera-relative movement: forward is the direction the camera looks.
    if (len > 0.08) {
      islaControls.moveTarget = null;
      ix /= len;
      iz /= len;
      move.set(ix * Math.cos(yaw) + iz * -Math.sin(yaw), 0, -ix * Math.sin(yaw) + iz * -Math.cos(yaw));
    } else if (islaControls.moveTarget) {
      // Click-to-walk: steer toward the clicked spot until we arrive.
      const dx = islaControls.moveTarget.x - player.position.x;
      const dz = islaControls.moveTarget.z - player.position.z;
      const d = Math.hypot(dx, dz);
      if (d < 1.4) {
        islaControls.moveTarget = null;
        len = 0;
      } else {
        move.set(dx / d, 0, dz / d);
        len = 1;
      }
    } else {
      len = 0;
    }

    const sprinting = islaControls.sprint || keys.has("shift");
    const isMoving = len > 0.08 && !busy;
    if (isMoving) {
      const step = (sprinting ? SPEED * 1.85 : SPEED) * delta;
      const nx = player.position.x + move.x * step;
      const nz = player.position.z + move.z * step;
      const targetRegion = regionAt(nx, nz);
      const blocked = !isWalkable(nx, nz) || isRegionLocked(targetRegion);
      if (!blocked) {
        player.position.x = nx;
        player.position.z = nz;
      } else if (isWalkable(player.position.x, nz) && !isRegionLocked(regionAt(player.position.x, nz))) {
        player.position.z = nz;
      } else if (isWalkable(nx, player.position.z) && !isRegionLocked(regionAt(nx, player.position.z))) {
        player.position.x = nx;
      } else {
        islaControls.moveTarget = null;
      }

      const targetRot = Math.atan2(move.x, move.z);
      let diff = targetRot - player.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      player.rotation.y += diff * (1 - Math.exp(-12 * delta));
    }
    const nextGait = !isMoving ? "idle" : sprinting ? "run" : "walk";
    if (nextGait !== gait) setGait(nextGait);

    // jump + gravity
    const ground = terrainHeight(player.position.x, player.position.z);
    if (islaControls.jump) {
      islaControls.jump = false;
      if (!airborne.current && !busy) {
        vy.current = 9.5;
        airborne.current = true;
      }
    }
    if (airborne.current) {
      vy.current -= 24 * delta;
      player.position.y += vy.current * delta;
      if (player.position.y <= ground) {
        player.position.y = ground;
        vy.current = 0;
        airborne.current = false;
      }
    } else {
      player.position.y += (ground - player.position.y) * (1 - Math.exp(-18 * delta));
    }

    islaControls.player.x = player.position.x;
    islaControls.player.z = player.position.z;
    islaControls.player.y = player.position.y;

    // region tracking
    const region = regionAt(player.position.x, player.position.z);
    if (region !== regionRef.current) {
      regionRef.current = region;
      enterRegion(region);
    }

    // proximity: crystals, secrets, academy door
    let near: ReturnType<typeof getIsla>["near"] = null;
    let best = 6;
    for (const c of CRYSTALS) {
      if (snapshot.crystals.includes(c.id)) continue;
      const d = Math.hypot(player.position.x - c.position[0], player.position.z - c.position[1]);
      if (d < best) {
        best = d;
        near = { kind: "crystal", id: c.id, label: "a glowing Knowledge Crystal" };
      }
    }
    for (const sec of SECRETS) {
      if (snapshot.secrets.includes(sec.id)) continue;
      const d = Math.hypot(player.position.x - sec.position[0], player.position.z - sec.position[1]);
      if (d < best) {
        best = d;
        near = { kind: "secret", id: sec.id, label: sec.name };
      }
    }
    const dAcademy = Math.hypot(player.position.x - ACADEMY_DOOR[0], player.position.z - ACADEMY_DOOR[1]);
    if (dAcademy < 10 && dAcademy < best) {
      near = { kind: "academy", id: "academy", label: "the Nyrava Academy doors" };
    }
    const nearKey = near ? `${near.kind}:${near.id}` : null;
    if (nearKey !== nearRef.current) {
      nearRef.current = nearKey;
      patchIsla({ near });
    }

    if (islaControls.interact) {
      islaControls.interact = false;
      if (near?.kind === "crystal") tryCollectCrystal(near.id);
      if (near?.kind === "secret") {
        const secret = SECRETS.find((item) => item.id === near.id);
        if (secret) collectSecret(secret.id, secret.name, secret.note);
      }
      if (near?.kind === "academy") patchIsla({ reporting: true });
    }

    // ---- camera: first person (avatar's eyes) or orbiting third person
    const pitch = islaControls.cameraPitch;
    if (islaControls.view === "first") {
      const eye = new THREE.Vector3(
        player.position.x - Math.sin(player.rotation.y) * 0.15,
        player.position.y + 1.62,
        player.position.z - Math.cos(player.rotation.y) * 0.15,
      );
      camera.position.lerp(eye, 1 - Math.exp(-22 * delta));
      camera.lookAt(
        eye.x + Math.sin(yaw) * -10,
        eye.y - Math.sin(pitch) * 10,
        eye.z + Math.cos(yaw) * -10,
      );
    } else {
      const dist = islaControls.camDistance;
      const camTarget = new THREE.Vector3(
        player.position.x + Math.sin(yaw) * dist * Math.cos(pitch),
        player.position.y + 2.2 + dist * Math.sin(pitch) + dist * 0.18,
        player.position.z + Math.cos(yaw) * dist * Math.cos(pitch),
      );
      const camGround = terrainHeight(camTarget.x, camTarget.z) + 1.8;
      camTarget.y = Math.max(camTarget.y, camGround);
      camPos.current.copy(camera.position).lerp(camTarget, 1 - Math.exp(-8 * delta));
      camera.position.copy(camPos.current);
      camera.lookAt(player.position.x, player.position.y + 1.6, player.position.z);
    }
  });

  return (
    <>
      <group ref={group} visible={!firstPerson}>
        <Character color={color} clip={gait} height={1.8} />
        <Billboard position={[0, 2.5, 0]}>
          <Text fontSize={0.42} color="#e0f2fe" anchorX="center">
            {name}
          </Text>
        </Billboard>
      </group>
    </>
  );
}

/* --------------------------------------------------------------------- scene */

export function IslaScene({
  playerColor,
  playerName,
}: {
  playerColor: string;
  playerName: string;
}) {
  const found = getIsla();
  const crystals = found.crystals;
  const secrets = found.secrets;

  return (
    <>
      <color attach="background" args={["#8ec8ea"]} />
      <fog attach="fog" args={["#9fd4ef", 200, 620]} />
      <hemisphereLight args={["#cfe9ff", "#3b4a3f", 0.85]} />
      <directionalLight
        position={[140, 210, 90]}
        intensity={2.1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-240}
        shadow-camera-right={240}
        shadow-camera-top={240}
        shadow-camera-bottom={-240}
        shadow-camera-far={700}
      />
      <Terrain />
      <Ocean />
      <CentralCity />
      <Forest />
      <Mountains />
      <Valley />
      <Desert />
      <Beach />
      <SpacePort locked={isRegionLocked("spaceport")} />

      {CRYSTALS.map((c) => (
        <Pickup key={c.id} position={c.position} color="#38bdf8" found={crystals.includes(c.id)} shape="crystal" />
      ))}
      {SECRETS.map((s) => (
        <Pickup key={s.id} position={s.position} color="#fbbf24" found={secrets.includes(s.id)} shape="secret" />
      ))}

      <Player color={playerColor} name={playerName} />
    </>
  );
}
