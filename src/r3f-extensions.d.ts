import { SpriteNodeMaterial, MeshBasicNodeMaterial } from "three/webgpu";
import type { MaterialNode } from "@react-three/fiber";

declare module "@react-three/fiber" {
  interface ThreeElements {
    spriteNodeMaterial: MaterialNode<
      SpriteNodeMaterial,
      typeof SpriteNodeMaterial
    >;

    meshBasicNodeMaterial: MaterialNode<
      MeshBasicNodeMaterial,
      typeof MeshBasicNodeMaterial
    >;
  }
}
