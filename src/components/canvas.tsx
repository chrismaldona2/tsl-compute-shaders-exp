import {
  extend,
  Canvas as FiberCanvas,
  type CanvasProps,
} from "@react-three/fiber";
import {
  MeshBasicNodeMaterial,
  SpriteNodeMaterial,
  WebGPURenderer,
} from "three/webgpu";

extend({
  SpriteNodeMaterial: SpriteNodeMaterial,
  MeshBasicNodeMaterial: MeshBasicNodeMaterial,
});

export default function Canvas(props: CanvasProps) {
  return (
    <FiberCanvas
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100dvh",
        touchAction: "none",
      }}
      gl={async (props) => {
        const renderer = new WebGPURenderer({
          canvas: props.canvas as HTMLCanvasElement,
          powerPreference: "high-performance",
          antialias: true,
          alpha: false,
          stencil: false,
          depth: true,
        });
        await renderer.init();
        return renderer;
      }}
      camera={{ position: [30, 0, 40] }}
      {...props}
    />
  );
}
