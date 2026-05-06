import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { DEPARTMENTS } from './data.js';

// ==========================================
// LAYOUT CONSTANTS
// ==========================================

export const CEO_Y = 160;
export const VP_Y = -60;
export const VP_SPACING = 308;
export const AGENT_STEP_Z = -88;
export const CARD_H = 112;

// Background — soft lavender-gray, per user spec
export const BG_COLOR = new THREE.Color('#cacade');

const materials = {};

// Colored "lip" base — glassy pearl: high clearcoat + iridescence, hint of transmission
function getGlassMaterial(colorHex) {
  const key = colorHex + '_glass';
  if (!materials[key]) {
    materials[key] = new THREE.MeshPhysicalMaterial({
      color: colorHex,
      roughness: 0.18,
      metalness: 0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      iridescence: 0.55,
      iridescenceIOR: 1.4,
      iridescenceThicknessRange: [180, 460],
      reflectivity: 0.6,
      sheen: 0.4,
      sheenRoughness: 0.6,
      sheenColor: new THREE.Color(colorHex).lerp(new THREE.Color('#ffffff'), 0.6),
      envMapIntensity: 1.4
    });
  }
  return materials[key];
}

// Glossy front card — brighter, with a soft emissive lift for that "lit from within" feel
function getCardFrontMaterial(map) {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map,
    emissive: 0xffffff,
    emissiveMap: map,
    emissiveIntensity: 0.20, // increased by 10% to make it brighter
    roughness: 0.22,
    metalness: 0,
    clearcoat: 0.95,
    clearcoatRoughness: 0.08,
    envMapIntensity: 0.65
  });
}

// White glassy sides for the front card body — pure white, brighter
function getCardShellMaterial() {
  if (!materials._shell) {
    materials._shell = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.18,
      metalness: 0,
      clearcoat: 0.95,
      clearcoatRoughness: 0.06,
      reflectivity: 0.5,
      envMapIntensity: 0.85
    });
  }
  return materials._shell;
}

function getBadgeShellMaterial() {
  if (!materials._badgeShell) {
    materials._badgeShell = new THREE.MeshPhysicalMaterial({
      color: 0xeef0f4,
      roughness: 0.3,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
      envMapIntensity: 0.5
    });
  }
  return materials._badgeShell;
}

