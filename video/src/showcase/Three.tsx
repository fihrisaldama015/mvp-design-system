import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { c } from "../theme";
import { Stage } from "./Stage";

/** Showcase clip: real 3D with @remotion/three (Three.js). The camera orbits a lit object; everything is a function of
 *  the frame number, like the rest of Remotion. */
const ORBIT_FRAMES = 150;

const OrbitCamera: React.FC<{ turns?: number }> = ({ turns = 1 }) => {
  const frame = useCurrentFrame();
  const { camera } = useThree();
  const angle = (frame / ORBIT_FRAMES) * Math.PI * 2 * turns;
  camera.position.set(Math.sin(angle) * 6, 2.4, Math.cos(angle) * 6);
  camera.lookAt(0, 0.2, 0);
  return null;
};

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const spin = (frame / ORBIT_FRAMES) * Math.PI * 2 * 0.5;
  const bob = Math.sin((frame / ORBIT_FRAMES) * Math.PI * 4) * 0.15;
  return (
    <>
      <OrbitCamera />
      <color attach="background" args={[c.bg]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 3]} intensity={1.6} />
      <pointLight position={[-4, 2, -3]} intensity={30} color={c.blue} />
      <mesh position={[0, bob, 0]} rotation={[spin * 0.6, spin, 0]}>
        <boxGeometry args={[1.6, 1.6, 1.6]} />
        <meshStandardMaterial color={c.rose} roughness={0.35} metalness={0.15} />
      </mesh>
      <mesh position={[2.2, 0.1 - bob, -0.6]} rotation={[spin, 0, spin * 0.5]}>
        <torusGeometry args={[0.55, 0.2, 24, 64]} />
        <meshStandardMaterial color={c.amber} roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[-2.1, 0, 0.8]} rotation={[0, spin * 1.4, 0]}>
        <icosahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial color={c.blue} roughness={0.4} flatShading />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]}>
        <circleGeometry args={[6, 64]} />
        <meshStandardMaterial color={c.panel2} roughness={0.9} />
      </mesh>
    </>
  );
};

export const Three: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <Stage title="Real 3D: @remotion/three" subtitle="Lights, depth and an orbiting camera, all from the frame number." at={frame}>
      <div style={{ position: "absolute", left: 90, top: 160, width: 1100, height: 500, borderRadius: 22, overflow: "hidden", border: `1px solid ${c.line}` }}>
        <ThreeCanvas width={1100} height={500} camera={{ position: [0, 2.4, 6], fov: 38 }}>
          <Scene />
        </ThreeCanvas>
      </div>
      <div style={{ position: "absolute", right: 110, top: 176, fontFamily: "monospace", fontSize: 22, color: c.dim }}>
        camera angle {Math.round(((frame % ORBIT_FRAMES) / ORBIT_FRAMES) * 360)}°
      </div>
      {width + height > 0 ? null : null}
    </Stage>
  );
};
export const THREE_FRAMES = ORBIT_FRAMES;
