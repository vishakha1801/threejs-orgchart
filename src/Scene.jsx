import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createNodeGroup, CEO_Y, VP_Y, VP_SPACING, AGENT_STEP_Z, CARD_H, BG_COLOR } from './NodeBuilder.js';

// ==========================================
// ANIMATION & EASING UTILITIES
// ==========================================
// Easing functions help our animations feel smooth and natural instead of robotic.

// Eases in slowly, speeds up in the middle, and eases out slowly at the end.
const easeInOutCubic = (progress) => 
  progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

// Creates a playful "pop" or overshoot effect when items first appear.
const easeOutBack = (progress) => {
  const overshoot = 1.70158;
  const overshootPlusOne = overshoot + 1;
  return 1 + overshootPlusOne * Math.pow(progress - 1, 3) + overshoot * Math.pow(progress - 1, 2);
};

export default function Scene({ data, showAgents, zoomLevel = 1, showHeadshots = true, showTitles = true, showLocations = true, onSelect }) {
  const mountRef = useRef(null);
  const stateRef = useRef({});

  useEffect(() => {
    if (!data) return;
    const mount = mountRef.current;
    // --------------------------------------------------------
    // SCENE & CAMERA SETUP
    // --------------------------------------------------------
    const scene = new THREE.Scene();
    scene.background = BG_COLOR;

    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 1, 5000);
    // Initial pose — slightly zoomed in (matches the default 2D view)
    camera.position.set(0, 50, 1020);
    camera.lookAt(0, 50, 0);

    const webglRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    webglRenderer.outputColorSpace = THREE.SRGBColorSpace;
    webglRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    webglRenderer.toneMappingExposure = 1.05;
    webglRenderer.setSize(mount.clientWidth, mount.clientHeight);
    webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Enable soft shadows for the claymorphic look
    webglRenderer.shadowMap.enabled = true;
    webglRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    webglRenderer.domElement.style.position = 'absolute';
    webglRenderer.domElement.style.top = '0';
    mount.appendChild(webglRenderer.domElement);

    // Environment map — this gives the glossy materials something realistic to reflect
    const pmrem = new THREE.PMREMGenerator(webglRenderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    const controls = new OrbitControls(camera, webglRenderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 200;
    controls.maxDistance = 2000;
    controls.enableRotate = false;

    // Softer ambient since env map provides indirect light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.6);
    dirLight.position.set(200, 500, 300);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -1000;
    dirLight.shadow.camera.right = 1000;
    dirLight.shadow.camera.top = 1000;
    dirLight.shadow.camera.bottom = -1000;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Subtle fill from below for the glass underside
    const fillLight = new THREE.DirectionalLight(0xddddff, 0.4);
    fillLight.position.set(-200, -200, 200);
    scene.add(fillLight);

    const allGroups = [];
    const agentGroups = [];
    const interactiveMeshes = [];

    const startTime = performance.now();
    const STAGGER_MS = 160; // smoother, more deliberate one-at-a-time reveal
    const connectionLines = []; // { mesh, vpIndex, vpEntranceDelay }

    const ceo = createNodeGroup(data, true, false, 0, { showHeadshots, showTitles, showLocations });
    ceo.group.position.set(0, CEO_Y, 0);
    ceo.group.userData.defaultY = CEO_Y;
    ceo.group.userData.entranceDelay = 0;
    scene.add(ceo.group);
    allGroups.push(ceo.group);
    interactiveMeshes.push(ceo.cardMesh);

    const vpCount = data.children ? data.children.length : 0;
    const startX = -((vpCount - 1) * VP_SPACING) / 2;

    if (data.children) {
      data.children.forEach((vp, i) => {
        const x = startX + i * VP_SPACING;
        const vpEntranceDelay = (i + 1) * STAGGER_MS;

        const vpNode = createNodeGroup(vp, false, false, i, { showHeadshots, showTitles, showLocations });
        vpNode.group.position.set(x, VP_Y, 0);
        vpNode.group.userData.defaultY = VP_Y;
        vpNode.group.userData.entranceDelay = vpEntranceDelay;
        scene.add(vpNode.group);
        allGroups.push(vpNode.group);
        interactiveMeshes.push(vpNode.cardMesh);

        // --------------------------------------------------------
        // CONNECTION LINES
        // --------------------------------------------------------
        // Build three straight tube segments per VP.
        // 1. Trunk (drops straight down from CEO)
        // 2. Bus (horizontal line to the VP column)
        // 3. Drop (drops straight down to the VP card)
        const ceoBottomY = CEO_Y - 122 / 2;
        const vpTopY = VP_Y + CARD_H / 2;
        const midY = (ceoBottomY + vpTopY) / 2;
        const tubeRadius = 1.0;
        const lineColor = 0x7e7aa0;

        const lineGroup = new THREE.Group();
        lineGroup.renderOrder = -2;

        const buildTube = (a, b) => {
          const c = new THREE.LineCurve3(a, b);
          const g = new THREE.TubeGeometry(c, 1, tubeRadius, 6, false);
          const m = new THREE.MeshBasicMaterial({
            color: lineColor,
            transparent: true,
            opacity: 0
          });
          const mesh = new THREE.Mesh(g, m);
          mesh.renderOrder = -2;
          lineGroup.add(mesh);
          return m;
        };

        const trunkMat = buildTube(
          new THREE.Vector3(0, ceoBottomY, 0),
          new THREE.Vector3(0, midY, 0)
        );
        const busMat = buildTube(
          new THREE.Vector3(0, midY, 0),
          new THREE.Vector3(x, midY, 0)
        );
        const dropMat = buildTube(
          new THREE.Vector3(x, midY, 0),
          new THREE.Vector3(x, vpTopY, 0)
        );

        scene.add(lineGroup);
        connectionLines.push({
          mats: [trunkMat, busMat, dropMat],
          vpEntranceDelay
        });

        if (vp.agents) {
          vp.agents.forEach((agent, j) => {
            const agentNodeData = { ...agent, dept: vp.dept };
            const agentNode = createNodeGroup(agentNodeData, false, true, i + j + 1, { showHeadshots, showTitles, showLocations });
            agentNode.group.position.set(x, VP_Y, (j + 1) * AGENT_STEP_Z);
            agentNode.group.userData.defaultY = VP_Y;
            agentNode.group.userData.entranceDelay = (vpCount + 1) * STAGGER_MS + j * 60;
            scene.add(agentNode.group);
            allGroups.push(agentNode.group);
            agentGroups.push(agentNode.group);
            interactiveMeshes.push(agentNode.cardMesh);
          });
        }
      });
    }

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      webglRenderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // --------------------------------------------------------
    // RAYCASTER (Mouse Interactions)
    // --------------------------------------------------------
    // The raycaster translates 2D mouse positions on the screen into 3D line rays
    // to detect when you are hovering over a card.
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-1000, -1000);
    let hoveredGroup = null;
    let mouseDownPos = { x: 0, y: 0 };

    const onMouseDown = (e) => {
      mouseDownPos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      const rect = mount.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes, false);

      if (intersects.length > 0) {
        document.body.style.cursor = 'pointer';
        const hit = intersects[0];
        const { group, w, h, isAgent } = hit.object.userData;
        
        // Reset previously hovered group if we moved to a new one
        if (hoveredGroup && hoveredGroup !== group) {
          hoveredGroup.userData.targetRotX = 0;
          hoveredGroup.userData.targetRotY = 0;
          hoveredGroup.userData.targetY = null;
        }
        hoveredGroup = group;
        
        // Calculate tilt
        const uv = hit.uv; // 0 to 1 across the front face
        if (uv) {
          let dx = (uv.x - 0.5) * 2; // -1 to 1
          let dy = (uv.y - 0.5) * 2; // -1 to 1
          group.userData.targetRotX = dy * 12 * Math.PI / 180;
          group.userData.targetRotY = dx * 18 * Math.PI / 180;
          if (isAgent) {
             // lift agent enough to clear the VP card top so the text reads — bumped per request
             group.userData.targetY = group.userData.defaultY + 60;
          }
        }
      } else {
        document.body.style.cursor = 'default';
        if (hoveredGroup) {
          hoveredGroup.userData.targetRotX = 0;
          hoveredGroup.userData.targetRotY = 0;
          hoveredGroup.userData.targetY = null;
          hoveredGroup = null;
        }
      }
    };

    const onClick = (e) => {
      const dist = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);
      if (dist > 5) return; // Treat as a drag, don't trigger click

      const s = stateRef.current;
      if (hoveredGroup) {
        if (onSelect) onSelect(hoveredGroup.userData.node);
        const nodePos = hoveredGroup.position.clone();
        const { isAgent } = hoveredGroup.userData;
        const targetPos = new THREE.Vector3(nodePos.x, nodePos.y, nodePos.z + (isAgent ? 300 : 400));
        s.startTween(targetPos, nodePos, 800);
      } else {
        // Zoom out when clicking background
        if (onSelect) onSelect(null);
        if (s.startTween) {
          const { pos, target } = getCameraPositions(s.showAgentsMode, s.currentZoomLevel || 1);
          s.startTween(pos, target, 630);
        }
      }
    };

    mount.addEventListener('mousedown', onMouseDown);
    mount.addEventListener('mousemove', onMouseMove);
    mount.addEventListener('click', onClick);

    const tweenPos = { from: new THREE.Vector3(), to: new THREE.Vector3() };
    const tweenTarget = { from: new THREE.Vector3(), to: new THREE.Vector3() };

    const ENTRANCE_DURATION = 750; // ms per card pop-in
    const targetVec = new THREE.Vector3();

    // --------------------------------------------------------
    // ANIMATION LOOP
    // --------------------------------------------------------
    const animate = () => {
      const s = stateRef.current;
      const now = performance.now();
      const elapsedMilliseconds = now - startTime;
      const timeInSeconds = elapsedMilliseconds / 1000;

      // ---- Camera Tweening ----
      // Smoothly fly the camera to its new position when toggling 2D/3D modes
      if (s.tweenStart != null) {
        const progress = Math.min(1, (now - s.tweenStart) / s.tweenDuration);
        const easedProgress = easeInOutCubic(progress);
        
        camera.position.lerpVectors(tweenPos.from, tweenPos.to, easedProgress);
        controls.target.lerpVectors(tweenTarget.from, tweenTarget.to, easedProgress);
        camera.lookAt(controls.target);

        if (progress >= 1) {
          s.tweenStart = null;
          controls.update();
          if (s.onTweenComplete) s.onTweenComplete();
        }
      } else {
        controls.update();
      }

      // ---- Connection Lines Animation ----
      connectionLines.forEach(({ mats, vpEntranceDelay }) => {
        const lineProgress = Math.max(0, Math.min(1, (elapsedMilliseconds - vpEntranceDelay) / ENTRANCE_DURATION));
        const opacity = 0.55 * easeInOutCubic(lineProgress);
        mats.forEach(m => { m.opacity = opacity; });
      });

      // ---- Card Animations (Entrance, Hover Tilt, Idle Float, Glow) ----
      const showAgentsMode = !!s.showAgentsMode;

      allGroups.forEach(g => {
        const cardData = g.userData;
        const isAgent = agentGroups.includes(g);

        // 1. Entrance Pop-In
        const entranceProgress = Math.max(0, Math.min(1, (elapsedMilliseconds - cardData.entranceDelay) / ENTRANCE_DURATION));
        const entranceScale = entranceProgress === 0 ? 0.0001 : easeOutBack(entranceProgress);

        let targetScale;
        if (isAgent) {
          // Agents only appear when "Show Agents" is active
          targetScale = (showAgentsMode ? 1 : 0.0001) * (entranceProgress >= 1 ? 1 : entranceScale);
          targetVec.setScalar(targetScale);
          g.scale.lerp(targetVec, 0.20);
        } else {
          targetVec.setScalar(entranceScale);
          g.scale.lerp(targetVec, 0.22);
        }

        // 2. Hover Tilt
        g.rotation.x += (cardData.targetRotX - g.rotation.x) * 0.08;
        g.rotation.y += (cardData.targetRotY - g.rotation.y) * 0.08;

        // 3. Y-Axis Positioning (Hover Lift & Idle Float)
        const baseTargetY = cardData.targetY !== null ? cardData.targetY : cardData.defaultY;
        const isHoverLifted = cardData.targetY !== null;
        
        // Add a gentle floating animation only in 3D mode, and only if not actively hovered
        const idleFloatAmplitude = 2.2;
        const floatYOffset = (isHoverLifted || entranceProgress < 1 || !showAgentsMode)
          ? 0
          : Math.sin(timeInSeconds * 0.9 + cardData.idlePhase) * idleFloatAmplitude;
          
        g.position.y += ((baseTargetY + floatYOffset) - g.position.y) * 0.08;

        // 4. Hover Glow Effects
        const isHovered = (cardData.targetRotX !== 0 || cardData.targetRotY !== 0);

        if (cardData.halo) {
          // Pulsing halo logic
          const pulseIntensity = 0.78 + Math.sin(timeInSeconds * 1.3 + cardData.idlePhase) * 0.08;
          const hoverBrightnessMultiplier = isHovered ? 1.72 : 1;
          const targetOpacity = (isAgent ? 0.4 : 0.64) * pulseIntensity * hoverBrightnessMultiplier * entranceProgress;
          cardData.halo.material.opacity += (targetOpacity - cardData.halo.material.opacity) * 0.1;
          
          const targetHaloScale = isHovered ? 1.32 : 1.0;
          cardData.halo.scale.setScalar(cardData.halo.scale.x + (targetHaloScale - cardData.halo.scale.x) * 0.1);
        }

        if (cardData.frontMat) {
          // Inner card emissive glow
          const targetEmissive = isHovered ? 0.50 : 0.20;
          cardData.frontMat.emissiveIntensity += (targetEmissive - cardData.frontMat.emissiveIntensity) * 0.1;
        }
      });

      webglRenderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);

    window.__scene = { camera, controls, scene };
    stateRef.current = {
      camera, controls,
      agentGroups, interactiveMeshes,
      showAgentsMode: false,
      tweenStart: null,
      startTween(toPos, toTarget, durationMs = 630, onComplete = null) {
        tweenPos.from.copy(camera.position);
        tweenPos.to.copy(toPos);
        tweenTarget.from.copy(controls.target);
        tweenTarget.to.copy(toTarget);
        this.tweenStart = performance.now();
        this.tweenDuration = durationMs;
        this.onTweenComplete = onComplete;
        controls.enableRotate = false;
        controls.enablePan = false;
      }
    };

    return () => {
      window.removeEventListener('resize', onResize);
      mount.removeEventListener('mousedown', onMouseDown);
      mount.removeEventListener('mousemove', onMouseMove);
      mount.removeEventListener('click', onClick);
      document.body.style.cursor = 'default';
      mount.removeChild(webglRenderer.domElement);
    };
  }, []);

  // Calculates the desired camera position based on the current view mode
  const getCameraPositions = (showAgentsMode, zLevel) => {
    const centerY = (CEO_Y + VP_Y) / 2;
    if (showAgentsMode) {
      // 3D Mode: Strong side-tilt to reveal the agent stack trail along the Z-axis
      return {
        pos: new THREE.Vector3(-700, centerY + 220, 650),
        target: new THREE.Vector3(0, VP_Y - 40, -260)
      };
    } else {
      // 2D Mode: Snap to integer levels based on zoomLevel state
      if (zLevel === 1) {
        return { pos: new THREE.Vector3(0, centerY, 1020), target: new THREE.Vector3(0, centerY, 0) };
      } else if (zLevel === 2) {
        return { pos: new THREE.Vector3(0, VP_Y - 20, 800), target: new THREE.Vector3(0, VP_Y - 20, 0) };
      } else if (zLevel === 3) {
        return { pos: new THREE.Vector3(0, VP_Y - 40, 500), target: new THREE.Vector3(0, VP_Y - 40, 0) };
      } else if (zLevel === 4) {
        return { pos: new THREE.Vector3(0, VP_Y - 60, 300), target: new THREE.Vector3(0, VP_Y - 60, 0) };
      }
      return { pos: new THREE.Vector3(0, centerY, 1020), target: new THREE.Vector3(0, centerY, 0) };
    }
  };

  // Trigger the camera fly animation whenever the user toggles "Show Agents" or changes zoom
  useEffect(() => {
    const s = stateRef.current;
    if (!s.camera || !s.startTween) return;

    s.showAgentsMode = showAgents;
    s.currentZoomLevel = zoomLevel;

    const { pos, target } = getCameraPositions(showAgents, zoomLevel);
    s.startTween(pos, target, 630, () => {
      s.controls.enablePan = true;
      if (showAgents) {
        // Enable free rotation to explore the 3D space, but restrict angles so user doesn't get lost
        s.controls.enableRotate = true;
        s.controls.minPolarAngle = Math.PI * 0.2;
        s.controls.maxPolarAngle = Math.PI * 0.55;
        s.controls.minAzimuthAngle = -Math.PI * 0.4;
        s.controls.maxAzimuthAngle = Math.PI * 0.4;
      } else {
        // Lock rotation in 2D mode
        s.controls.enableRotate = false;
      }
    });

  }, [showAgents, zoomLevel]);

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, background: 'var(--bg)' }}
    />
  );
}
