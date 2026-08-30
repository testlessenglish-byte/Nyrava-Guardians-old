import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";

const MODEL_URL = "/models/guardian.glb";
const FADE = 0.25;
const MODEL_UNITS_TALL = 1.8;

useGLTF.preload(MODEL_URL);

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

export type CharacterHandle = {
  group: React.RefObject<THREE.Group | null>;
};

/**
 * A rigged guardian avatar: CC0 model, per-guardian armour tint, clip crossfading.
 * `clip` is a semantic state: "idle" | "walk" | "run" | "talk" | "wave".
 */
export function Character({
  color,
  clip,
  height = 1.75,
}: {
  color: string;
  clip: "idle" | "walk" | "run" | "talk" | "wave" | "swim";
  height?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL_URL);

  const model = useMemo(() => {
    scene.updateMatrixWorld(true);
    const object = skeletonClone(scene);
    const tint = new THREE.Color(color);

    object.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
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
      // Show the baked armour texture at full strength. The guardian identity
      // comes from an emissive neon rim, not from painting over the diffuse.
      mat.color.setRGB(1, 1, 1);
      mat.emissive = tint.clone().multiplyScalar(0.22);
      mat.emissiveIntensity = 1.1;
      mat.metalness = mat.metalnessMap ? 1 : 0.18;
      mat.roughness = mat.roughnessMap ? 1 : 0.62;
      mat.envMapIntensity = 1.4;
      mat.needsUpdate = true;
      mesh.material = mat;
    });

    // Mixamo rig: root node is authored at 0.01, rendering ~1.8 units tall.
    object.scale.setScalar(height / MODEL_UNITS_TALL);

    return object;
  }, [scene, color, height]);


  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model]);
  const names = useMemo(() => animations.map((a) => a.name), [animations]);
  const current = useRef<THREE.AnimationAction | null>(null);

  const clipName = useMemo(() => {
    const map: Record<typeof clip, string[]> = {
      idle: ["Idle", "Standing"],
      walk: ["Walk", "Walking"],
      run: ["Run", "Running"],
      talk: ["Idle"],
      wave: ["Idle"],
      swim: ["Swim", "Walk"],
    };
    return pickClip(names, map[clip]);
  }, [names, clip]);


  useEffect(() => {
    const source = animations.find((a) => a.name === clipName);
    if (!source) return;
    const next = mixer.clipAction(source);
    next.reset().setEffectiveWeight(1).fadeIn(FADE).play();
    const previous = current.current;
    if (previous && previous !== next) previous.fadeOut(FADE);
    current.current = next;
  }, [mixer, animations, clipName]);

  useEffect(() => () => {
    mixer.stopAllAction();
  }, [mixer]);

  useFrame((_, delta) => mixer.update(delta));

  return (
    <group ref={group}>
      {/* This rig's visible forward axis is +Z. The player controller rotates
          this group so +Z points along the actual world-space movement vector. */}
      <primitive object={model} />
    </group>
  );
}
