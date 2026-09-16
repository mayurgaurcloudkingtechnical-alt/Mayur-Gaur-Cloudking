"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";

const EMERALD = 0x10b981;
const CYAN = 0x06b6d4;
const VIOLET = 0x8b5cf6;
const AMBER = 0xf59e0b;
const WHITE = 0xffffff;

interface LearningHologramSceneProps {
  className?: string;
  courseTitle?: string;
  progressPercent?: number;
}

export default function LearningHologramScene({
  className = "",
  courseTitle = "Full Stack Cloud Architecture",
  progressPercent = 75,
}: LearningHologramSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 300;

    // ─── Scene & Camera ──────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 4.8);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ─── Lights ──────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(WHITE, 0.6);
    scene.add(ambientLight);

    const pLight1 = new THREE.PointLight(EMERALD, 3, 15);
    pLight1.position.set(2, 3, 3);
    scene.add(pLight1);

    const pLight2 = new THREE.PointLight(CYAN, 2, 15);
    pLight2.position.set(-3, -2, 2);
    scene.add(pLight2);

    const pLight3 = new THREE.PointLight(VIOLET, 2, 12);
    pLight3.position.set(0, -3, -2);
    scene.add(pLight3);

    // ─── Hologram Master Group ───────────────────────────────────
    const holoGroup = new THREE.Group();
    scene.add(holoGroup);

    // Central Floating Octahedron (The Knowledge Crystal)
    const crystalGeo = new THREE.OctahedronGeometry(0.85, 0);
    const crystalMat = new THREE.MeshPhongMaterial({
      color: EMERALD,
      emissive: 0x064e3b,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.85,
      shininess: 90,
      wireframe: false,
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    holoGroup.add(crystal);

    // Crystal Wireframe Cage
    const cageGeo = new THREE.OctahedronGeometry(0.92, 0);
    const cageMat = new THREE.MeshBasicMaterial({
      color: CYAN,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    const cage = new THREE.Mesh(cageGeo, cageMat);
    holoGroup.add(cage);

    // Inner Glowing Core
    const innerGeo = new THREE.IcosahedronGeometry(0.4, 1);
    const innerMat = new THREE.MeshBasicMaterial({
      color: WHITE,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
    });
    const innerCore = new THREE.Mesh(innerGeo, innerMat);
    holoGroup.add(innerCore);

    // ─── Gyro Ring 1 (Horizontal Orbit) ──────────────────────────
    const ring1Geo = new THREE.TorusGeometry(1.4, 0.012, 16, 100);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: EMERALD,
      transparent: true,
      opacity: 0.6,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 2.5;
    holoGroup.add(ring1);

    // ─── Gyro Ring 2 (Tilted Orbit) ──────────────────────────────
    const ring2Geo = new THREE.TorusGeometry(1.65, 0.009, 16, 100);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: CYAN,
      transparent: true,
      opacity: 0.5,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = -Math.PI / 3;
    ring2.rotation.y = Math.PI / 6;
    holoGroup.add(ring2);

    // ─── Gyro Ring 3 (Outer Deep Orbit) ──────────────────────────
    const ring3Geo = new THREE.TorusGeometry(1.9, 0.007, 16, 100);
    const ring3Mat = new THREE.MeshBasicMaterial({
      color: VIOLET,
      transparent: true,
      opacity: 0.4,
    });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.z = Math.PI / 4;
    holoGroup.add(ring3);

    // ─── Satellite Nodes ─────────────────────────────────────────
    const satellites: { mesh: THREE.Mesh; angle: number; radius: number; speed: number; plane: "xy" | "xz" }[] = [];
    const satData = [
      { radius: 1.4, size: 0.06, color: EMERALD, speed: 1.2, plane: "xz" as const },
      { radius: 1.4, size: 0.04, color: WHITE, speed: -0.9, plane: "xz" as const },
      { radius: 1.65, size: 0.05, color: CYAN, speed: 0.8, plane: "xy" as const },
      { radius: 1.9, size: 0.05, color: AMBER, speed: 1.5, plane: "xz" as const },
    ];

    satData.forEach((s) => {
      const geo = new THREE.SphereGeometry(s.size, 16, 16);
      const mat = new THREE.MeshBasicMaterial({ color: s.color });
      const mesh = new THREE.Mesh(geo, mat);
      holoGroup.add(mesh);
      satellites.push({ mesh, angle: Math.random() * Math.PI * 2, radius: s.radius, speed: s.speed, plane: s.plane });
    });

    // ─── Ambient Particle Cloud ──────────────────────────────────
    const particleCount = 180;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);

    const palette = [new THREE.Color(EMERALD), new THREE.Color(CYAN), new THREE.Color(VIOLET)];

    for (let i = 0; i < particleCount; i++) {
      const r = 1.2 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pPos[i * 3 + 2] = r * Math.cos(phi);

      const c = palette[i % palette.length];
      pColors[i * 3] = c.r;
      pColors[i * 3 + 1] = c.g;
      pColors[i * 3 + 2] = c.b;
    }

    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(pColors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(pGeo, pMat);
    holoGroup.add(particles);

    // ─── Animation Loop ──────────────────────────────────────────
    const clock = new THREE.Clock();

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Mouse Parallax
      const targetRotX = mouseRef.current.y * 0.4;
      const targetRotY = mouseRef.current.x * 0.4;
      holoGroup.rotation.x += (targetRotX - holoGroup.rotation.x) * 0.04;
      holoGroup.rotation.y += (targetRotY - holoGroup.rotation.y) * 0.04;

      // Crystal Rotation
      crystal.rotation.y = t * 0.5;
      crystal.rotation.x = Math.sin(t * 0.4) * 0.2;
      cage.rotation.y = -t * 0.4;
      cage.rotation.z = Math.cos(t * 0.3) * 0.2;
      innerCore.rotation.x = t * 0.8;

      // Pulse crystal scale
      const pulse = 1 + Math.sin(t * 2) * 0.04;
      crystal.scale.setScalar(pulse);

      // Rotate Rings
      ring1.rotation.z += 0.005;
      ring2.rotation.z -= 0.007;
      ring3.rotation.y += 0.004;

      // Animate Satellites
      satellites.forEach((s) => {
        s.angle += s.speed * 0.015;
        if (s.plane === "xz") {
          s.mesh.position.x = Math.cos(s.angle) * s.radius;
          s.mesh.position.z = Math.sin(s.angle) * s.radius;
          s.mesh.position.y = Math.sin(s.angle * 2) * 0.25;
        } else {
          s.mesh.position.x = Math.cos(s.angle) * s.radius;
          s.mesh.position.y = Math.sin(s.angle) * s.radius;
          s.mesh.position.z = Math.cos(s.angle * 2) * 0.25;
        }
      });

      // Rotate Particles
      particles.rotation.y = t * 0.05;

      // Dynamic light intensity
      pLight1.intensity = 3 + Math.sin(t * 2) * 0.8;
      pLight2.intensity = 2 + Math.cos(t * 1.5) * 0.6;

      renderer.render(scene, camera);
    };

    animate();
    setIsLoaded(true);

    // ─── Resize ──────────────────────────────────────────────────
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // ─── Cleanup ─────────────────────────────────────────────────
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameRef.current);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
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
  }, []);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/80 border border-emerald-500/20 shadow-2xl ${className}`}
      onMouseMove={handleMouseMove}
    >
      {/* 3D Canvas */}
      <div
        ref={containerRef}
        className={`w-full h-full min-h-[320px] transition-opacity duration-700 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Cyber Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(16,185,129,0.3) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(16,185,129,0.3) 1px, transparent 1px)`,
          backgroundSize: "30px 30px",
        }}
      />

      {/* Top Left Status Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/70 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-emerald-300">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <span>LMS Neural Engine • Realtime</span>
      </div>

      {/* Top Right Course Info */}
      <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md px-3 py-1.5 text-xs text-slate-300">
        <span className="text-emerald-400 font-bold">{progressPercent}%</span>
        <span>Syllabus Mastered</span>
      </div>

      {/* Bottom HUD Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/80 backdrop-blur-md px-4 py-2.5">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Active Cohort Track</p>
          <p className="text-xs font-bold text-white truncate max-w-[220px] sm:max-w-none">{courseTitle}</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="hidden sm:inline font-mono">Cloud Labs: Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
