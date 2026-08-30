import { useEffect, useMemo, useRef } from "react";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";

const MODEL_URL = "/models/guardian.glb";
const FADE = 0.25;

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
  clip: "idle" | "walk" | "run" | "talk" | "wave";
  height?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL_URL);

  const model = useMemo(() => {
    const object = skeletonClone(scene);
    const tint = new THREE.Color(color);

    object.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const source = mesh.material as THREE.MeshStandardMaterial;
      const mat = source.clone();
      const luminance = source.color.r * 0.3 + source.color.g * 0.6 + source.color.b * 0.1;
      if (luminance > 0.55) {
        mat.color.copy(tint);
        mat.emissive = tint.clone().multiplyScalar(0.45);
      } else {
        mat.color.setRGB(0.09, 0.1, 0.13);
        mat.emissive = new THREE.Color("#000000");
      }
      mat.metalness = 0.85;
      mat.roughness = 0.28;
      mesh.material = mat;
    });

    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    object.scale.setScalar(height / (size.y || 1));

    object.traverse((c:any)=>{ if(c.isMesh){ c.geometry.computeBoundingBox(); const b=c.geometry.boundingBox; console.log("[char-mesh]", c.name, b.min.toArray().map((n:number)=>n.toFixed(2)), b.max.toArray().map((n:number)=>n.toFixed(2))); }});
    console.log("[char] rawSize", size.toArray(), "scale", object.scale.x, "clips", animations.map(a=>a.name));
    const scaled = new THREE.Box3().setFromObject(object);
    object.position.y -= scaled.min.y;
    return object;
  }, [scene, color, height, animations]);

  const { actions, names } = useAnimations(animations, group);
  const previous = useRef<string | null>(null);

  const clipName = useMemo(() => {
    const map: Record<typeof clip, string[]> = {
      idle: ["Idle", "Standing"],
      walk: ["Walking", "Walk"],
      run: ["Running", "Run"],
      talk: ["Wave", "ThumbsUp", "Idle"],
      wave: ["Wave", "Idle"],
    };
    return pickClip(names, map[clip]);
  }, [names, clip]);

  useEffect(() => {
    if (!clipName || previous.current === clipName) return;
    if (previous.current) actions[previous.current]?.fadeOut(FADE);
    actions[clipName]?.reset().fadeIn(FADE).play();
    previous.current = clipName;
  }, [actions, clipName]);

  return (
    <group ref={group}>
      <primitive object={model} />
    </group>
  );
}
