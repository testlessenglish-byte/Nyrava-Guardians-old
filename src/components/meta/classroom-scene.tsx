import { Suspense, useMemo, useRef, useState } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { Environment, Html, Lightformer, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { Character } from "./character";
import { CLASS_GUARDIANS, type ClassGuardian } from "@/lib/class-guardians";
import { controls, setClassState, useClassState } from "@/lib/class-store";

const ROOM = 13;
const SPEED = 4.2;

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="rounded-full border border-primary/40 bg-background/80 px-4 py-2 font-mono text-sm text-foreground">
        Materialising guardians… {Math.round(progress)}%
      </div>
    </Html>
  );
}

function Furniture({
  url,
  position,
  rotation = 0,
  scale = 1,
}: {
  url: string;
  position: [number, number, number];
  rotation?: number;
  scale?: number;
}) {
  const { scene } = useGLTF(url);
  const model = useMemo(() => {
    const object = skeletonClone(scene);
    object.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return object;
  }, [scene]);
  return <primitive object={model} position={position} rotation-y={rotation} scale={scale} />;
}

function Room() {
  const textures = useLoader(THREE.TextureLoader, [
    "/textures/floor_diff.jpg",
    "/textures/floor_nor_gl.jpg",
    "/textures/floor_rough.jpg",
  ]) as THREE.Texture[];
  const [map, normalMap, roughnessMap] = textures as [
    THREE.Texture,
    THREE.Texture,
    THREE.Texture,
  ];

  useMemo(() => {
    textures.forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(8, 8);
    });
    map.colorSpace = THREE.SRGBColorSpace;
  }, [textures, map]);

  const wall = (
    position: [number, number, number],
    rotation: number,
    width: number,
    key: string,
  ) => (
    <mesh key={key} position={position} rotation-y={rotation} receiveShadow>
      <planeGeometry args={[width, 6]} />
      <meshStandardMaterial color="#141a26" metalness={0.5} roughness={0.6} side={THREE.DoubleSide} />
    </mesh>
  );

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[ROOM * 2 + 4, ROOM * 2 + 4]} />
        <meshStandardMaterial
          map={map}
          normalMap={normalMap}
          roughnessMap={roughnessMap}
          color="#5b6474"
          metalness={0.25}
        />
      </mesh>

      {wall([0, 3, -ROOM - 1], 0, ROOM * 2 + 4, "n")}
      {wall([0, 3, ROOM + 1], Math.PI, ROOM * 2 + 4, "s")}
      {wall([-ROOM - 1, 3, 0], Math.PI / 2, ROOM * 2 + 4, "w")}
      {wall([ROOM + 1, 3, 0], -Math.PI / 2, ROOM * 2 + 4, "e")}

      {/* Holographic teaching board */}
      <mesh position={[0, 3, -ROOM - 0.9]}>
        <planeGeometry args={[12, 4]} />
        <meshStandardMaterial
          color="#06121f"
          emissive="#1ea7ff"
          emissiveIntensity={0.55}
          metalness={0.4}
          roughness={0.2}
        />
      </mesh>
      <Html position={[0, 3, -ROOM - 0.8]} transform distanceFactor={9} occlude={false}>
        <div className="w-[520px] select-none text-center font-display">
          <p className="text-4xl font-black tracking-tight text-sky-200">NYRAVA LIVE CLASS</p>
          <p className="mt-2 text-xl text-sky-300/80">Today: Spotting strangers &amp; staying safe online</p>
        </div>
      </Html>

      {/* Ceiling light bars */}
      {[-6, 0, 6].map((z) => (
        <mesh key={z} position={[0, 5.6, z]}>
          <boxGeometry args={[16, 0.15, 0.5]} />
          <meshStandardMaterial color="#0b1220" emissive="#7dd3fc" emissiveIntensity={1.4} />
        </mesh>
      ))}

      {/* Student desks */}
      {[-3, 0, 3].map((z) =>
        [-3.5, 0, 3.5].map((x) => (
          <group key={`${x}-${z}`}>
            <Furniture url="/models/desk.glb" position={[x, 0, z]} scale={1.4} />
            <Furniture url="/models/chairDesk.glb" position={[x, 0, z + 1.1]} rotation={Math.PI} scale={1.4} />
          </group>
        )),
      )}
      <Furniture url="/models/bookcaseOpen.glb" position={[-11, 0, -8]} rotation={Math.PI / 2} scale={1.6} />
      <Furniture url="/models/bookcaseOpen.glb" position={[11, 0, -8]} rotation={-Math.PI / 2} scale={1.6} />
    </group>
  );
}

