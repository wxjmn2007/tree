import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '../types';

interface TreeFoliageProps {
  treeState: TreeState;
}

// Shader Material
const FoliageShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uColorBase: { value: new THREE.Color('#003311') }, // Deep emerald
    uColorTip: { value: new THREE.Color('#006622') }, // Lighter emerald
    uColorSparkle: { value: new THREE.Color('#ffd700') }, // Gold
  },
  vertexShader: `
    uniform float uTime;
    uniform float uProgress;
    
    attribute vec3 aChaosPos;
    attribute vec3 aTargetPos;
    attribute float aRandom;
    
    varying vec3 vColor;
    varying float vAlpha;

    // Cubic ease out function for smooth landing
    float easeOutCubic(float x) {
      return 1.0 - pow(1.0 - x, 3.0);
    }

    void main() {
      // Add some noise based on time to keep particles alive
      vec3 noise = vec3(
        sin(uTime * 2.0 + aRandom * 100.0) * 0.1,
        cos(uTime * 1.5 + aRandom * 50.0) * 0.1,
        sin(uTime * 1.0 + aRandom * 25.0) * 0.1
      );

      // Interpolate position
      float easeProgress = easeOutCubic(uProgress);
      vec3 pos = mix(aChaosPos, aTargetPos, easeProgress);
      
      // Add subtle breathing animation when formed
      if (uProgress > 0.9) {
        pos += noise * 0.5;
      } else {
        pos += noise * 2.0; // More chaos when broken
      }

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      
      // Size attenuation
      gl_PointSize = (4.0 * aRandom + 2.0) * (20.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;

      // Pass randomness to fragment
      vAlpha = aRandom;
    }
  `,
  fragmentShader: `
    uniform vec3 uColorBase;
    uniform vec3 uColorTip;
    uniform vec3 uColorSparkle;
    uniform float uTime;
    
    varying float vAlpha;

    void main() {
      // Circular particle
      vec2 xy = gl_PointCoord.xy - vec2(0.5);
      float ll = length(xy);
      if (ll > 0.5) discard;

      // Gradient color based on point coord to simulate needle shading
      vec3 color = mix(uColorBase, uColorTip, gl_PointCoord.y + 0.3);
      
      // Sparkle effect (gold glitter)
      float sparkle = step(0.98, sin(uTime * 5.0 + vAlpha * 100.0));
      color = mix(color, uColorSparkle, sparkle * 0.8);

      gl_FragColor = vec4(color, 1.0);
    }
  `
};

const COUNT = 15000;
const TREE_HEIGHT = 16;
const TREE_RADIUS = 6;

const TreeFoliage: React.FC<TreeFoliageProps> = ({ treeState }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Logic to interpolate uProgress
  const currentProgress = useRef(0);
  const targetProgress = treeState === TreeState.FORMED ? 1 : 0;

  useFrame((state, delta) => {
    if (materialRef.current) {
      // Smooth lerp for state transition
      currentProgress.current = THREE.MathUtils.lerp(
        currentProgress.current,
        targetProgress,
        delta * 1.5
      );
      
      materialRef.current.uniforms.uProgress.value = currentProgress.current;
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  // Generate Geometry Data
  const { chaosPositions, targetPositions, randoms } = useMemo(() => {
    const chaos = new Float32Array(COUNT * 3);
    const target = new Float32Array(COUNT * 3);
    const rands = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;

      // 1. Chaos Positions: Random Point in Sphere
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = 25 * Math.cbrt(Math.random()); // Spread out radius
      
      chaos[i3] = r * Math.sin(phi) * Math.cos(theta);
      chaos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) + 10; // Lift up chaos center
      chaos[i3 + 2] = r * Math.cos(phi);

      // 2. Target Positions: Cone Shape (Tree)
      // Normalize height (0 to 1)
      const hNorm = Math.random(); 
      // y goes from 0 to TREE_HEIGHT
      const y = hNorm * TREE_HEIGHT;
      // Radius decreases as we go up
      const rCone = (1 - hNorm) * TREE_RADIUS;
      // Angle around tree + some randomness
      const angle = Math.random() * Math.PI * 2;
      // Push needles slightly outwards
      const rFinal = Math.sqrt(Math.random()) * rCone;

      target[i3] = Math.cos(angle) * rFinal;
      target[i3 + 1] = y;
      target[i3 + 2] = Math.sin(angle) * rFinal;

      // 3. Random attribute for sparkle variety
      rands[i] = Math.random();
    }

    return {
      chaosPositions: chaos,
      targetPositions: target,
      randoms: rands
    };
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={COUNT}
          array={targetPositions} // Initial bounding box helper basically
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aChaosPos"
          count={COUNT}
          array={chaosPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTargetPos"
          count={COUNT}
          array={targetPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={COUNT}
          array={randoms}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        args={[FoliageShaderMaterial]}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default TreeFoliage;