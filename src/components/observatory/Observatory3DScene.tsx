'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { ObservatoryViewModel } from '@/lib/observatory/types';

interface Observatory3DSceneProps {
  viewModel: ObservatoryViewModel;
  onSelectNode?: (node: { type: 'evidence' | 'waypoint' | 'quality' | 'specimen'; title: string; detail: string }) => void;
  className?: string;
  isPaused?: boolean;
}

export default function Observatory3DScene({
  viewModel,
  onSelectNode,
  className = '',
  isPaused = false,
}: Observatory3DSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const [webGLFailed, setWebGLFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Detect prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Initialize Three.js Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x19211b, 0.04);

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.8, 8.2);
    camera.lookAt(0, 0, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
    } catch {
      queueMicrotask(() => setWebGLFailed(true));
      return;
    }

    // Lighting (Warm Naturalist Observatory)
    const ambientLight = new THREE.AmbientLight(0xf4f0e6, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff1d6, 1.4);
    keyLight.position.set(5, 8, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.5);
    rimLight.position.set(-6, -4, -4);
    scene.add(rimLight);

    // Root Group for interactive rotation
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Track interactable objects for raycasting
    const interactableObjects: THREE.Object3D[] = [];

    // Helper: Shared Naturalist Materials
    const brassMaterial = new THREE.MeshStandardMaterial({
      color: 0xb88b2a,
      roughness: 0.35,
      metalness: 0.7,
    });

    const forestMaterial = new THREE.MeshStandardMaterial({
      color: 0x1c3d2b,
      roughness: 0.5,
      metalness: 0.2,
    });

    // ----------------------------------------------------
    // 1. Specimen Anchor (Abstract Geometric Representation)
    // ----------------------------------------------------
    const anchorGroup = new THREE.Group();
    rootGroup.add(anchorGroup);

    const morphology = viewModel.morphologyType;
    let specimenMesh: THREE.Mesh;

    if (morphology === 'leaf') {
      // Botanical elliptical double-curved disc
      const leafGeo = new THREE.ConeGeometry(0.7, 1.6, 5);
      leafGeo.rotateX(Math.PI / 2);
      leafGeo.scale(1.2, 0.25, 0.9);
      specimenMesh = new THREE.Mesh(leafGeo, forestMaterial);
    } else if (morphology === 'stone') {
      // Faceted mineral polyhedron
      const stoneGeo = new THREE.DodecahedronGeometry(0.85, 0);
      const stoneMat = new THREE.MeshStandardMaterial({
        color: 0x5a5245,
        roughness: 0.7,
        metalness: 0.3,
        flatShading: true,
      });
      specimenMesh = new THREE.Mesh(stoneGeo, stoneMat);
    } else if (morphology === 'flower') {
      // Radial petal structure
      const flowerGeo = new THREE.TorusGeometry(0.75, 0.2, 8, 24);
      specimenMesh = new THREE.Mesh(flowerGeo, brassMaterial);
    } else if (morphology === 'bark') {
      // Fluted textured vertical column
      const barkGeo = new THREE.CylinderGeometry(0.55, 0.6, 1.5, 12);
      const barkMat = new THREE.MeshStandardMaterial({
        color: 0x4a3b2c,
        roughness: 0.8,
        flatShading: true,
      });
      specimenMesh = new THREE.Mesh(barkGeo, barkMat);
    } else if (morphology === 'cone') {
      // Layered spiral cone
      const coneGeo = new THREE.ConeGeometry(0.75, 1.6, 8);
      const coneMat = new THREE.MeshStandardMaterial({
        color: 0x6e4726,
        roughness: 0.6,
      });
      specimenMesh = new THREE.Mesh(coneGeo, coneMat);
    } else {
      // Ambient astrolabe sphere
      const sphereGeo = new THREE.IcosahedronGeometry(0.75, 1);
      specimenMesh = new THREE.Mesh(sphereGeo, brassMaterial);
    }

    specimenMesh.userData = {
      type: 'specimen',
      title: viewModel.subject,
      detail: `${viewModel.specimenDescription} (Visual Field Representation)`,
    };
    anchorGroup.add(specimenMesh);
    interactableObjects.push(specimenMesh);

    // Subtle inner glowing halo ring
    const haloGeo = new THREE.RingGeometry(0.95, 1.02, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xb88b2a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.rotation.x = Math.PI / 2;
    anchorGroup.add(haloMesh);

    // ----------------------------------------------------
    // 2. Quality Rings (5 Concentric Orbits from Rubric)
    // ----------------------------------------------------
    const qualityGroup = new THREE.Group();
    rootGroup.add(qualityGroup);

    viewModel.qualityRings.forEach((ring) => {
      const ringPoints: THREE.Vector3[] = [];
      const segments = 48;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        ringPoints.push(new THREE.Vector3(Math.cos(theta) * ring.radius, 0, Math.sin(theta) * ring.radius));
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPoints);
      const ringLineMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(ring.color),
        transparent: true,
        opacity: ring.opacity,
        linewidth: 1,
      });
      const ringLine = new THREE.LineLoop(ringGeo, ringLineMat);
      ringLine.userData = {
        type: 'quality',
        title: `Quality: ${ring.label}`,
        detail: `Score: ${ring.score} / ${ring.maxScore} pts (${ring.passed ? 'PASSED' : 'FLAGGED'})`,
      };
      qualityGroup.add(ringLine);
      interactableObjects.push(ringLine);
    });

    // ----------------------------------------------------
    // 3. Evidence Nodes (Spatial Visual Clues)
    // ----------------------------------------------------
    const evidenceGroup = new THREE.Group();
    rootGroup.add(evidenceGroup);

    const evidenceSphereGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const evidenceMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
      roughness: 0.3,
    });

    viewModel.evidenceNodes.forEach((node) => {
      const x = Math.cos(node.angle) * node.radius;
      const z = Math.sin(node.angle) * node.radius;
      const y = node.elevation;

      const nodeMesh = new THREE.Mesh(evidenceSphereGeo, evidenceMat);
      nodeMesh.position.set(x, y, z);
      nodeMesh.userData = {
        type: 'evidence',
        title: 'Observed Visual Clue',
        detail: node.label,
      };
      evidenceGroup.add(nodeMesh);
      interactableObjects.push(nodeMesh);

      // Delicate filament line back to center anchor
      const filamentGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(x, y, z),
      ]);
      const filamentMat = new THREE.LineBasicMaterial({
        color: 0xb88b2a,
        transparent: true,
        opacity: 0.25,
      });
      const filament = new THREE.Line(filamentGeo, filamentMat);
      evidenceGroup.add(filament);
    });

    // ----------------------------------------------------
    // 4. Mission Orbit & Waypoints (Steps 01 - 04)
    // ----------------------------------------------------
    const missionGroup = new THREE.Group();
    missionGroup.rotation.x = viewModel.missionOrbit.inclination;
    rootGroup.add(missionGroup);

    const orbitPoints: THREE.Vector3[] = [];
    const orbitSegments = 64;
    const oR = viewModel.missionOrbit.orbitRadius;
    for (let i = 0; i <= orbitSegments; i++) {
      const theta = (i / orbitSegments) * Math.PI * 2;
      orbitPoints.push(new THREE.Vector3(Math.cos(theta) * oR, 0, Math.sin(theta) * oR));
    }
    const orbitLineGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitLineMat = new THREE.LineBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.55,
    });
    const orbitLine = new THREE.LineLoop(orbitLineGeo, orbitLineMat);
    missionGroup.add(orbitLine);

    // Waypoint Markers
    const waypointGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    const waypointMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.2,
      metalness: 0.6,
    });

    viewModel.missionOrbit.waypoints.forEach((wp) => {
      const wpMesh = new THREE.Mesh(waypointGeo, waypointMat);
      wpMesh.position.set(wp.position[0], 0, wp.position[2]);
      wpMesh.userData = {
        type: 'waypoint',
        title: `Mission Step 0${wp.stepNumber}`,
        detail: wp.instruction,
      };
      missionGroup.add(wpMesh);
      interactableObjects.push(wpMesh);
    });

    // ----------------------------------------------------
    // 5. Field Constellation (Outer Session Discoveries)
    // ----------------------------------------------------
    if (viewModel.constellationNodes && viewModel.constellationNodes.length > 0) {
      const constellationGroup = new THREE.Group();
      rootGroup.add(constellationGroup);

      const starGeo = new THREE.SphereGeometry(0.08, 8, 8);
      const starMat = new THREE.MeshBasicMaterial({
        color: 0xe8e3d8,
      });

      viewModel.constellationNodes.forEach((star) => {
        const starMesh = new THREE.Mesh(starGeo, starMat);
        starMesh.position.set(...star.position);
        starMesh.userData = {
          type: 'specimen',
          title: `Discovery: ${star.subject}`,
          detail: `Mission Type: ${star.missionType}. Completed in active field session.`,
        };
        constellationGroup.add(starMesh);
        interactableObjects.push(starMesh);
      });

      // Filaments connecting discoveries
      const linePairs: THREE.Vector3[] = [];
      for (let i = 1; i < viewModel.constellationNodes.length; i++) {
        const p1 = viewModel.constellationNodes[i - 1].position;
        const p2 = viewModel.constellationNodes[i].position;
        linePairs.push(new THREE.Vector3(...p1), new THREE.Vector3(...p2));
      }
      if (linePairs.length > 0) {
        const constLinesGeo = new THREE.BufferGeometry().setFromPoints(linePairs);
        const constLinesMat = new THREE.LineSegments(
          constLinesGeo,
          new THREE.LineBasicMaterial({ color: 0x736b5e, transparent: true, opacity: 0.3 })
        );
        constellationGroup.add(constLinesMat);
      }
    }

    // ----------------------------------------------------
    // 6. Field Twin Bridge (When Comparing Two Specimens)
    // ----------------------------------------------------
    if (viewModel.comparison) {
      const bridgeGroup = new THREE.Group();
      rootGroup.add(bridgeGroup);

      // Offset Specimen A to Left, create Specimen B on Right
      anchorGroup.position.x = -2.2;

      const twinGeo = new THREE.IcosahedronGeometry(0.75, 1);
      const twinMesh = new THREE.Mesh(twinGeo, brassMaterial);
      twinMesh.position.set(2.2, 0, 0);
      twinMesh.userData = {
        type: 'specimen',
        title: viewModel.comparison.rightSubject,
        detail: 'Second comparison specimen in Field Twin view.',
      };
      bridgeGroup.add(twinMesh);
      interactableObjects.push(twinMesh);

      // Connective morphological bridge curves
      const bridgeCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-2.2, 0, 0),
        new THREE.Vector3(0, 0.9, 0),
        new THREE.Vector3(2.2, 0, 0)
      );
      const bridgePoints = bridgeCurve.getPoints(24);
      const bridgeGeo = new THREE.BufferGeometry().setFromPoints(bridgePoints);
      const bridgeLine = new THREE.Line(
        bridgeGeo,
        new THREE.LineBasicMaterial({ color: 0xb88b2a, linewidth: 2 })
      );
      bridgeGroup.add(bridgeLine);
    }

    // ----------------------------------------------------
    // Interactive Raycasting & Pointer Orbit
    // ----------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotationVelocityX = 0;
    let rotationVelocityY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        rotationVelocityY = deltaX * 0.005;
        rotationVelocityX = deltaY * 0.005;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      } else {
        // Raycast for hover label
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObjects(interactableObjects, false);
        if (intersects.length > 0) {
          const hovered = intersects[0].object;
          setHoveredLabel(hovered.userData?.title ?? null);
        } else {
          setHoveredLabel(null);
        }
      }
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const handleClick = () => {
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(interactableObjects, false);
      if (intersects.length > 0) {
        const clicked = intersects[0].object;
        if (clicked.userData?.type) {
          onSelectNode?.({
            type: clicked.userData.type,
            title: clicked.userData.title ?? 'Observatory Node',
            detail: clicked.userData.detail ?? '',
          });
        }
      }
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('click', handleClick);

    // ----------------------------------------------------
    // Demand-Driven & Controlled Render Loop
    // ----------------------------------------------------
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (isPaused) return;

      const delta = clock.getDelta();

      // Damped User Drag Orbit
      rootGroup.rotation.y += rotationVelocityY;
      rootGroup.rotation.x += rotationVelocityX;
      rotationVelocityX *= 0.92;
      rotationVelocityY *= 0.92;

      // Gentle Autonomous Naturalist Drift (unless user prefers reduced motion)
      if (!prefersReducedMotion && !isDragging) {
        rootGroup.rotation.y += delta * 0.12;
        anchorGroup.rotation.y += delta * 0.25;
        anchorGroup.position.y = Math.sin(clock.getElapsedTime() * 1.2) * 0.08;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Observer
    const handleResize = () => {
      if (!container || !renderer) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Clean Disposal on Unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('click', handleClick);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
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
  }, [viewModel, isPaused, onSelectNode]);

  if (webGLFailed) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-95 bg-[#19211B] rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none ${className}`}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Floating Hover Clue Tooltip */}
      {hoveredLabel && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#F4F0E6]/95 border border-[#B88B2A] text-[#19211B] px-3 py-1.5 rounded-full text-xs font-sans tracking-wide shadow-lg pointer-events-none transition-all">
          {hoveredLabel}
        </div>
      )}

      {/* Touch Interaction Hint */}
      <div className="absolute bottom-3 left-4 text-[10px] font-mono text-[#E8E3D8]/60 pointer-events-none">
        DRAG TO ROTATE • TAP NODE TO INSPECT
      </div>
    </div>
  );
}