// Halo texture — radial gradient in dept color, soft falloff
const haloTextures = {};
function getHaloTexture(colorHex) {
  if (haloTextures[colorHex]) return haloTextures[colorHex];
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2, cy = size / 2;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
  // build soft luminous halo from dept color
  const c = new THREE.Color(colorHex);
  const cs = `${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}`;
  grad.addColorStop(0.00, `rgba(${cs}, 0.80)`);
  grad.addColorStop(0.18, `rgba(${cs}, 0.50)`);
  grad.addColorStop(0.45, `rgba(${cs}, 0.18)`);
  grad.addColorStop(1.00, `rgba(${cs}, 0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  haloTextures[colorHex] = tex;
  return tex;
}

// card height varies (CEO is taller)
const CARD_H_AGENT = 100;
let cardGeos = {};
function getCardGeometry(w, h = CARD_H) {
  const key = `${w}x${h}`;
  if (!cardGeos[key]) {
    cardGeos[key] = new RoundedBoxGeometry(w, h, 16, 4, 14);
  }
  return cardGeos[key];
}

const textureLoader = new THREE.TextureLoader();
const texCeo = textureLoader.load('/assets/ceo.jpeg');
texCeo.colorSpace = THREE.SRGBColorSpace;
const texPerson = textureLoader.load('/assets/person.jpeg');
texPerson.colorSpace = THREE.SRGBColorSpace;
const texPerson2 = textureLoader.load('/assets/person2.jpeg');
texPerson2.colorSpace = THREE.SRGBColorSpace;
const texPerson3 = textureLoader.load('/assets/person3.jpeg');
texPerson3.colorSpace = THREE.SRGBColorSpace;
const texWoman = textureLoader.load('/assets/woman.jpeg');
texWoman.colorSpace = THREE.SRGBColorSpace;
const texWoman2 = textureLoader.load('/assets/woman2.jpeg');
texWoman2.colorSpace = THREE.SRGBColorSpace;

const maleTexs = [texPerson, texPerson2, texPerson3];
const femaleTexs = [texWoman, texWoman2];

// portrait avatar — taller than wide
const BADGE_W = 66;
const BADGE_H = 82;
let badgeGeo;
function getBadgeGeometry() {
  if (!badgeGeo) {
    badgeGeo = new RoundedBoxGeometry(BADGE_W, BADGE_H, 6, 4, 10);
  }
  return badgeGeo;
}

function createCardTexture(node, w, h, color, isAgent, opts) {
  const { showHeadshots, showTitles, showLocations } = opts;
  const scale = 4;
  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d');

  // Bright white front, very subtle sheen at the bottom edge only
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.85, '#ffffff');
  grad.addColorStop(1, '#fbfaf6');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textBaseline = 'alphabetic';

  if (isAgent) {
    // ---- agent: small dot + name only ----
    const dotR = 5 * scale;
    const dotX = 16 * scale;
    const dotY = h / 2 * scale;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1a1a1f';
    ctx.font = `600 ${15 * scale}px Inter, sans-serif`;
    ctx.fillText(node.name, 30 * scale, (h / 2 + 5) * scale);

    if (node.kind && showTitles) {
      ctx.fillStyle = '#8a8a98';
      ctx.font = `500 ${10 * scale}px Inter, sans-serif`;
      ctx.fillText(node.kind.toUpperCase(), 30 * scale, (h / 2 + 22) * scale);
    }
  } else {
    // ---- person: portrait avatar on left, then text block ----
    // Reserve left column for the 3D portrait badge
    const textX = showHeadshots ? (BADGE_W + 30) * scale : 24 * scale; // Adjust text start if no headshot
    let baseline = showTitles || showLocations ? h * 0.42 : h * 0.55; // Re-center if less lines

    // tiny dept color chip above name
    if (node.dept) {
      const chipW = 8 * scale;
      const chipH = 8 * scale;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(textX + chipW / 2, (baseline - 22) * scale, chipW / 2, 0, Math.PI * 2);
      ctx.fill();

      const dept = (DEPARTMENTS[node.dept]?.label ?? '').toUpperCase();
      ctx.fillStyle = '#7a6c92';
      ctx.font = `600 ${10 * scale}px Inter, sans-serif`;
      ctx.fillText(dept, textX + 14 * scale, (baseline - 18) * scale);
    }

    // Name
    ctx.fillStyle = '#1a1a1f';
    ctx.font = `600 ${17 * scale}px Inter, sans-serif`;
    ctx.fillText(node.name, textX, baseline * scale);

    // Title
    if (showTitles) {
      ctx.fillStyle = '#5a5a68';
      ctx.font = `500 ${12 * scale}px Inter, sans-serif`;
      ctx.fillText(node.title || '', textX, (baseline + 18) * scale);
    }

    // Location with mini pin glyph
    if (showLocations && node.location) {
      const ly = showTitles ? (baseline + 38) * scale : (baseline + 22) * scale;
      ctx.strokeStyle = '#a4a4b0';
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.arc(textX + 4 * scale, ly - 6 * scale, 3 * scale, 0, Math.PI * 2);
      ctx.moveTo(textX + 4 * scale, ly - 3 * scale);
      ctx.lineTo(textX + 4 * scale, ly + 1 * scale);
      ctx.stroke();

      ctx.fillStyle = '#9b9ba6';
      ctx.font = `400 ${10.5 * scale}px Inter, sans-serif`;
      ctx.fillText(node.location, textX + 14 * scale, ly + 1 * scale);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createNodeGroup(node, isCEO, isAgent = false, index = 0, opts = {}) {
  const { showHeadshots = true, showTitles = true, showLocations = true } = opts;
  const group = new THREE.Group();

  // VPs 250x112, CEO 290x122, agents 220x100 (back to original size)
  let w, h;
  if (isAgent) { w = 231; h = 100; }
  else if (isCEO) { w = 305; h = 122; }
  else { w = 263; h = CARD_H; }

  const color = node.dept ? DEPARTMENTS[node.dept].tint : '#7da3d6';

  const glassMat = getGlassMaterial(color);
  const shellMat = getCardShellMaterial();

  const frontTexture = createCardTexture(node, w, h, color, isAgent, opts);
  const frontMat = getCardFrontMaterial(frontTexture);

  const matArray = [shellMat, shellMat, shellMat, shellMat, frontMat, shellMat];

  // Halo glow — opacity reduced 20% per request
  const haloSize = w * 2.2;
  const haloMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(haloSize, haloSize),
    new THREE.MeshBasicMaterial({
      map: getHaloTexture(color),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: isAgent ? 0.44 : 0.68 // was 0.55 / 0.85 → ×0.8
    })
  );
  haloMesh.position.set(0, -8, -40);
  haloMesh.renderOrder = -1;
  group.add(haloMesh);
  group.userData.halo = haloMesh;

  // Base card (colored glassy lip)
  const baseMesh = new THREE.Mesh(getCardGeometry(w, h), glassMat);
  baseMesh.position.set(0, -6, -8);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Front card with canvas texture on +Z face
  const cardMesh = new THREE.Mesh(getCardGeometry(w, h), matArray);
  cardMesh.position.set(0, 0, 0);
  cardMesh.castShadow = true;
  cardMesh.receiveShadow = true;
  group.add(cardMesh);

  cardMesh.userData = { isCard: true, node, group, w, h, isAgent };

  if (!isAgent && showHeadshots) {
    const badgeMat = getBadgeShellMaterial();
    const isWoman = index % 2 !== 0;
    const texList = isWoman ? femaleTexs : maleTexs;
    const tex = isCEO ? texCeo : texList[Math.floor(index / 2) % texList.length];

    const faceMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: tex,
      roughness: 0.42,
      clearcoat: 0.75,
      clearcoatRoughness: 0.16,
      envMapIntensity: 0.55
    });

    const badgeMatArray = [badgeMat, badgeMat, badgeMat, badgeMat, faceMat, badgeMat];
    const badgeMesh = new THREE.Mesh(getBadgeGeometry(), badgeMatArray);
    badgeMesh.castShadow = true;
    badgeMesh.receiveShadow = true;
    // place portrait badge flush-left with a 14u inset
    badgeMesh.position.set(-w / 2 + 14 + BADGE_W / 2, 0, 9);
    group.add(badgeMesh);
  }

  // ---- entrance + idle motion bookkeeping ----
  group.userData.targetRotX = 0;
  group.userData.targetRotY = 0;
  group.userData.targetY = null;
  group.userData.defaultY = 0;
  group.userData.w = w;
  group.userData.h = h;
  group.userData.frontMat = frontMat;

  // start tiny so we can pop in
  group.scale.setScalar(0.0001);
  group.userData.entered = false;
  group.userData.entranceDelay = 0; // set by caller
  group.userData.idlePhase = Math.random() * Math.PI * 2; // random phase for organic float

  return { group, cardMesh };
}
