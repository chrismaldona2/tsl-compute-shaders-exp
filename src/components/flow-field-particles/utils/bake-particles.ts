import type { ObjectMap } from "@react-three/fiber";
import { Color, Mesh, MeshStandardMaterial, Vector2, Vector3 } from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/Addons.js";

type SamplerItem = {
  sampler: MeshSurfaceSampler;
  mesh: Mesh;
  area: number;
};

export function bakeParticles(
  nodes: ObjectMap["nodes"],
  particleCount: number,
) {
  /*
   * Samplers
   */
  const samplers: SamplerItem[] = [];
  let totalArea = 0;

  Object.values(nodes).forEach((node) => {
    if (!(node instanceof Mesh)) return;
    const sampler = new MeshSurfaceSampler(node).build();
    const distribution = sampler.distribution;
    const area = distribution ? distribution[distribution.length - 1] : 0;
    if (area > 0) {
      samplers.push({
        sampler,
        mesh: node,
        area,
      });
      totalArea += area;
    }
  });

  /*
   * Buffers
   */
  const positionData = new Float32Array(particleCount * 3);
  const colorData = new Float32Array(particleCount * 3);
  const lifeData = new Float32Array(particleCount);

  const _position = new Vector3();
  const _uv = new Vector2();
  const _color = new Color();

  let offset = 0;

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  samplers.forEach(({ sampler, mesh, area }) => {
    const meshParticleCount = Math.floor((area / totalArea) * particleCount);

    const material = mesh.material as MeshStandardMaterial;
    let pixels = null;
    let width = 0;
    let height = 0;
    if (material.map && material.map.image) {
      const img = material.map.image as HTMLImageElement;

      if (!context) return;

      width = img.width;
      height = img.height;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      context.drawImage(img, 0, 0);
      pixels = context.getImageData(0, 0, width, height).data;
    }

    for (let i = 0; i < meshParticleCount; i++) {
      sampler.sample(_position, undefined, undefined, _uv);
      mesh.updateMatrixWorld();
      _position.applyMatrix4(mesh.matrixWorld);

      const index1 = offset + i;
      const index3 = (offset + i) * 3;
      positionData[index3 + 0] = _position.x;
      positionData[index3 + 1] = _position.y;
      positionData[index3 + 2] = _position.z;

      lifeData[index1] = Math.random();

      if (pixels && width > 0) {
        const tx = Math.min(Math.floor(_uv.x * width), width - 1);
        const ty = Math.min(Math.floor(_uv.y * height), height - 1);

        const idx = (ty * width + tx) * 4;
        _color.setRGB(
          pixels[idx] / 255,
          pixels[idx + 1] / 255,
          pixels[idx + 2] / 255,
        );
        _color.convertSRGBToLinear();

        colorData[index3] = _color.r;
        colorData[index3 + 1] = _color.g;
        colorData[index3 + 2] = _color.b;
      } else {
        _color.copy(material.color || _color.set(0xffffff));
        colorData[index3] = _color.r;
        colorData[index3 + 1] = _color.g;
        colorData[index3 + 2] = _color.b;
      }
    }
    offset += meshParticleCount;
  });

  return { positionData, colorData, lifeData };
}
