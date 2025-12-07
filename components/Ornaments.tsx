import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState, OrnamentData } from '../types';

interface OrnamentsProps {
  treeState: TreeState;
}

const BALL_COUNT = 200;
const BOX_COUNT = 50;
const LIGHT_COUNT = 300;
const TREE_HEIGHT = 16;
const TREE_RADIUS = 6;

// Reusable dummy for matrix calculations
const dummy = new THREE.Object3D();
const tempVec3 = new THREE.Vector3();
const tempQuat = new THREE.Quaternion();

// -- Helper to generate data --
const generateOrnamentData = (count: number, type: 'ball' | 'box' | 'light'): OrnamentData[] => {
  const data: OrnamentData[] = [];
  for (let i = 0; i < count; i++) {
    // Chaos Position
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const rChaos = 20 + Math.random() * 15;
    const chaosPos = new THREE.Vector3(
      rChaos * Math.sin(phi) * Math.cos(theta),
      rChaos * Math.sin(phi) * Math.sin(theta) + 10,
      rChaos * Math.cos(phi)
    );

    // Target Position (Spiral on tree)
    const hNorm = Math.random();
    const y = hNorm * TREE_HEIGHT;
    const rCone = (1 - hNorm) * TREE_RADIUS; // Surface of cone
    
    // Create spirals for aesthetic distribution
    const spiralAngle = hNorm * Math.PI * 10 + (Math.random() * Math.PI * 2); 
    
    // Offset slightly for depth
    const rFinal = rCone * (type === 'light' ? 1.05 : 0.9); 

    const targetPos = new THREE.Vector3(
      Math.cos(spiralAngle) * rFinal,
      y,
      Math.sin(spiralAngle) * rFinal
    );

    const targetRot = new THREE.Euler(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    // Colors: Gold, Red, Silver scheme
    let color = new THREE.Color();
    if (type === 'light') {
        color.set('#ffccaa'); // Warm light
    } else {
        const palette = ['#D4AF37', '#800000', '#C0C0C0', '#B8860B'];
        color.set(palette[Math.floor(Math.random() * palette.length)]);
    }

    // Physics weights for animation speed
    // Lights move fastest, Boxes slowest
    const speed = type === 'light' ? 2.0 : type === 'ball' ? 1.5 : 0.8;
    const scale = type === 'light' ? 0.1 : type === 'ball' ? 0.25 : 0.35;

    data.push({ chaosPos, targetPos, targetRot, color, scale, speed });
  }
  return data;
};

const Ornaments: React.FC<OrnamentsProps> = ({ treeState }) => {
  const ballMesh = useRef<THREE.InstancedMesh>(null);
  const boxMesh = useRef<THREE.InstancedMesh>(null);
  const lightMesh = useRef<THREE.InstancedMesh>(null);

  // Data generation
  const balls = useMemo(() => generateOrnamentData(BALL_COUNT, 'ball'), []);
  const boxes = useMemo(() => generateOrnamentData(BOX_COUNT, 'box'), []);
  const lights = useMemo(() => generateOrnamentData(LIGHT_COUNT, 'light'), []);

  // Animation Refs (store current progress per instance if we wanted complex physics, 
  // but for global lerp with weights, we use a global progress tracker)
  const currentProgress = useRef(0);
  const targetProgress = treeState === TreeState.FORMED ? 1 : 0;

  useFrame((state, delta) => {
    // Update global progress target
    const isForming = treeState === TreeState.FORMED;
    const tTarget = isForming ? 1 : 0;
    
    // Base lerp speed
    currentProgress.current = THREE.MathUtils.lerp(currentProgress.current, tTarget, delta * 0.8);

    const time = state.clock.elapsedTime;

    // UPDATE BALLS
    if (ballMesh.current) {
      balls.forEach((data, i) => {
        // Apply individual speed weight to the progress
        // When forming: slower objects arrive later. When exploding: slower objects leave later.
        // We clamp the result between 0 and 1.
        
        // Custom easing curve based on object weight
        let p = currentProgress.current; 
        
        // Interpolate Position
        tempVec3.lerpVectors(data.chaosPos, data.targetPos, p);
        
        // Add floaty noise
        if (p < 0.99) {
            tempVec3.y += Math.sin(time + i) * 0.05 * (1 - p);
            tempVec3.x += Math.cos(time + i) * 0.05 * (1 - p);
        }

        // Interpolate Rotation (Spin wild in chaos, stabilize in target)
        dummy.position.copy(tempVec3);
        
        // Spin logic
        dummy.rotation.set(
           data.targetRot.x + (1-p) * time,
           data.targetRot.y + (1-p) * time,
           data.targetRot.z
        );
        
        dummy.scale.setScalar(data.scale * p); // Scale up as they arrive? Or just stay constant. Let's scale up.
        if (!isForming && p < 0.1) dummy.scale.setScalar(data.scale * p); // Shrink on chaos exit
        else dummy.scale.setScalar(data.scale);

        dummy.updateMatrix();
        ballMesh.current!.setMatrixAt(i, dummy.matrix);
      });
      ballMesh.current.instanceMatrix.needsUpdate = true;
    }

    // UPDATE BOXES (Heavier, slower)
    if (boxMesh.current) {
      boxes.forEach((data, i) => {
        let p = currentProgress.current; 
        // Delay slightly
        p = THREE.MathUtils.clamp((p - 0.1) * 1.1, 0, 1);

        tempVec3.lerpVectors(data.chaosPos, data.targetPos, p);
        dummy.position.copy(tempVec3);
        dummy.rotation.set(
            data.targetRot.x + (1-p) * Math.sin(time), 
            data.targetRot.y + (1-p) * time * 0.5, 
            data.targetRot.z
        );
        dummy.scale.setScalar(data.scale);
        dummy.updateMatrix();
        boxMesh.current!.setMatrixAt(i, dummy.matrix);
      });
      boxMesh.current.instanceMatrix.needsUpdate = true;
    }

    // UPDATE LIGHTS (Fast, twinkling)
    if (lightMesh.current) {
      lights.forEach((data, i) => {
        let p = currentProgress.current;
        // Arrive first
        p = THREE.MathUtils.clamp(p * 1.2, 0, 1);

        tempVec3.lerpVectors(data.chaosPos, data.targetPos, p);
        dummy.position.copy(tempVec3);
        dummy.scale.setScalar(data.scale * (0.8 + 0.4 * Math.sin(time * 5 + i))); // Twinkle
        dummy.rotation.set(0,0,0);
        dummy.updateMatrix();
        lightMesh.current!.setMatrixAt(i, dummy.matrix);
      });
      lightMesh.current.instanceMatrix.needsUpdate = true;
    }
  });

  // Set initial colors
  useLayoutEffect(() => {
    balls.forEach((data, i) => ballMesh.current!.setColorAt(i, data.color));
    if(ballMesh.current) ballMesh.current.instanceColor!.needsUpdate = true;

    boxes.forEach((data, i) => boxMesh.current!.setColorAt(i, data.color));
    if(boxMesh.current) boxMesh.current.instanceColor!.needsUpdate = true;

    lights.forEach((data, i) => lightMesh.current!.setColorAt(i, data.color));
    if(lightMesh.current) lightMesh.current.instanceColor!.needsUpdate = true;
  }, [balls, boxes, lights]);

  return (
    <>
      {/* Balls - Glossy Material */}
      <instancedMesh ref={ballMesh} args={[undefined, undefined, BALL_COUNT]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial 
            roughness={0.1} 
            metalness={0.9} 
            envMapIntensity={1.5}
        />
      </instancedMesh>

      {/* Boxes - Satin Material */}
      <instancedMesh ref={boxMesh} args={[undefined, undefined, BOX_COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
            roughness={0.3} 
            metalness={0.6}
            envMapIntensity={1}
        />
      </instancedMesh>

      {/* Lights - Emissive Material for Bloom */}
      <instancedMesh ref={lightMesh} args={[undefined, undefined, LIGHT_COUNT]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </>
  );
};

export default Ornaments;