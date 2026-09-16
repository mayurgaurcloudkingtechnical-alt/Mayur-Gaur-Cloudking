"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";

// ─── constants ──────────────────────────────────────────────────
const PARTICLE_COUNT = 320;
const EMERALD = 0x10b981;
const EMERALD_LIGHT = 0x34d399;
const EMERALD_DARK = 0x047857;
const CYAN = 0x06b6d4;
const VIOLET = 0x8b5cf6;
const WHITE = 0xffffff;

interface TechGlobeSceneProps {
  className?: string;
}

export default function TechGlobeScene({ className = "" }: TechGlobeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ─── Scene Setup ─────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 5.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ─── Lighting ────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(WHITE, 0.4);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(EMERALD, 2.5, 20);
    pointLight1.position.set(3, 3, 4);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(CYAN, 1.8, 18);
    pointLight2.position.set(-4, -2, 3);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(VIOLET, 1.2, 15);
    pointLight3.position.set(0, 4, -3);
    scene.add(pointLight3);

    // ─── Globe Group ─────────────────────────────────────────────
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Inner glowing core
    const coreGeo = new THREE.SphereGeometry(1.0, 48, 48);
    const coreMat = new THREE.MeshPhongMaterial({
      color: EMERALD,
      emissive: EMERALD_DARK,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.15,
      shininess: 100,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    globeGroup.add(coreMesh);

    // Middle translucent shell
    const shellGeo = new THREE.SphereGeometry(1.25, 40, 40);
    const shellMat = new THREE.MeshPhongMaterial({
      color: EMERALD_LIGHT,
      transparent: true,
      opacity: 0.06,
      wireframe: false,
      side: THREE.DoubleSide,
    });
    const shellMesh = new THREE.Mesh(shellGeo, shellMat);
    globeGroup.add(shellMesh);

    // Outer wireframe globe
    const wireGeo = new THREE.IcosahedronGeometry(1.6, 3);
    const wireMat = new THREE.MeshBasicMaterial({
      color: EMERALD,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const wireGlobe = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wireGlobe);

    // Extra detail wireframe layer
    const detailWireGeo = new THREE.IcosahedronGeometry(1.62, 2);
    const detailWireMat = new THREE.MeshBasicMaterial({
      color: CYAN,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    const detailWire = new THREE.Mesh(detailWireGeo, detailWireMat);
    globeGroup.add(detailWire);

    // ─── Orbiting Rings ──────────────────────────────────────────
    const rings: THREE.Mesh[] = [];
    const ringConfigs = [
      { radius: 2.1, tube: 0.008, color: EMERALD, rotX: 0.6, rotZ: 0.3, speed: 0.3 },
      { radius: 2.4, tube: 0.006, color: CYAN, rotX: -0.4, rotZ: 0.7, speed: -0.2 },
      { radius: 2.7, tube: 0.005, color: VIOLET, rotX: 0.9, rotZ: -0.5, speed: 0.15 },
    ];

    ringConfigs.forEach((cfg) => {
      const ringGeo = new THREE.TorusGeometry(cfg.radius, cfg.tube, 16, 120);
      const ringMat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.45,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = cfg.rotX;
      ring.rotation.z = cfg.rotZ;
      ring.userData = { speed: cfg.speed };
      globeGroup.add(ring);
      rings.push(ring);
    });

    // ─── Satellite Nodes on Rings ────────────────────────────────
    const satellites: THREE.Mesh[] = [];
    const satConfigs = [
      { ringIdx: 0, angle: 0, size: 0.05, color: EMERALD_LIGHT },
      { ringIdx: 0, angle: Math.PI, size: 0.04, color: WHITE },
      { ringIdx: 1, angle: Math.PI / 2, size: 0.06, color: CYAN },
      { ringIdx: 1, angle: (3 * Math.PI) / 2, size: 0.035, color: EMERALD },
      { ringIdx: 2, angle: Math.PI / 3, size: 0.045, color: VIOLET },
      { ringIdx: 2, angle: (4 * Math.PI) / 3, size: 0.04, color: EMERALD_LIGHT },
    ];

    satConfigs.forEach((cfg) => {
      const satGeo = new THREE.SphereGeometry(cfg.size, 12, 12);
      const satMat = new THREE.MeshBasicMaterial({
        color: cfg.color,
      });
      const sat = new THREE.Mesh(satGeo, satMat);
      sat.userData = {
        ringIdx: cfg.ringIdx,
        angle: cfg.angle,
        radius: ringConfigs[cfg.ringIdx].radius,
      };
      globeGroup.add(sat);
      satellites.push(sat);
    });

    // ─── Floating Polyhedrons ────────────────────────────────────
    const polyhedrons: THREE.Mesh[] = [];
    const polyConfigs = [
      { geo: new THREE.IcosahedronGeometry(0.12, 0), pos: [2.8, 1.5, -1], color: EMERALD, speed: 1.2 },
      { geo: new THREE.OctahedronGeometry(0.1, 0), pos: [-2.5, -1.8, 0.5], color: CYAN, speed: 0.8 },
      { geo: new THREE.TetrahedronGeometry(0.09, 0), pos: [1.8, -2.2, 1], color: VIOLET, speed: 1.5 },
      { geo: new THREE.DodecahedronGeometry(0.08, 0), pos: [-2.0, 2.0, -0.5], color: EMERALD_LIGHT, speed: 1.0 },
      { geo: new THREE.IcosahedronGeometry(0.07, 0), pos: [3.0, -0.5, 0.8], color: CYAN, speed: 1.3 },
    ];

    polyConfigs.forEach((cfg) => {
      const mat = new THREE.MeshPhongMaterial({
        color: cfg.color,
        emissive: cfg.color,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.7,
        wireframe: true,
      });
      const mesh = new THREE.Mesh(cfg.geo, mat);
      mesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      mesh.userData = { speed: cfg.speed, baseY: cfg.pos[1] };
      globeGroup.add(mesh);
      polyhedrons.push(mesh);
    });

    // ─── Particle Cloud ──────────────────────────────────────────
    const particlesGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const particleColors = [
      new THREE.Color(EMERALD),
      new THREE.Color(CYAN),
      new THREE.Color(VIOLET),
      new THREE.Color(EMERALD_LIGHT),
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Distribute in a spherical shell
      const r = 2.5 + Math.random() * 2.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const color = particleColors[Math.floor(Math.random() * particleColors.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 3 + 1;
    }

    particlesGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particlesGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.025,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particlesGeo, particleMat);
    globeGroup.add(particles);

    // ─── Connection Lines ────────────────────────────────────────
    const linesMaterial = new THREE.LineBasicMaterial({
      color: EMERALD,
      transparent: true,
      opacity: 0.08,
    });

    // Create subtle connection lines between random particle pairs
    for (let i = 0; i < 30; i++) {
      const idx1 = Math.floor(Math.random() * PARTICLE_COUNT) * 3;
      const idx2 = Math.floor(Math.random() * PARTICLE_COUNT) * 3;
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(positions[idx1], positions[idx1 + 1], positions[idx1 + 2]),
        new THREE.Vector3(positions[idx2], positions[idx2 + 1], positions[idx2 + 2]),
      ]);
      const line = new THREE.Line(lineGeo, linesMaterial);
      globeGroup.add(line);
    }

    // ─── Animation Loop ─────────────────────────────────────────
    const clock = new THREE.Clock();

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const dt = clock.getDelta();

      // Smooth mouse parallax
      const targetRotX = mouseRef.current.y * 0.3;
      const targetRotY = mouseRef.current.x * 0.3;
      globeGroup.rotation.x += (targetRotX - globeGroup.rotation.x) * 0.02;
      globeGroup.rotation.y += (targetRotY - globeGroup.rotation.y) * 0.02;

      // Base rotation
      wireGlobe.rotation.y += 0.002;
      wireGlobe.rotation.x += 0.001;
      detailWire.rotation.y -= 0.0015;
      detailWire.rotation.z += 0.001;
      coreMesh.rotation.y += 0.003;

      // Core pulse
      const pulse = 1 + Math.sin(t * 1.5) * 0.05;
      coreMesh.scale.setScalar(pulse);
      (coreMesh.material as THREE.MeshPhongMaterial).emissiveIntensity =
        0.2 + Math.sin(t * 2) * 0.15;

      // Ring rotation
      rings.forEach((ring) => {
        ring.rotation.y += ring.userData.speed * 0.005;
      });

      // Satellite positions on rings
      satellites.forEach((sat) => {
        const { ringIdx, angle, radius } = sat.userData;
        const ring = rings[ringIdx];
        const currentAngle = angle + t * ringConfigs[ringIdx].speed;
        sat.position.x = Math.cos(currentAngle) * radius;
        sat.position.y = Math.sin(currentAngle) * radius * Math.cos(ring.rotation.x);
        sat.position.z = Math.sin(currentAngle) * radius * Math.sin(ring.rotation.x);
      });

      // Floating polyhedrons
      polyhedrons.forEach((poly) => {
        poly.rotation.x += poly.userData.speed * 0.008;
        poly.rotation.y += poly.userData.speed * 0.006;
        poly.position.y =
          poly.userData.baseY + Math.sin(t * poly.userData.speed * 0.5) * 0.15;
      });

      // Particle cloud rotation
      particles.rotation.y += 0.0008;
      particles.rotation.x += 0.0003;

      // Pulse point lights slightly
      pointLight1.intensity = 2.5 + Math.sin(t * 0.8) * 0.5;
      pointLight2.intensity = 1.8 + Math.sin(t * 1.2 + 1) * 0.4;

      renderer.render(scene, camera);
    };

    animate();
    setIsLoaded(true);

    // ─── Resize Handler ──────────────────────────────────────────
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    // ─── Cleanup ─────────────────────────────────────────────────
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(frameRef.current);

      // Dispose all geometries and materials
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points || obj instanceof THREE.Line) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });

      renderer.dispose();
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [handleMouseMove]);

  return (
    <div className={`relative ${className}`}>
      {/* Three.js canvas container */}
      <div
        ref={containerRef}
        className={`w-full h-full transition-opacity duration-1000 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        style={{ minHeight: "400px" }}
      />

      {/* Glassmorphism HUD Badges */}
      <div
        className={`absolute top-6 right-6 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 shadow-2xl transition-all duration-1000 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
        style={{ transitionDelay: "300ms" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-100">Cloud Infrastructure</span>
        </div>
      </div>

      <div
        className={`absolute bottom-8 left-6 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 shadow-2xl transition-all duration-1000 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
        style={{ transitionDelay: "600ms" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-semibold text-cyan-100">AI &amp; ML Pipeline</span>
        </div>
      </div>

      <div
        className={`absolute top-1/2 left-4 -translate-y-1/2 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl px-3 py-2 shadow-2xl transition-all duration-1000 ${
          isLoaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
        }`}
        style={{ transitionDelay: "900ms" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-xs font-semibold text-violet-200">DevOps</span>
        </div>
      </div>
    </div>
  );
}
