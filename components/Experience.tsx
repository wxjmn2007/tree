import React from 'react';
import { Environment, OrbitControls, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { TreeState } from '../types';
import TreeFoliage from './TreeFoliage';
import Ornaments from './Ornaments';

interface ExperienceProps {
  treeState: TreeState;
}

const Experience: React.FC<ExperienceProps> = ({ treeState }) => {
  return (
    <>
      {/* Lighting - Dramatic and Gold-tinted */}
      <ambientLight intensity={0.2} color="#001a10" />
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.3} 
        penumbra={1} 
        intensity={2} 
        color="#fff5cc" 
        castShadow 
      />
      <pointLight position={[-10, 5, -10]} intensity={1} color="#ffaa00" />
      <pointLight position={[0, -5, 5]} intensity={0.5} color="#00ff88" />

      {/* Environment Map for Reflections */}
      <Environment preset="lobby" blur={0.6} background={false} />

      {/* The Tree Logic */}
      <group position={[0, -5, 0]}>
        <TreeFoliage treeState={treeState} />
        <Ornaments treeState={treeState} />
      </group>

      {/* Floor Shadows */}
      <ContactShadows 
        position={[0, -5, 0]} 
        opacity={0.6} 
        scale={40} 
        blur={2} 
        far={4.5} 
        color="#000000" 
      />

      {/* Post Processing for the "Luxury" Glow */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.8} 
          mipmapBlur 
          intensity={1.2} 
          radius={0.6} 
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>

      {/* Controls */}
      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.8}
        minDistance={10}
        maxDistance={35}
        autoRotate={treeState === TreeState.FORMED}
        autoRotateSpeed={0.5}
      />
    </>
  );
};

export default Experience;