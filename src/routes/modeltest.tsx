import { Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Canvas } from "@react-three/fiber";
import { Grid, OrbitControls, useGLTF } from "@react-three/drei";

export const Route = createFileRoute("/modeltest")({
  ssr: false,
  component: ModelTest,
});

function Model() {
  const { scene } = useGLTF("/models/guardian.glb");
  return <primitive object={scene} />;
}

function ModelTest() {
  return (
    <div className="h-[80vh] w-full">
      <Canvas camera={{ position: [3, 2, 5], fov: 55 }}>
        <ambientLight intensity={1.2} />
        <directionalLight position={[4, 6, 4]} intensity={2} />
        <Grid args={[10, 10]} cellColor="#888" sectionColor="#0ff" infiniteGrid />
        <Suspense fallback={null}>
          <Model />
        </Suspense>
        <OrbitControls />
      </Canvas>
    </div>
  );
}