function Npc({ guardian }: { guardian: ClassGuardian }) {
  const { nearby, speaking, messages } = useClassState();
  const isNear = nearby === guardian.id;
  const isSpeaking = speaking === guardian.id;
  const last = [...messages].reverse().find((m) => m.from === guardian.id);
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.position.y = isSpeaking ? Math.sin(t * 9) * 0.04 : 0;
  });

  return (
    <group position={guardian.position} rotation-y={guardian.rotation}>
      <group ref={group}>
        <Character color={guardian.color} clip={isSpeaking ? "talk" : "idle"} />
      </group>

      {/* Station pad */}
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
      <pointLight position={[0, 1.6, 0]} color={guardian.color} intensity={isNear ? 8 : 3} distance={7} />

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

const move = new THREE.Vector3();
const camTarget = new THREE.Vector3();
const lookTarget = new THREE.Vector3();

function Player() {
  const group = useRef<THREE.Group>(null);
  const [moving, setMoving] = useState(false);
  const nearbyRef = useRef<string | null>(null);

  useFrame(({ camera }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const player = group.current;
    if (!player) return;

    const keys = controls.keys;
    let ix = (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0);
    let iz = (keys.has("s") ? 1 : 0) - (keys.has("w") ? 1 : 0);
    ix += controls.joystick.x;
    iz += controls.joystick.y;

    const len = Math.hypot(ix, iz);
    const isMoving = len > 0.08;
    if (isMoving) {
      ix /= len;
      iz /= len;
      const yaw = controls.cameraYaw;
      // camera-relative: forward is where the camera looks
      move.set(
        ix * Math.cos(yaw) - iz * Math.sin(yaw),
        0,
        ix * Math.sin(yaw) + iz * Math.cos(yaw),
      );
      player.position.addScaledVector(move, SPEED * delta);
      player.position.x = THREE.MathUtils.clamp(player.position.x, -ROOM, ROOM);
      player.position.z = THREE.MathUtils.clamp(player.position.z, -ROOM, ROOM);

      const targetRot = Math.atan2(move.x, move.z);
      let diff = targetRot - player.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      player.rotation.y += diff * (1 - Math.exp(-12 * delta));
    }
    if (isMoving !== moving) setMoving(isMoving);

    controls.player.x = player.position.x;
    controls.player.z = player.position.z;

    // proximity to a teaching station
    let found: string | null = null;
    let best = 3.4;
    for (const g of CLASS_GUARDIANS) {
      const d = Math.hypot(player.position.x - g.position[0], player.position.z - g.position[2]);
      if (d < best) {
        best = d;
        found = g.id;
      }
    }
    if (found !== nearbyRef.current) {
      nearbyRef.current = found;
      setClassState({ nearby: found });
    }

    // third-person orbit camera
    const yaw = controls.cameraYaw;
    camTarget.set(
      player.position.x + Math.sin(yaw) * -7,
      player.position.y + 4.2,
      player.position.z + Math.cos(yaw) * -7,
    );
    camera.position.lerp(camTarget, 1 - Math.exp(-6 * delta));
    lookTarget.copy(player.position);
    lookTarget.y += 1.5;
    camera.lookAt(lookTarget);
  });

  return (
    <group ref={group} position={[0, 0, 6]}>
      <Character color="#f4f7ff" clip={moving ? "walk" : "idle"} />
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.55, 0.7, 40]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.2} transparent opacity={0.7} />
      </mesh>
      <Html position={[0, 2.4, 0]} center distanceFactor={11}>
        <span className="pointer-events-none rounded-full bg-background/80 px-3 py-1 text-xs font-bold uppercase tracking-widest text-foreground">
          You
        </span>
      </Html>
    </group>
  );
}

export function ClassroomScene() {
  return (
    <>
      <color attach="background" args={["#060910"]} />
      <fog attach="fog" args={["#060910", 24, 60]} />
      <ambientLight intensity={0.7} />
      <hemisphereLight args={["#9fd4ff", "#101522", 0.7]} />
      <directionalLight
        position={[8, 14, 6]}
        intensity={2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <Environment>
        <Lightformer intensity={2.4} position={[0, 6, 0]} scale={[14, 14, 1]} rotation-x={Math.PI / 2} />
        <Lightformer intensity={1.2} color="#67e8f9" position={[-8, 3, -6]} rotation-y={Math.PI / 2} scale={[14, 3, 1]} />
        <Lightformer intensity={1} color="#a78bfa" position={[8, 3, 6]} rotation-y={-Math.PI / 2} scale={[14, 3, 1]} />
      </Environment>

      <Suspense fallback={<Loader />}>
        <Room />
        {CLASS_GUARDIANS.map((g) => (
          <Npc key={g.id} guardian={g} />
        ))}
        <Player />
      </Suspense>
    </>
  );
}
