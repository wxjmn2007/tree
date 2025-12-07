import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { HashRouter } from 'react-router-dom';
import Experience from './components/Experience';
import { TreeState } from './types';

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.CHAOS);

  const toggleState = () => {
    setTreeState((prev) =>
      prev === TreeState.CHAOS ? TreeState.FORMED : TreeState.CHAOS
    );
  };

  const isFormed = treeState === TreeState.FORMED;

  return (
    <div className="relative w-full h-screen bg-black">
      <Canvas
        camera={{ position: [0, 4, 20], fov: 45 }}
        dpr={[1, 2]}
        gl={{
          antialias: false,
          toneMapping: 3,
          toneMappingExposure: 1.5,
        }}
      >
        <Suspense fallback={null}>
          <Experience treeState={treeState} />
        </Suspense>
      </Canvas>

      <Loader />

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between">
        {/* Header */}
        <div className="text-center mt-4">
          <h1 className="font-luxury text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-red-500">
            THE GRAND HOLIDAY
          </h1>
          <p className="font-serif-luxury text-yellow-100/60 text-sm md:text-lg">
            Luxury Interactive Experience
          </p>
        </div>

        {/* Footer Controls */}
        <div className="mb-12 flex flex-col items-center gap-4 pointer-events-auto">
          <button
            onClick={toggleState}
            className={`
              relative group overflow-hidden px-12 py-4
              border border-yellow-500/50
              bg-gradient-to-b from-green-950 to-black
              text-yellow-400 font-luxury text-lg tracking-[0.2em]
              transition-all duration-700 ease-out
              hover:border-yellow-300 hover:shadow-[0_0_30px_rgba(253,224,71,0.5)]
            `}
          >
            <span className="relative z-10 transition-transform duration-500">
              {isFormed ? 'RELEASE CHAOS' : 'ASSEMBLE MAJESTY'}
            </span>
            {/* Shiny overlay effect */}
            <div className="absolute inset-0 bg-yellow-400/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </button>

          <div className="text-yellow-600/40 text-xs font-sans tracking-widest">
            3D INTERACTIVE • REACT 18 • WEBGL
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

