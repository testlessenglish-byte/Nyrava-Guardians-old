import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";

/**
 * Kid-guardian avatars — KayKit "Adventurers" (CC0, Kay Lousberg).
 * Chunky, big-head stylised proportions that read as kid guardians, each
 * guardian gets its own body plus a neon armour rim in its signature colour.
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

const FADE = 0.22;
/** Props bundled with the rig that a guardian should never carry. */
const PROP_WORDS = [
  "sword",
  "shield",
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
  "helmet",
  "headgear",
  "knight",
  "visor",
  "cape",
  "shoulder",
  "hat_knight",
];

function isProp(name: string) {
  const n = name.toLowerCase();
  return PROP_WORDS.some((w) => n.includes(w));
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
      if (isProp(mesh.name) || isProp(mesh.parent?.name ?? "")) {
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
      // Keep the hand-painted texture dominant; the guardian colour is only a
      // whisper of tint plus a faint emissive so armour reads as real metal.
      mat.color.setRGB(1, 1, 1).lerp(tint, 0.05);
      mat.emissive = tint.clone().multiplyScalar(0.05);
      mat.emissiveIntensity = 0.25;
      mat.metalness = 0.18;
      mat.roughness = 0.6;
      mat.envMapIntensity = 1.3;
      // Punch up saturation + contrast on the baked texture so the guardians
      // read as vivid toy-like heroes instead of muddy low-poly figures.
      mat.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <color_fragment>",
          `#include <color_fragment>
           float _lum = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
           diffuseColor.rgb = clamp(mix(vec3(_lum), diffuseColor.rgb, 1.55) * 1.08, 0.0, 1.0);`,
        );
      };
      mat.needsUpdate = true;
      mesh.material = mat;
    });

    // Normalise to the requested height whatever the source rig measures.
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    if (size.y > 0.001) object.scale.setScalar(height / size.y);

    return object;
  }, [scene, color, height]);

  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model]);
  const names = useMemo(() => animations.map((a: THREE.AnimationClip) => a.name), [animations]);
  const current = useRef<THREE.AnimationAction | null>(null);

  const clipName = useMemo(() => {
    const map: Record<CharacterClip, string[]> = {
      idle: ["Idle", "Unarmed_Idle", "Standing"],
      walk: ["Walking_A", "Walking_B", "Walk"],
      run: ["Running_A", "Running_B", "Run"],
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
    next.timeScale = clip === "swim" ? 0.6 : 1;
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
      {/* Controllers rotate this group so +Z points along world movement. */}
      <group rotation-x={swimming ? Math.PI / 2.35 : 0} position-y={swimming ? 0.5 : 0}>
        <primitive object={model} />
        {/* Guardian identity accents: chest core + soft aura light. */}
        <mesh position={[0, height * 0.6, height * 0.11]}>
          <icosahedronGeometry args={[height * 0.045, 1]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} toneMapped={false} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
          <ringGeometry args={[height * 0.22, height * 0.28, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.22} toneMapped={false} />
        </mesh>
        <pointLight position={[0, height * 0.7, 0]} color={color} intensity={0.9} distance={height * 2} />
      </group>
    </group>
  );
}
