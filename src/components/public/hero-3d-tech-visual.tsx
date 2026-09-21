"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Brain, ShieldCheck, Sparkles, Activity, Lock, Zap, ArrowRight, Radio } from "lucide-react";
import { openCareerCounselingModal } from "@/components/public/career-counseling-modal";

export function Hero3DTechVisual() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"ai" | "cyber">("ai");
  const [webglSupported, setWebglSupported] = useState(true);
  const [metrics, setMetrics] = useState({
    tensors: 14920,
    latency: 12,
    threatsBlocked: 2480,
    firewallIntegrity: 100,
  });

  // Keep live metrics tickling subtly
  useEffect(() => {
    const timer = setInterval(() => {
      setMetrics((prev) => ({
        tensors: prev.tensors + Math.floor(Math.random() * 8) + 2,
        latency: Math.floor(Math.random() * 3) + 11,
        threatsBlocked: prev.threatsBlocked + (Math.random() > 0.6 ? 1 : 0),
        firewallIntegrity: 100,
      }));
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  // Three.js 3D WebGL Scene Implementation
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Detect WebGL capability
    try {
      const testCanvas = document.createElement("canvas");
      const gl = testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl");
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch {
      setWebglSupported(false);
      return;
    }

    let animationFrameId: number;
    const width = container.clientWidth || 540;
    const height = container.clientHeight || 520;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.8);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const primaryLight = new THREE.PointLight(0x10b981, 3.5, 30);
    primaryLight.position.set(4, 4, 6);
    scene.add(primaryLight);

    const secondaryLight = new THREE.PointLight(0x06b6d4, 3.0, 30);
    secondaryLight.position.set(-4, -3, 5);
    scene.add(secondaryLight);

    const backRimLight = new THREE.DirectionalLight(0x8b5cf6, 1.8);
    backRimLight.position.set(0, 5, -5);
    scene.add(backRimLight);

    // 4. Background Starfield / Floating Data Dust (300 particles)
    const dustCount = 280;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustSpeeds = new Float32Array(dustCount);
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 14;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      dustSpeeds[i] = 0.002 + Math.random() * 0.004;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0x10b981,
      size: 0.045,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const dustField = new THREE.Points(dustGeo, dustMat);
    scene.add(dustField);

    // ======================================================================
    // 5. AI / MACHINE LEARNING SCENE GROUP
    // ======================================================================
    const aiGroup = new THREE.Group();
    scene.add(aiGroup);

    // Dynamic Central AI Canvas Texture (Glowing "AI" Core)
    const aiTextCanvas = document.createElement("canvas");
    aiTextCanvas.width = 512;
    aiTextCanvas.height = 512;
    const ctx = aiTextCanvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, 512, 512);
      ctx.fillStyle = "rgba(6, 78, 59, 0.4)";
      ctx.beginPath();
      ctx.arc(256, 256, 230, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Inner Circle
      const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 240);
      grad.addColorStop(0, "rgba(52, 211, 153, 0.95)");
      grad.addColorStop(0.5, "rgba(16, 185, 129, 0.5)");
      grad.addColorStop(1, "rgba(5, 150, 105, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(256, 256, 240, 0, Math.PI * 2);
      ctx.fill();

      // AI Text
      ctx.font = "900 140px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#34d399";
      ctx.shadowBlur = 35;
      ctx.fillText("AI / ML", 256, 240);

      ctx.font = "700 36px monospace";
      ctx.fillStyle = "#a7f3d0";
      ctx.shadowBlur = 15;
      ctx.fillText("NEURAL CORE", 256, 330);
    }
    const aiTexture = new THREE.CanvasTexture(aiTextCanvas);

    // Central AI Core Billboard Emblem
    const aiEmblemGeo = new THREE.PlaneGeometry(1.6, 1.6);
    const aiEmblemMat = new THREE.MeshBasicMaterial({
      map: aiTexture,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const aiEmblem = new THREE.Mesh(aiEmblemGeo, aiEmblemMat);
    aiGroup.add(aiEmblem);

    // Inner Translucent Holographic Icosahedron Core
    const aiCoreInnerGeo = new THREE.IcosahedronGeometry(1.15, 2);
    const aiCoreInnerMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      emissive: 0x10b981,
      emissiveIntensity: 0.45,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: false,
      transparent: true,
      opacity: 0.35,
    });
    const aiCoreInner = new THREE.Mesh(aiCoreInnerGeo, aiCoreInnerMat);
    aiGroup.add(aiCoreInner);

    // Outer Faceted Wireframe Cage
    const aiCoreWireGeo = new THREE.IcosahedronGeometry(1.35, 1);
    const aiCoreWireMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    const aiCoreWire = new THREE.Mesh(aiCoreWireGeo, aiCoreWireMat);
    aiGroup.add(aiCoreWire);

    // AI Orbital Rings
    const ring1Geo = new THREE.TorusGeometry(1.9, 0.02, 16, 100);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    aiGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(2.35, 0.025, 16, 100);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.y = Math.PI / 4;
    aiGroup.add(ring2);

    const ring3Geo = new THREE.TorusGeometry(2.7, 0.018, 16, 100);
    const ring3Mat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.z = Math.PI / 2.5;
    aiGroup.add(ring3);

    // Neural Network Nodes & Synaptic Connections
    const nodeCount = 18;
    const nodePositions: THREE.Vector3[] = [];
    const nodeMeshes: THREE.Mesh[] = [];
    const nodeGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0xa7f3d0,
      emissive: 0x10b981,
      emissiveIntensity: 0.8,
      roughness: 0.3,
    });

    for (let i = 0; i < nodeCount; i++) {
      const radius = 2.0 + (i % 3) * 0.45;
      const theta = (i / nodeCount) * Math.PI * 2;
      const phi = ((i % 5) - 2) * 0.45;
      const pos = new THREE.Vector3(
        radius * Math.cos(theta) * Math.cos(phi),
        radius * Math.sin(phi) + ((i % 2) * 0.3 - 0.15),
        radius * Math.sin(theta) * Math.cos(phi)
      );
      nodePositions.push(pos);

      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.copy(pos);
      nodeMeshes.push(nodeMesh);
      aiGroup.add(nodeMesh);
    }

    // Synaptic Lines connecting nodes
    const lineIndices: number[] = [];
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dist = nodePositions[i].distanceTo(nodePositions[j]);
        if (dist < 2.3) {
          lineIndices.push(i, j);
        }
      }
    }
    const linePositions = new Float32Array(lineIndices.length * 3);
    for (let k = 0; k < lineIndices.length; k++) {
      const p = nodePositions[lineIndices[k]];
      linePositions[k * 3] = p.x;
      linePositions[k * 3 + 1] = p.y;
      linePositions[k * 3 + 2] = p.z;
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
    });
    const synapticLines = new THREE.LineSegments(lineGeo, lineMat);
    aiGroup.add(synapticLines);

    // ======================================================================
    // 6. CYBER SECURITY SCENE GROUP
    // ======================================================================
    const cyberGroup = new THREE.Group();
    cyberGroup.scale.set(0.001, 0.001, 0.001); // Initialized hidden
    scene.add(cyberGroup);

    // 3D Extruded Cyber Security Shield Geometry
    const shieldShape = new THREE.Shape();
    shieldShape.moveTo(0, 1.4);
    shieldShape.quadraticCurveTo(1.2, 1.2, 1.2, 0.1);
    shieldShape.quadraticCurveTo(1.1, -1.0, 0, -1.65);
    shieldShape.quadraticCurveTo(-1.1, -1.0, -1.2, 0.1);
    shieldShape.quadraticCurveTo(-1.2, 1.2, 0, 1.4);

    const shieldExtrudeSettings = {
      depth: 0.25,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.06,
      bevelThickness: 0.06,
    };
    const shieldGeo = new THREE.ExtrudeGeometry(shieldShape, shieldExtrudeSettings);
    shieldGeo.center();

    const shieldMat = new THREE.MeshPhysicalMaterial({
      color: 0x083344,
      emissive: 0x0284c7,
      emissiveIntensity: 0.5,
      metalness: 0.85,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0.88,
    });
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    cyberGroup.add(shieldMesh);

    // Wireframe Shield Rim
    const shieldWireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const shieldWireMesh = new THREE.Mesh(shieldGeo, shieldWireMat);
    shieldWireMesh.scale.set(1.02, 1.02, 1.02);
    cyberGroup.add(shieldWireMesh);

    // Central Digital Lock / Hologram Texture for Shield
    const lockCanvas = document.createElement("canvas");
    lockCanvas.width = 512;
    lockCanvas.height = 512;
    const lctx = lockCanvas.getContext("2d");
    if (lctx) {
      lctx.clearRect(0, 0, 512, 512);

      // Glowing Cyan Crest
      const lgrad = lctx.createRadialGradient(256, 256, 30, 256, 256, 230);
      lgrad.addColorStop(0, "rgba(56, 189, 248, 0.95)");
      lgrad.addColorStop(0.6, "rgba(2, 132, 199, 0.4)");
      lgrad.addColorStop(1, "rgba(8, 51, 68, 0)");
      lctx.fillStyle = lgrad;
      lctx.beginPath();
      lctx.arc(256, 256, 230, 0, Math.PI * 2);
      lctx.fill();

      // Cyber Lock Icon
      lctx.strokeStyle = "#38bdf8";
      lctx.lineWidth = 14;
      lctx.shadowColor = "#38bdf8";
      lctx.shadowBlur = 30;

      // Shackle
      lctx.beginPath();
      lctx.arc(256, 190, 60, Math.PI, 0, false);
      lctx.stroke();

      // Body
      lctx.fillStyle = "#ffffff";
      lctx.fillRect(186, 190, 140, 110);

      // Keyhole
      lctx.fillStyle = "#0284c7";
      lctx.beginPath();
      lctx.arc(256, 230, 16, 0, Math.PI * 2);
      lctx.fill();
      lctx.fillRect(250, 230, 12, 35);

      lctx.font = "800 34px monospace";
      lctx.textAlign = "center";
      lctx.fillStyle = "#e0f2fe";
      lctx.shadowBlur = 15;
      lctx.fillText("ZERO-TRUST SOC", 256, 360);
    }
    const lockTexture = new THREE.CanvasTexture(lockCanvas);
    const lockEmblemMat = new THREE.MeshBasicMaterial({
      map: lockTexture,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const lockEmblem = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), lockEmblemMat);
    lockEmblem.position.z = 0.22;
    cyberGroup.add(lockEmblem);

    // Concentric Cyber Security Defense Rings
    const secRing1 = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.02, 16, 100),
      new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
      })
    );
    secRing1.rotation.x = Math.PI / 2.3;
    cyberGroup.add(secRing1);

    const secRing2 = new THREE.Mesh(
      new THREE.TorusGeometry(2.55, 0.025, 16, 100),
      new THREE.MeshBasicMaterial({
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
      })
    );
    secRing2.rotation.y = Math.PI / 3;
    cyberGroup.add(secRing2);

    // Radar Scanning Line Sweeper
    const radarGeo = new THREE.BufferGeometry();
    const radarLinePos = new Float32Array([0, 0, 0, 2.7, 0, 0]);
    radarGeo.setAttribute("position", new THREE.BufferAttribute(radarLinePos, 3));
    const radarMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 3,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const radarSweep = new THREE.Line(radarGeo, radarMat);
    cyberGroup.add(radarSweep);

    // Blocked Threat Particles (Deflected upon hitting shield radius)
    const threatCount = 45;
    const threatGeo = new THREE.BufferGeometry();
    const threatPos = new Float32Array(threatCount * 3);
    const threatVelocities: { x: number; y: number; z: number; speed: number }[] = [];

    for (let i = 0; i < threatCount; i++) {
      const angle = (i / threatCount) * Math.PI * 2;
      const r = 3.6 + Math.random() * 2.0;
      threatPos[i * 3] = Math.cos(angle) * r;
      threatPos[i * 3 + 1] = (Math.random() - 0.5) * 2.5;
      threatPos[i * 3 + 2] = Math.sin(angle) * r;

      threatVelocities.push({
        x: -Math.cos(angle),
        y: (Math.random() - 0.5) * 0.3,
        z: -Math.sin(angle),
        speed: 0.025 + Math.random() * 0.02,
      });
    }
    threatGeo.setAttribute("position", new THREE.BufferAttribute(threatPos, 3));
    const threatMat = new THREE.PointsMaterial({
      color: 0xf43f5e,
      size: 0.07,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const threatParticles = new THREE.Points(threatGeo, threatMat);
    cyberGroup.add(threatParticles);

    // ======================================================================
    // 7. MOUSE PARALLAX & SMOOTH TILT TRACKING
    // ======================================================================
    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0;
    let targetRotY = 0;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const rect = container.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      mouseX = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((clientY - rect.top) / rect.height) * 2 - 1);
    };

    container.addEventListener("mousemove", handlePointerMove);
    container.addEventListener("touchmove", handlePointerMove);

    // ======================================================================
    // 8. RESIZE OBSERVER (Responsive 3D Viewport)
    // ======================================================================
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newW = entry.contentRect.width;
        const newH = entry.contentRect.height;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // ======================================================================
    // 9. RENDER LOOP (Silky Smooth 60 FPS Engine)
    // ======================================================================
    let clock = new THREE.Clock();
    let radarAngle = 0;

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Damped Parallax Mouse Tilt
      targetRotY += (mouseX * 0.35 - targetRotY) * 0.05;
      targetRotX += (-mouseY * 0.25 - targetRotX) * 0.05;

      camera.position.x = targetRotY * 1.5;
      camera.position.y = targetRotX * 1.2;
      camera.lookAt(0, 0, 0);

      // Smooth Mode Morph (Scales AI group vs Cyber group)
      const targetAiScale = mode === "ai" ? 1 : 0.001;
      const targetCyberScale = mode === "cyber" ? 1 : 0.001;

      aiGroup.scale.lerp(new THREE.Vector3(targetAiScale, targetAiScale, targetAiScale), 0.08);
      cyberGroup.scale.lerp(
        new THREE.Vector3(targetCyberScale, targetCyberScale, targetCyberScale),
        0.08
      );

      // Ambient Starfield Drift
      dustField.rotation.y = elapsed * 0.03;
      dustField.rotation.x = elapsed * 0.015;

      // AI Mode Animations
      if (aiGroup.scale.x > 0.05) {
        aiCoreInner.rotation.y = elapsed * 0.4;
        aiCoreInner.rotation.x = elapsed * 0.25;

        aiCoreWire.rotation.y = -elapsed * 0.3;
        aiCoreWire.rotation.z = elapsed * 0.2;

        ring1.rotation.z = elapsed * 0.35;
        ring2.rotation.x = -elapsed * 0.25;
        ring3.rotation.y = elapsed * 0.2;

        // Pulse node materials
        const pulse = Math.sin(elapsed * 3) * 0.3 + 0.7;
        nodeMat.emissiveIntensity = pulse;

        // Keep emblem facing camera
        aiEmblem.lookAt(camera.position);

        // Dynamic light color pulse
        primaryLight.color.setHex(0x10b981);
        primaryLight.intensity = 3.0 + Math.sin(elapsed * 2) * 0.8;
      }

      // Cyber Mode Animations
      if (cyberGroup.scale.x > 0.05) {
        shieldMesh.rotation.y = Math.sin(elapsed * 0.8) * 0.25;
        shieldWireMesh.rotation.copy(shieldMesh.rotation);
        lockEmblem.rotation.copy(shieldMesh.rotation);

        secRing1.rotation.z = elapsed * 0.5;
        secRing2.rotation.y = -elapsed * 0.4;

        // Rotate Radar Beam
        radarAngle += delta * 2.2;
        radarSweep.rotation.z = radarAngle;

        // Animate Threat Particles & Deflection Barrier
        const threatPositionsAttr = threatGeo.attributes.position as THREE.BufferAttribute;
        const arr = threatPositionsAttr.array as Float32Array;

        for (let i = 0; i < threatCount; i++) {
          const v = threatVelocities[i];
          arr[i * 3] += v.x * v.speed;
          arr[i * 3 + 1] += v.y * v.speed;
          arr[i * 3 + 2] += v.z * v.speed;

          // Distance from center
          const dist = Math.sqrt(
            arr[i * 3] * arr[i * 3] +
              arr[i * 3 + 1] * arr[i * 3 + 1] +
              arr[i * 3 + 2] * arr[i * 3 + 2]
          );

          // If threat hits the protective firewall perimeter (radius 1.8), deflect it outward!
          if (dist < 1.8) {
            const angle = Math.random() * Math.PI * 2;
            const r = 4.2 + Math.random() * 1.5;
            arr[i * 3] = Math.cos(angle) * r;
            arr[i * 3 + 1] = (Math.random() - 0.5) * 2.5;
            arr[i * 3 + 2] = Math.sin(angle) * r;
          }
        }
        threatPositionsAttr.needsUpdate = true;

        // Shift primary light to Cyber Cyan
        primaryLight.color.setHex(0x06b6d4);
        primaryLight.intensity = 3.2 + Math.sin(elapsed * 2.5) * 0.6;
      }

      renderer.render(scene, camera);
    };

    render();

    // ======================================================================
    // 10. CLEANUP & RESOURCE DISPOSAL
    // ======================================================================
    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener("mousemove", handlePointerMove);
      container.removeEventListener("touchmove", handlePointerMove);
      resizeObserver.disconnect();

      // Dispose Geometries & Materials
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
    };
  }, [mode]);

  const handleOpenCounseling = () => {
    if (mode === "ai") {
      openCareerCounselingModal("Master in Artificial Intelligence and Machine Learning");
    } else {
      openCareerCounselingModal("Cyber Security Complete Course");
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[460px] sm:h-[500px] lg:h-[540px] rounded-3xl overflow-hidden select-none bg-gradient-to-b from-slate-950/60 via-slate-900/40 to-slate-950/70 border border-emerald-500/20 backdrop-blur-md shadow-2xl flex flex-col justify-between"
    >
      {/* Background Matrix Radial Glow */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none ${
          mode === "ai"
            ? "bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.18)_0%,transparent_70%)]"
            : "bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.18)_0%,transparent_70%)]"
        }`}
      />

      {/* 3D WebGL Canvas */}
      {webglSupported ? (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />
      ) : (
        /* Graceful WebGL Fallback if browser disabled */
        <div className="absolute inset-0 flex items-center justify-center text-center p-6 text-slate-300">
          <div className="space-y-3">
            <Brain className="w-16 h-16 text-emerald-400 mx-auto animate-pulse" />
            <p className="text-sm font-semibold">Interactive 3D Technology Engine Active</p>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TOP HEADER & PREMIUM 3D DOMAIN SWITCHER                              */}
      {/* ==================================================================== */}
      <div className="relative z-20 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-none">
        {/* Real-Time Live Status HUD */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-700/80 text-[11px] font-mono shadow-md backdrop-blur-md pointer-events-auto">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                mode === "ai" ? "bg-emerald-400" : "bg-cyan-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                mode === "ai" ? "bg-emerald-500" : "bg-cyan-500"
              }`}
            />
          </span>
          <span
            className={`font-bold uppercase tracking-wider text-[10px] ${
              mode === "ai" ? "text-emerald-400" : "text-cyan-400"
            }`}
          >
            {mode === "ai" ? "AI Neural Mesh • Online" : "SOC Cyber Defense • Active"}
          </span>
        </div>

        {/* Small Premium Switcher Above/Inside Visual */}
        <div className="inline-flex p-1 rounded-2xl bg-slate-950/90 border border-slate-700/80 shadow-xl backdrop-blur-md pointer-events-auto">
          <button
            type="button"
            onClick={() => setMode("ai")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
              mode === "ai"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950"
                : "text-slate-400 hover:text-white hover:bg-slate-800/80"
            }`}
          >
            <Brain className="h-3.5 w-3.5 text-emerald-300" />
            <span>AI / ML</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("cyber")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
              mode === "cyber"
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950"
                : "text-slate-400 hover:text-white hover:bg-slate-800/80"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-300" />
            <span>CYBER SECURITY</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* FLOATING 3D LABELS (Positioned with 3D Depth & Subtle Animation)      */}
      {/* ==================================================================== */}
      <div className="relative z-10 pointer-events-none flex-1 flex flex-col justify-between p-4 sm:p-5">
        {/* Top Floating Badges */}
        <div className="flex items-start justify-between">
          <div className="animate-bounce [animation-duration:5s] px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-700/60 shadow-lg backdrop-blur-md text-[10px] font-mono text-slate-200">
            {mode === "ai" ? "⚡ PyTorch 2.5 • CUDA 12.4" : "🛡️ SOC Threat Intel Desk"}
          </div>

          <div className="animate-bounce [animation-duration:6s] px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-700/60 shadow-lg backdrop-blur-md text-[10px] font-mono text-slate-200">
            {mode === "ai" ? "🧠 Generative AI & LLMs" : "🔒 Zero-Trust Framework"}
          </div>
        </div>

        {/* Mid-Floating Badges */}
        <div className="flex items-center justify-between">
          <div className="animate-bounce [animation-duration:4.5s] px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-700/60 shadow-lg backdrop-blur-md text-[10px] font-mono text-slate-200">
            {mode === "ai" ? "🔍 RAG & Vector Embeddings" : "⚔️ Ethical Hacking Sandbox"}
          </div>

          <div className="animate-bounce [animation-duration:5.5s] px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-700/60 shadow-lg backdrop-blur-md text-[10px] font-mono text-slate-200">
            {mode === "ai" ? "🚀 MLOps & Autonomous Agents" : "📡 Real-Time DPI Firewall"}
          </div>
        </div>

        {/* Bottom Floating Stats & Interaction Callout */}
        <div className="flex items-end justify-between pt-2">
          <div className="animate-bounce [animation-duration:4.2s] px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-700/60 shadow-lg backdrop-blur-md text-[10px] font-mono text-slate-200">
            {mode === "ai"
              ? `📊 ${metrics.tensors.toLocaleString()} Tensors • ${metrics.latency}ms Latency`
              : `🎯 ${metrics.threatsBlocked.toLocaleString()} Attacks Blocked • 100% Isolated`}
          </div>

          <div className="animate-bounce [animation-duration:4.8s] px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-700/60 shadow-lg backdrop-blur-md text-[10px] font-mono text-slate-200">
            {mode === "ai" ? "✨ Computer Vision & NLP" : "🔐 AES-256 GCM Encryption"}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* BOTTOM FOOTER HUD & INTERACTIVE COUNSELOR TRIGGER                    */}
      {/* ==================================================================== */}
      <div className="relative z-20 p-4 sm:p-5 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800/70">
        <div className="text-[11px] text-slate-300 text-center sm:text-left">
          <span className="font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Interactive 3D Production Labs • Prayagraj & Live Online</span>
          </span>
          <p className="text-[10px] text-slate-400">
            Rotate & tilt with mouse/touch • 100% hands-on enterprise hardware
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCounseling}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg transition-all duration-300 cursor-pointer ${
            mode === "ai"
              ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950"
              : "bg-cyan-600 hover:bg-cyan-500 shadow-cyan-950"
          }`}
        >
          <span>{mode === "ai" ? "Explore AI Curriculum & Syllabus" : "Explore Cyber Security Syllabus"}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
