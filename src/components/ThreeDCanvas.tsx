import { useEffect, useRef, useMemo, useState } from 'react';
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Points,
  PointsMaterial,
  BufferGeometry,
  BufferAttribute,
  GridHelper,
  AdditiveBlending,
} from 'three';

interface ThreeDCanvasProps {
  width: number;
  height: number;
}

const PARTICLE_COUNT = 300;
const SEED_POSITIONS = (() => {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const teal = { r: 0, g: 212, b: 255 };
  let seed = 12345;
  const nextRandom = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3] = (nextRandom() - 0.5) * 80;
    positions[i * 3 + 1] = (nextRandom() - 0.5) * 50;
    positions[i * 3 + 2] = (nextRandom() - 0.5) * 30;
    colors[i * 3] = teal.r / 255;
    colors[i * 3 + 1] = teal.g / 255;
    colors[i * 3 + 2] = teal.b / 255;
  }
  return { positions, colors };
})();

function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch {
    return false;
  }
}

function WebGLFallback({ width, height }: { width: number; height: number }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none flex items-center justify-center"
      style={{ width, height, zIndex: 1, background: 'rgba(10, 10, 20, 0.3)' }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--paper-muted)',
          textTransform: 'uppercase',
          letterSpacing: 2,
        }}
      >
        WebGL Unavailable
      </div>
    </div>
  );
}

export default function ThreeDCanvas({ width, height }: ThreeDCanvasProps) {
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: Scene;
    camera: PerspectiveCamera;
    renderer: WebGLRenderer;
    particles: Points;
  } | null>(null);

  const particleGeometry = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(SEED_POSITIONS.positions.slice(), 3));
    geometry.setAttribute('color', new BufferAttribute(SEED_POSITIONS.colors.slice(), 3));
    return geometry;
  }, []);

  useEffect(() => {
    const supported = checkWebGLSupport();
    setWebglSupported(supported);
    if (!supported) return;
    if (!containerRef.current || width === 0 || height === 0) return;

    const scene = new Scene();
    const camera = new PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const particlesMaterial = new PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: AdditiveBlending,
    });

    const particles = new Points(particleGeometry, particlesMaterial);
    scene.add(particles);

    const gridHelper = new GridHelper(60, 30, 0x1a1a2e, 0x0a0a0f);
    gridHelper.position.y = -15;
    scene.add(gridHelper);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;
      particles.rotation.y = time * 0.05;
      particles.rotation.x = Math.sin(time * 0.1) * 0.1;

      const positions = particleGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        positions[i * 3 + 1] += Math.sin(time + i * 0.1) * 0.01;
      }
      particleGeometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();
    sceneRef.current = { scene, camera, renderer, particles };

    const container = containerRef.current;
    return () => {
      cancelAnimationFrame(animationId);
      renderer.dispose();
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      sceneRef.current = null;
    };
  }, [width, height, particleGeometry]);

  if (webglSupported === null) return null;
  if (!webglSupported) return <WebGLFallback width={width} height={height} />;

  return <div ref={containerRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }} />;
}
