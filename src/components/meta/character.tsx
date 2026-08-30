import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";

/**
 * 3D Animated Kid-Guardian Models (KayKit Adventurers)
 * Custom styled for Lex, Nova, Zoey, Jacob, Dayana, and Sarah.
 * Knight helmets, capes, and medieval weapons are hidden to render clean,
 * modern 3D kid guardians wearing colorful tech hoodies with glowing chest cores.
 */
const MODELS: Record<string, string> = {
  lex: "/models/kay_Knight.glb",
  nova: "/models/kay_Mage.glb",
  zoey: "/models/kay_Rogue.glb",
  jacob: "/models/kay_Barbarian.glb",
  dayana: "/models/kay_Rogue_Hooded.glb",
  sarah: "/models/guardian.glb",
  tess: "/models/kay_Rogue.glb",
  byte: "/models/kay_Barbarian.glb",
  echo: "/models/kay_Rogue_Hooded.glb",
};
const DEFAULT_MODEL = MODELS["lex"]!;

Object.values(MODELS).forEach((url) => useGLTF.preload(url));

const FADE = 0.2;

/** Items to hide so the 3D models read as modern tech kids instead of medieval knights */
const HIDE_NODES = [
  "helmet",
  "hat",
  "cape",
  "shield",
  "sword",
  "axe",
  "dagger",
  "staff",
  "wand",
  "bow",
  "crossbow",
  "quiver",
  "arrow",
  "spellbook",
  "mug",
  "smokebomb",
  "badge",
];

function shouldHideNode(name: string) {
  const n = name.toLowerCase();
  return HIDE_NODES.some((word) => n.includes(word));
}

function pickClip(names: string[], wanted: string[]) {
  for (const want of wanted) {
    const hit = names.find((n) => n.toLowerCase() === want.toLowerCase());
    if (hit) return hit;
  }
  for (const want of wanted) {
    const hit = names.find((n) => n.toLowerCase().includes(want.toLowerCase()));
    if (hit) return hit;
  }
  return names[0];
}

export type CharacterClip = "idle" | "walk" | "run" | "talk" | "wave" | "swim";

export function Character({
  color,
  clip,
  guardianId = "lex",
  height = 1.6,
}: {
  color: string;
  clip: CharacterClip;
  guardianId?: string;
  height?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const url = (MODELS[guardianId] ?? DEFAULT_MODEL) as string;
  const gltf = useGLTF(url) as unknown as { scene: THREE.Group; animations: THREE.AnimationClip[] };
  const scene = gltf.scene;
  const animations = gltf.animations;

  const model = useMemo(() => {
    scene.updateMatrixWorld(true);
    const object = skeletonClone(scene);
    const tint = new THREE.Color(color);

    object.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;

      // Hide medieval helmets, capes, and weapons
      if (shouldHideNode(mesh.name) || shouldHideNode(mesh.parent?.name ?? "")) {
        mesh.visible = false;
        return;
      }

      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;

      const source = mesh.material as THREE.MeshStandardMaterial;
      const mat = source.clone();
      mat.vertexColors = false;

      if (mat.map) {
        mat.map.colorSpace = THREE.SRGBColorSpace;
        mat.map.anisotropy = 8;
        mat.map.needsUpdate = true;
      }

      // Guardian Color Tinting: Style body as colorful tech hoodie jacket
      if (mesh.name.toLowerCase().includes("body")) {
        mat.color.copy(tint).lerp(new THREE.Color("#0f172a"), 0.2);
        mat.emissive.copy(tint).multiplyScalar(0.2);
        mat.emissiveIntensity = 0.6;
        mat.roughness = 0.4;
        mat.metalness = 0.3;
      } else if (mesh.name.toLowerCase().includes("head")) {
        // Skin & Hair styling
        mat.color.setRGB(0.95, 0.78, 0.65); // Warm natural skin tone
        mat.roughness = 0.7;
        mat.metalness = 0.05;
      } else {
        mat.color.setRGB(1, 1, 1).lerp(tint, 0.15);
        mat.emissive.copy(tint).multiplyScalar(0.08);
        mat.emissiveIntensity = 0.3;
        mat.roughness = 0.5;
        mat.metalness = 0.2;
      }

      mat.needsUpdate = true;
      mesh.material = mat;
    });

    // Normalize model to requested height
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    if (size.y > 0.001) object.scale.setScalar(height / size.y);

    return object;
  }, [scene, color, height]);

  // Real 3D Skeletal Animation Mixer
  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model]);
  const names = useMemo(() => animations.map((a: THREE.AnimationClip) => a.name), [animations]);
  const current = useRef<THREE.AnimationAction | null>(null);

  const clipName = useMemo(() => {
    const map: Record<CharacterClip, string[]> = {
      idle: ["Idle", "Unarmed_Idle", "Standing", "Character_Idle_0"],
      walk: ["Walking_A", "Walking_B", "Walk", "Character_Walk_0"],
      run: ["Running_A", "Running_B", "Run", "Character_Run_0"],
      talk: ["Interact", "Idle"],
      wave: ["Cheer", "Idle"],
      swim: ["Walking_C", "Walking_A", "Walk"],
    };
    return pickClip(names, map[clip]);
  }, [names, clip]);

  useEffect(() => {
    const source = animations.find((a: THREE.AnimationClip) => a.name === clipName);
    if (!source) return;
    const next = mixer.clipAction(source);
    next.reset().setEffectiveWeight(1).fadeIn(FADE).play();
    next.timeScale = clip === "swim" ? 0.6 : clip === "run" ? 1.2 : 1;
    const previous = current.current;
    if (previous && previous !== next) previous.fadeOut(FADE);
    current.current = next;
  }, [mixer, animations, clipName, clip]);

  useEffect(
    () => () => {
      mixer.stopAllAction();
    },
    [mixer],
  );

  useFrame((_, delta) => mixer.update(delta));

  const swimming = clip === "swim";

  return (
    <group ref={group}>
      {/* 3D Character Rig with skeletal movement */}
      <group rotation-x={swimming ? Math.PI / 2.35 : 0} position-y={swimming ? 0.5 : 0}>
        <primitive object={model} />

        {/* Headphones Neck Ring (Tech Accessory) */}
        <mesh position={[0, height * 0.72, 0]} rotation-x={Math.PI / 6}>
          <torusGeometry args={[height * 0.12, height * 0.025, 12, 24]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} toneMapped={false} />
        </mesh>

        {/* Glowing Guardian 'N' Chest Core */}
        <mesh position={[0, height * 0.58, height * 0.12]}>
          <icosahedronGeometry args={[height * 0.05, 1]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3.5} toneMapped={false} />
        </mesh>

        {/* Dynamic Ground Aura Ring & 3D Shadow */}
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
          <ringGeometry args={[height * 0.22, height * 0.3, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.35} toneMapped={false} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
          <circleGeometry args={[height * 0.32, 32]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.4} />
        </mesh>

        <pointLight position={[0, height * 0.7, 0]} color={color} intensity={1.5} distance={height * 2.5} />
      </group>
    </group>
  );
}
