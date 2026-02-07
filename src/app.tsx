import { Suspense } from "react";
import Canvas from "./components/canvas";
import { OrbitControls } from "@react-three/drei";
import FlowFieldParticles from "./components/flow-field-particles/flow-field-particles";
import { Leva } from "leva";
import Credits from "./components/credits";

export default function App() {
  return (
    <>
      <Leva
        theme={{
          sizes: {
            rootWidth: "24rem",
          },
        }}
      />
      <Credits />

      <Canvas>
        <Suspense fallback={null}>
          <color args={["#222420"]} attach="background" />
          <OrbitControls />
          <FlowFieldParticles />
        </Suspense>
      </Canvas>
    </>
  );
}
