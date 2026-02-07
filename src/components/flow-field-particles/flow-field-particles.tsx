import { useGLTF } from "@react-three/drei";
import { bakeParticles } from "./utils/bake-particles";
import { useMemo } from "react";
import {
  deltaTime,
  float,
  Fn,
  If,
  instancedArray,
  instanceIndex,
  shapeCircle,
  time,
  uniform,
  vec3,
  vec4,
} from "three/tsl";
import { simplexNoise4d } from "@/shaders/noise";
import { useFrame } from "@react-three/fiber";
import type { Node, WebGPURenderer } from "three/webgpu";
import { useControls } from "leva";
import { Vector3, Raycaster } from "three";

const particleCount = 250000;

export default function FlowFieldParticles() {
  const gltf = useGLTF("/scene.glb", "/draco/");

  const particlesData = useMemo(
    () => bakeParticles(gltf.nodes, particleCount),
    [gltf],
  );

  const { nodes, uniforms, computeFlowField } = useMemo(() => {
    const uniforms = {
      noiseScale: uniform(0.2),
      flowFieldFrequency: uniform(0.5),
      flowFieldStrength: uniform(2.0),
      flowFieldInfluence: uniform(0.5),
      robotPos: uniform(new Vector3(0, 0, 0)),
      robotRadius: uniform(10),
      particleSize: uniform(0.25),
      cursorPos: uniform(new Vector3(10000, 10000, 10000)),
      cursorRange: uniform(3.0),
      cursorStrength: uniform(5.0),
    };

    const lifeSpan = instancedArray(particlesData.lifeData, "float");
    const position = instancedArray(particlesData.positionData, "vec3");
    const positionNode = position.toAttribute();
    const color = instancedArray(particlesData.colorData, "vec3");
    const colorNode = color.toAttribute();

    // Size Lifecycle
    const life = lifeSpan.element(instanceIndex);
    const sizeIn = life.smoothstep(0.0, 0.1);
    const sizeOut = float(1.0).sub(life.smoothstep(0.7, 1.0));
    const scaleNode = sizeIn.min(sizeOut).mul(uniforms.particleSize);
    const opacityNode = shapeCircle();

    const initialPosition = instancedArray(particlesData.positionData, "vec3");

    // Domain Warping Helper
    const getWarpedPos = Fn(([pos, t]: [Node, Node]) => {
      const warpScale = float(0.5);
      const offset = vec3(
        simplexNoise4d(vec4(pos, t)),
        simplexNoise4d(vec4(pos.add(4.5), t)),
        simplexNoise4d(vec4(pos.add(9.2), t)),
      );
      return pos.add(offset.mul(warpScale));
    });

    const computeFlowField = Fn(() => {
      const delta = deltaTime.min(0.1);
      const idx = instanceIndex.toVar();
      const pos = position.element(idx);
      const life = lifeSpan.element(idx);

      If(life.greaterThanEqual(1), () => {
        life.assign(life.fract());
        pos.assign(initialPosition.element(idx));
      }).Else(() => {
        const initialPos = initialPosition.element(idx);

        const noiseInput = vec4(
          initialPos.xyz.mul(uniforms.noiseScale),
          time.mul(0.2).add(1.0),
        );
        let strength = simplexNoise4d(noiseInput);

        const influence = uniforms.flowFieldInfluence.sub(0.5).mul(-2.0);
        strength = strength.smoothstep(influence, 1.0);

        const distToRobot = initialPos.distance(uniforms.robotPos);
        const robotMask = distToRobot.smoothstep(
          uniforms.robotRadius,
          uniforms.robotRadius.add(1.0),
        );

        strength = strength.mul(robotMask);

        const flowTime = time.mul(0.2);
        const warpedPos = getWarpedPos(
          pos.xyz.mul(uniforms.flowFieldFrequency),
          flowTime,
        );

        const flow = vec3(
          simplexNoise4d(vec4(warpedPos, flowTime)),
          simplexNoise4d(vec4(warpedPos.add(12.3), flowTime)).add(0.8),
          simplexNoise4d(vec4(warpedPos.add(25.1), flowTime)),
        );
        flow.normalize();

        const moveAmount = flow
          .mul(delta)
          .mul(strength)
          .mul(uniforms.flowFieldStrength);

        pos.addAssign(moveAmount);

        const distToCursor = pos.distance(uniforms.cursorPos);
        If(distToCursor.lessThan(uniforms.cursorRange), () => {
          const dir = pos.sub(uniforms.cursorPos).normalize();
          const pushFactor = uniforms.cursorRange.sub(distToCursor);
          const repulsion = dir
            .mul(pushFactor)
            .mul(uniforms.cursorStrength)
            .mul(delta);
          pos.addAssign(repulsion);
        });

        life.addAssign(delta.mul(0.3));
      });
    })().compute(particleCount);

    return {
      nodes: { positionNode, colorNode, scaleNode, opacityNode },
      uniforms,
      computeFlowField,
    };
  }, [particlesData]);

  const raycaster = useMemo(() => new Raycaster(), []);

  useFrame(({ gl, pointer, camera }) => {
    (gl as unknown as WebGPURenderer).compute(computeFlowField);

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(gltf.scene, true);
    if (intersects.length > 0) {
      uniforms.cursorPos.value.copy(intersects[0].point);
    } else {
      uniforms.cursorPos.value.set(10000, 10000, 10000);
    }
  });

  useControls("🍃 Flow Field", {
    influence: {
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.001,
      onChange: (v) => (uniforms.flowFieldInfluence.value = v),
    },
    strength: {
      value: 2.0,
      min: 0,
      max: 10,
      step: 0.001,
      onChange: (v) => (uniforms.flowFieldStrength.value = v),
    },
    frequency: {
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.001,
      onChange: (v) => (uniforms.flowFieldFrequency.value = v),
    },
  });

  return (
    <sprite count={particleCount} frustumCulled={false}>
      <spriteNodeMaterial
        transparent={false}
        alphaToCoverage={true}
        {...nodes}
      />
    </sprite>
  );
}
