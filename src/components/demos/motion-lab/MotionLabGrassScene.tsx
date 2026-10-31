"use client";
/* eslint-disable react-hooks/immutability -- three.js buffers and uniforms are mutated per frame inside useFrame */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { MutableRefObject, RefObject } from "react";
import * as THREE from "three";
import type { MotionLabPointer } from "@/lib/motion-lab/pointer";

const TRAIL = 24;
const FIELD = 26;
const GRID = 80;
const BEND_LIFE = 3.4;
const BEND_HOLD = 0.45;
const POND = { x: 4.6, z: -5.4, rx: 2.7, rz: 1.5 };
const HOUSE = { x: -7.2, z: -8.2, turn: 0.5, scale: 1.35 };

function homeToWorld(lx: number, lz: number) {
  const x = lx * HOUSE.scale;
  const z = lz * HOUSE.scale;
  const c = Math.cos(HOUSE.turn);
  const s = Math.sin(HOUSE.turn);
  return { x: HOUSE.x + x * c + z * s, z: HOUSE.z - x * s + z * c };
}

const YARD = homeToWorld(0, 2.6);
const BARN = homeToWorld(-2.3, -0.7);
const BARN_FRONT = homeToWorld(-2.15, 0.25);
const APRON = { x: YARD.x + 0.55, z: YARD.z + 1.75 };
const PATH = [
  { x: YARD.x, z: YARD.z },
  { x: -3.4, z: -4.4 },
  { x: -1, z: -4.5 },
  { x: 1.6, z: -5.2 },
];

function smooth(edge0: number, edge1: number, v: number) {
  const t = Math.min(1, Math.max(0, (v - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function pondDistance(x: number, z: number) {
  return Math.hypot((x - POND.x) / POND.rx, (z - POND.z) / POND.rz);
}

function pathNearest(x: number, z: number) {
  let best = Infinity;
  let nearZ = 0;
  for (let i = 0; i < PATH.length - 1; i++) {
    const a = PATH[i];
    const b = PATH[i + 1];
    const abx = b.x - a.x;
    const abz = b.z - a.z;
    const t = Math.min(1, Math.max(0, ((x - a.x) * abx + (z - a.z) * abz) / (abx * abx + abz * abz)));
    const pz = a.z + abz * t;
    const d = Math.hypot(x - (a.x + abx * t), z - pz);
    if (d < best) {
      best = d;
      nearZ = pz;
    }
  }
  return { distance: best, nearZ };
}

function pathDistance(x: number, z: number) {
  return pathNearest(x, z).distance;
}

/** Shortens grass on the camera side of the path so the path stays visible. */
function pathFrontScale(x: number, z: number) {
  const { distance, nearZ } = pathNearest(x, z);
  if (z <= nearZ) return 1;
  return Math.min(1, 0.2 + 0.17 * Math.max(0, distance - 0.5));
}

/** Negative inside the swept yard and path, positive in the grass. */
function clearing(x: number, z: number) {
  return Math.min(
    Math.hypot(x - HOUSE.x, z - HOUSE.z) - 2.3,
    Math.hypot(x - YARD.x, z - YARD.z) - 2.2,
    Math.hypot(x - APRON.x, z - APRON.z) - 1.6,
    Math.hypot(x - BARN.x, z - BARN.z) - 1.1,
    Math.hypot(x - BARN_FRONT.x, z - BARN_FRONT.z) - 1.0,
    pathDistance(x, z) - 0.55,
  );
}

function groundHeight(x: number, z: number) {
  const pd = pondDistance(x, z);
  const roll = (Math.sin(x * 0.33 + z * 0.21) * 0.16 + Math.cos(z * 0.47 - x * 0.17) * 0.12) * smooth(1.05, 1.9, pd);
  const basin = pd < 1.1 ? -0.32 * (1 - (pd / 1.1) ** 2) : 0;
  const near = smooth(-10, -34, z) * (2.2 + Math.sin(x * 0.16 + 0.6) * 1.4 + Math.sin(x * 0.43 + 2.1) * 0.6);
  const far = smooth(-38, -58, z) * (3 + Math.sin(x * 0.09) * 2.2 + Math.sin(x * 0.27 + 1) * 0.9);
  return roll + basin + near + far;
}

const BLADE_VERT = `
uniform sampler2D uBend;
uniform vec2 uCamera;
uniform float uTime;
varying vec2 vUv;
varying float vWake;

void main() {
  vUv = uv;
  float h = uv.y;
  float curve = pow(h, 1.7);

  vec4 world = instanceMatrix * vec4(position, 1.0);
  vec3 rootW = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vec2 root = rootW.xz;

  vec2 breeze = vec2(
    sin(uTime * 1.15 + root.x * 0.42),
    cos(uTime * 0.9 + root.y * 0.38)
  ) * 0.14;

  vec2 mapUv = root / ${FIELD}.0 + 0.5;
  vec4 stamp = texture2D(uBend, mapUv);
  float hash = fract(sin(dot(root, vec2(127.1, 311.7))) * 43758.5453);
  float amt = stamp.b * mix(0.8, 1.0, hash);
  vec2 wake = (stamp.rg * 2.0 - 1.0) * amt;

  float camDist = length(uCamera - root);
  float reach = mix(1.0, 1.8, smoothstep(6.0, 24.0, camDist));
  vec2 off = (breeze + wake * reach) * curve;
  float height = max(world.y - rootW.y, 0.0);
  float len = length(off);
  float maxOff = height * 0.85;
  if (len > maxOff && len > 0.0) {
    off *= maxOff / len;
    len = maxOff;
  }
  world.xz += off;
  world.y = rootW.y + sqrt(max(height * height - len * len, 0.0));
  vWake = amt;

  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const BLADE_FRAG = `
uniform vec3 uTip;
uniform vec3 uBase;
uniform vec3 uHighlight;
uniform float uNight;
varying vec2 vUv;
varying float vWake;

void main() {
  vec3 col = mix(uBase, uTip, pow(vUv.y, 0.75));
  col = mix(col, uHighlight, smoothstep(0.72, 1.0, vUv.y) * 0.45);
  col = mix(col, vec3(0.93, 0.98, 0.72), vWake * 0.18);
  float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
  col *= 0.82 + edge * 0.18;
  vec3 moonlit = col * vec3(0.26, 0.36, 0.5) + vec3(0.05, 0.08, 0.14) * smoothstep(0.6, 1.0, vUv.y);
  col = mix(col, moonlit, uNight);
  gl_FragColor = vec4(col, 1.0);
}
`;

const RIBBON_VERT = `
attribute float aAmt;
varying vec2 vUv;
varying float vAmt;
void main() {
  vUv = uv;
  vAmt = aAmt;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
`;

const RIBBON_FRAG = `
uniform float uOpacity;
varying vec2 vUv;
varying float vAmt;
void main() {
  float across = pow(1.0 - abs(vUv.x * 2.0 - 1.0), 1.7);
  float along = smoothstep(0.0, 0.12, vUv.y);
  float alpha = across * along * vAmt * uOpacity;
  if (alpha < 0.02) discard;
  gl_FragColor = vec4(0.98, 0.97, 0.93, alpha);
}
`;

type Ribbon = {
  geo: THREE.BufferGeometry;
  mat: THREE.ShaderMaterial;
  positions: Float32Array;
  uvs: Float32Array;
  amts: Float32Array;
};

function createRibbon(opacity: number): Ribbon {
  const positions = new Float32Array(TRAIL * 2 * 3);
  const uvs = new Float32Array(TRAIL * 2 * 2);
  const amts = new Float32Array(TRAIL * 2);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geo.setAttribute("aAmt", new THREE.BufferAttribute(amts, 1));
  const indices: number[] = [];
  for (let i = 0; i < TRAIL - 1; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  geo.setIndex(indices);
  geo.setDrawRange(0, 0);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: opacity } },
    vertexShader: RIBBON_VERT,
    fragmentShader: RIBBON_FRAG,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  return { geo, mat, positions, uvs, amts };
}

const SKY_FN = `
const vec3 SUN_DIR = vec3(0.6231, 0.3417, -0.7035);
const vec3 MOON_DIR = vec3(-0.3308, 0.2005, -0.9221);

float skyHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float skyNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(skyHash(i), skyHash(i + vec2(1.0, 0.0)), f.x),
    mix(skyHash(i + vec2(0.0, 1.0)), skyHash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float skyFbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * skyNoise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

float starHash(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

vec3 skyColor(vec3 dir, float time, float night) {
  float h = clamp(dir.y * 0.55 + 0.15, 0.0, 1.0);
  float grad = smoothstep(0.0, 0.62, h);
  float sunDot = max(dot(dir, SUN_DIR), 0.0);
  float moonDot = max(dot(dir, MOON_DIR), 0.0);

  vec3 day = mix(vec3(0.98, 0.68, 0.38), vec3(0.34, 0.62, 0.92), grad);
  day += vec3(1.0, 0.62, 0.28) * pow(sunDot, 6.0) * 0.4;

  vec3 dark = mix(vec3(0.15, 0.13, 0.3), vec3(0.02, 0.035, 0.1), grad);
  dark += vec3(0.45, 0.55, 0.9) * pow(moonDot, 10.0) * 0.22;

  if (dir.y > 0.0 && night > 0.001) {
    vec3 q = dir * 260.0;
    vec3 cell = floor(q);
    float rnd = starHash(cell);
    float twinkle = 0.55 + 0.45 * sin(time * (1.5 + rnd * 3.0) + rnd * 80.0);
    float star = step(0.992, rnd) * smoothstep(0.42, 0.0, length(fract(q) - 0.5));
    dark += vec3(0.9, 0.93, 1.0) * star * twinkle * smoothstep(0.03, 0.25, dir.y);
  }

  vec3 col = mix(day, dark, night);

  if (dir.y > 0.0) {
    vec2 uv = dir.xz / (dir.y + 0.14) * 0.8 + vec2(time * 0.012, time * 0.004);
    float n = skyFbm(uv * 1.4);
    float cover = smoothstep(0.48, 0.74, n) * smoothstep(0.0, 0.2, dir.y);
    float depth = skyFbm(uv * 1.4 + vec2(0.18, 0.12));
    float relief = smoothstep(0.35, 0.75, n - depth + 0.5);
    vec3 dayLit = vec3(1.0, 0.9, 0.78) + vec3(0.35, 0.22, 0.08) * pow(sunDot, 4.0);
    vec3 dayCloud = mix(vec3(0.86, 0.66, 0.62), dayLit, relief);
    vec3 nightLit = vec3(0.3, 0.34, 0.5) + vec3(0.25, 0.28, 0.35) * pow(moonDot, 4.0);
    vec3 nightCloud = mix(vec3(0.08, 0.09, 0.17), nightLit, relief);
    col = mix(col, mix(dayCloud, nightCloud, night), cover * mix(0.88, 0.75, night));
  }

  col += vec3(1.0, 0.95, 0.75) * pow(sunDot, 360.0) * (1.0 - night);
  col += vec3(0.95, 0.96, 1.0) * smoothstep(0.99972, 0.99982, moonDot) * night;
  col += vec3(0.6, 0.7, 1.0) * pow(moonDot, 120.0) * 0.35 * night;
  return col;
}
`;

const WATER_VERT = `
varying vec3 vWorld;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const WATER_FRAG = `
uniform float uTime;
uniform float uNight;
varying vec3 vWorld;
varying vec2 vUv;
${SKY_FN}
void main() {
  vec2 p = vWorld.xz;
  vec2 slope = vec2(
    cos(p.x * 3.1 + uTime * 1.3) * sin(p.y * 4.2 - uTime * 1.1),
    sin(p.x * 3.1 + uTime * 1.3) * cos(p.y * 4.2 - uTime * 1.1)
  ) * 0.05;
  vec3 normal = normalize(vec3(slope.x, 1.0, slope.y));
  vec3 view = normalize(vWorld - cameraPosition);
  vec3 refl = reflect(view, normal);
  refl.y = abs(refl.y);
  float fresnel = 0.35 + 0.65 * pow(1.0 - max(dot(-view, normal), 0.0), 3.0);
  vec3 deep = mix(vec3(0.1, 0.25, 0.28), vec3(0.015, 0.03, 0.06), uNight);
  vec3 col = mix(deep, skyColor(refl, uTime, uNight) * 0.92, fresnel);
  float edge = clamp(length(vUv - 0.5) * 2.0, 0.0, 1.0);
  col = mix(col, mix(vec3(0.2, 0.28, 0.16), vec3(0.03, 0.05, 0.05), uNight), smoothstep(0.84, 1.0, edge) * 0.7);
  gl_FragColor = vec4(col, 1.0);
}
`;

const SKY_VERT = `
varying vec3 vWorld;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const SKY_FRAG = `
uniform float uTime;
uniform float uNight;
varying vec3 vWorld;
${SKY_FN}
void main() {
  gl_FragColor = vec4(skyColor(normalize(vWorld), uTime, uNight), 1.0);
}
`;

const FIREFLY_VERT = `
attribute float aSeed;
uniform float uTime;
uniform float uNight;
uniform float uScale;
varying float vAlpha;
void main() {
  vec3 p = position;
  p.x += sin(uTime * 0.4 + aSeed * 6.0) * 0.6;
  p.z += cos(uTime * 0.33 + aSeed * 4.0) * 0.6;
  p.y += sin(uTime * 0.9 + aSeed * 9.0) * 0.15;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uScale / -mv.z;
  float pulse = 0.5 + 0.5 * sin(uTime * (1.4 + aSeed) + aSeed * 20.0);
  vAlpha = uNight * smoothstep(0.15, 0.85, pulse);
}
`;

const FIREFLY_FRAG = `
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(1.0, 0.92, 0.5, a * a * vAlpha);
}
`;

const FIREFLIES = 70;

function seeded(n: number) {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

function createBladeGeometry() {
  const segments = 7;
  const height = 0.78;
  const baseWidth = 0.034;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = t * height;
    const width = baseWidth * Math.pow(1 - t, 1.35);
    const half = width * 0.5;
    const bow = t * t * 0.05;
    positions.push(-half, y, bow, half, y, bow);
    uvs.push(0, t, 1, t);
  }

  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }

  const ribbonVerts = positions.length / 3;
  for (let i = 0; i < ribbonVerts; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    positions.push(-z, y, x);
    uvs.push(uvs[i * 2], uvs[i * 2 + 1]);
  }
  const indexCount = indices.length;
  for (let i = 0; i < indexCount; i++) indices.push(indices[i] + ribbonVerts);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function createTerrain() {
  const geo = new THREE.PlaneGeometry(120, 84, 300, 210);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, -20);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const field = new THREE.Color("#1d4a24");
  const slope = new THREE.Color("#3f7a3f");
  const crest = new THREE.Color("#8aa95a");
  const mud = new THREE.Color("#4a4026");
  const dirt = new THREE.Color("#8d7650");
  const col = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = groundHeight(x, z);
    pos.setY(i, y - 0.02);
    col.copy(field).lerp(slope, smooth(0.3, 2.2, y));
    col.lerp(crest, smooth(2.6, 5.5, y) * 0.7);
    col.lerp(mud, (1 - smooth(1.0, 1.25, pondDistance(x, z))) * 0.8);
    const speckle = Math.sin(x * 7.1 + z * 3.3) * Math.sin(z * 6.7 - x * 2.9) * 0.08;
    col.lerp(dirt, (1 - smooth(-0.35, 0.2, clearing(x, z))) * (0.85 + speckle));
    colors.set([col.r, col.g, col.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

const TREES = [
  [-12.6, -12, 1.1],
  [-2.4, -13, 0.9],
  [-12.5, -15.5, 1.3],
  [-16, -19, 1.5],
  [-10, -21, 1.2],
  [-3.5, -24, 1.4],
  [3.2, -20, 1.1],
  [8.5, -15.8, 1.25],
  [11.5, -18.5, 1.45],
  [15.5, -15, 1.1],
  [20.5, -24.5, 1.6],
  [24, -17, 1.3],
  [-22, -16, 1.4],
] as const;

const CANOPY: { p: [number, number, number]; r: number; c: string }[] = [
  { p: [0, 1.38, 0], r: 0.6, c: "#2f5f2d" },
  { p: [0.38, 1.25, 0.12], r: 0.42, c: "#356a31" },
  { p: [-0.36, 1.3, -0.08], r: 0.45, c: "#2a5529" },
  { p: [0.12, 1.78, -0.05], r: 0.44, c: "#41773a" },
  { p: [-0.18, 1.62, 0.22], r: 0.34, c: "#4a8240" },
];

function Tree({ x, z, size }: { x: number; z: number; size: number }) {
  const turn = (x * 12.9898 + z * 78.233) % (Math.PI * 2);
  return (
    <group position={[x, groundHeight(x, z) - 0.05, z]} scale={size} rotation={[0, turn, 0]}>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.06, 0.11, 1.1, 8]} />
        <meshStandardMaterial color="#5b3d2a" roughness={1} />
      </mesh>
      {CANOPY.map((blob) => (
        <mesh key={blob.c} position={blob.p} scale={[1, 0.86, 1]}>
          <icosahedronGeometry args={[blob.r, 3]} />
          <meshStandardMaterial color={blob.c} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function Pond({ material }: { material: THREE.ShaderMaterial }) {
  return (
    <mesh position={[POND.x, 0.02, POND.z]} rotation={[-Math.PI / 2, 0, 0]} scale={[POND.rx, POND.rz, 1]}>
      <circleGeometry args={[1.04, 48]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function Landscape({
  water,
  porchLight,
}: {
  water: THREE.ShaderMaterial;
  porchLight: RefObject<THREE.PointLight | null>;
}) {
  const terrain = useMemo(() => createTerrain(), []);
  const houseY = groundHeight(HOUSE.x, HOUSE.z);

  return (
    <group>
      <mesh geometry={terrain}>
        <meshStandardMaterial vertexColors roughness={1} metalness={0} />
      </mesh>
      <Pond material={water} />
      {TREES.map(([x, z, size]) => (
        <Tree key={`${x}-${z}`} x={x} z={z} size={size} />
      ))}
      <group position={[HOUSE.x, houseY, HOUSE.z]} rotation={[0, HOUSE.turn, 0]} scale={HOUSE.scale}>
        <Homestead porchLight={porchLight} />
      </group>
      {CHICKENS.map((chicken) => (
        <Chicken key={chicken.seed} {...chicken} />
      ))}
    </group>
  );
}

const WOOD = "#8f4f30";
const WOOD_DARK = "#4a2616";
const ROOF = "#7a3a2a";
const TRIM = "#e8d6b0";
const SHUTTER = "#d9c7a0";
const CURTAIN = "#e2b23a";
const ROOF_PITCH = Math.atan2(0.78, 0.92);
const ROOF_WIDTH = 1.25;
const ROOF_APEX = 2.51;

function RoofPrism({
  half,
  height,
  length,
  color,
  position,
  map,
}: {
  half: number;
  height: number;
  length: number;
  color: string;
  position: [number, number, number];
  map?: THREE.Texture;
}) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-half, 0);
    shape.lineTo(half, 0);
    shape.lineTo(0, height);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false });
    geo.translate(0, 0, -length / 2);
    geo.rotateY(Math.PI / 2);
    geo.computeVertexNormals();
    return geo;
  }, [half, height, length]);

  return (
    <mesh geometry={geometry} position={position}>
      <meshStandardMaterial color={color} map={map ?? null} roughness={0.85} />
    </mesh>
  );
}

function Block({
  size,
  position,
  color,
  rotation,
  glow,
  map,
  cutout,
}: {
  size: [number, number, number];
  position: [number, number, number];
  color: string;
  rotation?: [number, number, number];
  glow?: boolean;
  map?: THREE.Texture;
  cutout?: boolean;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        map={map ?? null}
        alphaTest={cutout ? 0.5 : 0}
        side={cutout ? THREE.DoubleSide : THREE.FrontSide}
        roughness={0.9}
        emissive={glow ? "#ffb04a" : "#000000"}
        emissiveIntensity={glow ? 1.4 : 0}
      />
    </mesh>
  );
}

function Post({
  x,
  z,
  height,
  radius = 0.045,
  color = WOOD_DARK,
}: {
  x: number;
  z: number;
  height: number;
  radius?: number;
  color?: string;
}) {
  return (
    <mesh position={[x, height / 2, z]}>
      <cylinderGeometry args={[radius, radius * 1.2, height, 6]} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  );
}

const HOUSE_POSTS = [-1, -0.33, 0.33, 1].flatMap((x) => [-0.6, 0.6].map((z) => ({ x, z })));
const FOOTINGS = [...HOUSE_POSTS, { x: -0.6, z: 1.32 }, { x: 0.6, z: 1.32 }];
const ROOF_Z = (ROOF_WIDTH / 2) * Math.cos(ROOF_PITCH);
const ROOF_Y = ROOF_APEX + 0.03 - (ROOF_WIDTH / 2) * Math.sin(ROOF_PITCH);
const EAVE_Z = ROOF_WIDTH * Math.cos(ROOF_PITCH);
const EAVE_Y = ROOF_APEX + 0.03 - ROOF_WIDTH * Math.sin(ROOF_PITCH);
const STAIR_PITCH = Math.atan2(0.62, 0.47);

type HouseTextures = {
  walls: THREE.Texture;
  roof: THREE.Texture;
  shutter: THREE.Texture;
  floor: THREE.Texture;
  lattice: THREE.Texture;
  scallop: THREE.Texture;
};

function HouseWindow({
  textures,
  position,
  rotation,
}: {
  textures: HouseTextures;
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <Block size={[0.38, 0.44, 0.01]} position={[0, 0, 0.002]} color={WOOD_DARK} />
      <Block size={[0.3, 0.36, 0.01]} position={[0, 0, 0.006]} color="#ffd28a" glow />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Block size={[0.08, 0.36, 0.01]} position={[side * 0.11, 0, 0.012]} color={CURTAIN} />
          <Block size={[0.13, 0.38, 0.015]} position={[side * 0.26, 0, 0.01]} color={SHUTTER} map={textures.shutter} />
        </group>
      ))}
      <Block size={[0.42, 0.035, 0.05]} position={[0, -0.23, 0.02]} color={TRIM} />
      <Block size={[0.34, 0.12, 0.006]} position={[0, -0.33, 0.003]} color="#2a1a10" />
      <Block size={[0.34, 0.12, 0.012]} position={[0, -0.33, 0.01]} color={TRIM} map={textures.lattice} cutout />
    </group>
  );
}

function Football({ position }: { position: [number, number, number] }) {
  const geometry = useMemo(() => createFootballGeometry(0.11), []);
  return (
    <mesh geometry={geometry} position={position} rotation={[0.4, 0.8, 0.2]}>
      <meshStandardMaterial vertexColors roughness={0.45} />
    </mesh>
  );
}

function FlowerPot({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.065, 0]}>
        <cylinderGeometry args={[0.075, 0.055, 0.13, 12]} />
        <meshStandardMaterial color="#b5553a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.2, 0]} scale={[1, 0.85, 1]}>
        <icosahedronGeometry args={[0.1, 2]} />
        <meshStandardMaterial color="#3f7a35" roughness={0.95} />
      </mesh>
    </group>
  );
}

function Homestead({ porchLight }: { porchLight: RefObject<THREE.PointLight | null> }) {
  const textures = useMemo<HouseTextures>(
    () => ({
      walls: createPlankTexture(14),
      roof: createPlankTexture(28),
      shutter: createPlankTexture(4),
      floor: createPlankTexture(8),
      lattice: createLatticeTexture(),
      scallop: createScallopTexture(),
    }),
    [],
  );

  return (
    <group>
      {HOUSE_POSTS.map((p) => (
        <Post key={`${p.x}-${p.z}`} x={p.x} z={p.z} height={0.8} />
      ))}
      {FOOTINGS.map((p) => (
        <Block key={`f-${p.x}-${p.z}`} size={[0.13, 0.08, 0.13]} position={[p.x, 0.04, p.z]} color="#b8b2a6" />
      ))}
      <Block size={[2.2, 0.1, 1.4]} position={[0, 0.82, 0]} color={WOOD_DARK} map={textures.floor} />

      <Block size={[2, 0.86, 1.2]} position={[0, 1.3, 0]} color={WOOD} map={textures.walls} />
      <Block size={[2.04, 0.05, 1.24]} position={[0, 0.9, 0]} color={WOOD_DARK} />
      <Block size={[2.04, 0.05, 1.24]} position={[0, 1.71, 0]} color={WOOD_DARK} />
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <Block key={`${sx}-${sz}`} size={[0.06, 0.86, 0.06]} position={[sx * 1, 1.3, sz * 0.6]} color={WOOD_DARK} />
        )),
      )}
      {[-0.62, 0.62].map((x) => (
        <HouseWindow key={x} textures={textures} position={[x, 1.34, 0.6]} />
      ))}
      <HouseWindow textures={textures} position={[1, 1.34, 0]} rotation={[0, Math.PI / 2, 0]} />
      <HouseWindow textures={textures} position={[-1, 1.34, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <Block size={[0.4, 0.68, 0.01]} position={[0, 1.22, 0.602]} color={WOOD_DARK} />
      <Block size={[0.32, 0.6, 0.008]} position={[0, 1.2, 0.606]} color="#ffd28a" glow />
      <Block size={[0.17, 0.6, 0.015]} position={[-0.075, 1.2, 0.61]} color={WOOD} map={textures.shutter} />

      <RoofPrism half={0.92} height={0.78} length={2.02} color={WOOD} map={textures.walls} position={[0, 1.73, 0]} />
      {[-1, 1].map((sx) => (
        <group key={`gable-${sx}`}>
          <Block size={[0.006, 0.28, 0.56]} position={[sx * 1.006, 2.02, 0]} color="#2a1a10" />
          <Block size={[0.012, 0.28, 0.56]} position={[sx * 1.012, 2.02, 0]} color={TRIM} map={textures.lattice} cutout />
        </group>
      ))}
      {[-1, 1].map((sz) => (
        <group key={`roof-${sz}`}>
          <Block
            size={[2.8, 0.04, ROOF_WIDTH]}
            position={[0, ROOF_Y, sz * ROOF_Z]}
            rotation={[sz * ROOF_PITCH, 0, 0]}
            color={ROOF}
            map={textures.roof}
          />
          <Block
            size={[2.8, 0.1, 0.012]}
            position={[0, EAVE_Y - 0.07, sz * (EAVE_Z + 0.006)]}
            color={TRIM}
            map={textures.scallop}
            cutout
          />
          {[-1, 1].map((sx) => (
            <Block
              key={sx}
              size={[0.03, 0.09, ROOF_WIDTH]}
              position={[sx * 1.4, ROOF_Y - 0.03, sz * ROOF_Z]}
              rotation={[sz * ROOF_PITCH, 0, 0]}
              color={TRIM}
            />
          ))}
        </group>
      ))}
      <Block size={[2.86, 0.06, 0.1]} position={[0, ROOF_APEX + 0.05, 0]} color={WOOD_DARK} />
      {[-1.4, 1.4].map((x) => (
        <group key={x} position={[x, ROOF_APEX + 0.12, 0]}>
          <Block size={[0.04, 0.42, 0.04]} position={[0, 0, 0.07]} rotation={[0.6, 0, 0]} color={WOOD_DARK} />
          <Block size={[0.04, 0.42, 0.04]} position={[0, 0, -0.07]} rotation={[-0.6, 0, 0]} color={WOOD_DARK} />
        </group>
      ))}

      {[-0.6, 0.6].map((x) => (
        <Post key={x} x={x} z={1.32} height={1.58} radius={0.04} />
      ))}
      <Block size={[1.3, 0.06, 0.75]} position={[0, 0.62, 0.98]} color={WOOD_DARK} map={textures.floor} />
      <Block
        size={[1.5, 0.04, 0.62]}
        position={[0, 1.66, 1.225]}
        rotation={[0.349, 0, 0]}
        color={ROOF}
        map={textures.roof}
      />
      <Block size={[1.5, 0.08, 0.012]} position={[0, 1.52, 1.53]} color={TRIM} map={textures.scallop} cutout />
      {[-0.41, 0.41].map((x) => (
        <group key={x}>
          <Block size={[0.38, 0.04, 0.04]} position={[x, 0.93, 1.33]} color={WOOD_DARK} />
          <Block size={[0.38, 0.26, 0.012]} position={[x, 0.78, 1.33]} color={TRIM} map={textures.lattice} cutout />
        </group>
      ))}
      {[-0.63, 0.63].map((x) => (
        <group key={x}>
          <Block size={[0.04, 0.04, 0.75]} position={[x, 0.93, 0.98]} color={WOOD_DARK} />
          <Block size={[0.012, 0.26, 0.72]} position={[x, 0.78, 0.98]} color={TRIM} map={textures.lattice} cutout />
        </group>
      ))}

      {[0.47, 0.32, 0.17].map((y, i) => (
        <Block key={y} size={[0.44, 0.04, 0.16]} position={[0, y, 1.47 + i * 0.14]} color={WOOD} map={textures.floor} />
      ))}
      {[-0.24, 0.24].map((x) => (
        <group key={x}>
          <Block
            size={[0.03, 0.07, 0.78]}
            position={[x, 0.31, 1.615]}
            rotation={[STAIR_PITCH, 0, 0]}
            color={WOOD_DARK}
          />
          <Block
            size={[0.025, 0.025, 0.78]}
            position={[x, 0.63, 1.615]}
            rotation={[STAIR_PITCH, 0, 0]}
            color={WOOD_DARK}
          />
          <Post x={x} z={1.84} height={0.42} radius={0.025} />
        </group>
      ))}
      <FlowerPot x={0.55} z={1.8} />
      <FlowerPot x={-0.55} z={1.85} />
      <Football position={[0.95, 0.11, 2.3]} />
      <pointLight ref={porchLight} position={[0, 1.2, 1.1]} color="#ffb35c" intensity={2.2} distance={5} decay={2} />

      <group position={[-2.3, 0, -0.7]} rotation={[0, 0.25, 0]} scale={1.15}>
        <ChickenCoop />
      </group>
    </group>
  );
}

const PINE = "#c9a46a";
const PINE_DARK = "#8a6a3e";
const PINE_TRIM = "#b08850";
const DOORWAY = "#2a1a10";
const IRON = "#9aa0a6";
const COOP_PITCH = Math.atan2(0.3, 0.35);

function createPlankTexture(boards: number) {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    const step = size / boards;
    for (let i = 0; i < boards; i++) {
      const x = i * step;
      ctx.fillStyle = `rgba(80, 50, 20, ${0.04 + ((i * 37) % 5) * 0.025})`;
      ctx.fillRect(x, 0, step, size);
      ctx.strokeStyle = "rgba(110, 70, 30, 0.16)";
      ctx.lineWidth = 1;
      for (let g = 0; g < 3; g++) {
        const gx = x + step * (0.25 + g * 0.25) + Math.sin(i * 3.1 + g) * 2;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.bezierCurveTo(gx + 2, size * 0.33, gx - 2, size * 0.66, gx + 1, size);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(45, 28, 12, 0.6)";
      ctx.fillRect(x, 0, 2, size);
    }
  }
  return canvasTexture(canvas);
}

function canvasTexture(canvas: HTMLCanvasElement) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

function createLatticeTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    for (let i = -size; i <= size * 2; i += 16) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + size, size);
      ctx.moveTo(i, size);
      ctx.lineTo(i + size, 0);
      ctx.stroke();
    }
    ctx.lineWidth = 8;
    ctx.strokeRect(0, 0, size, size);
  }
  return canvasTexture(canvas);
}

function createScallopTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 256, 14);
    for (let i = 0; i < 16; i++) {
      ctx.beginPath();
      ctx.arc(8 + i * 16, 14, 7, 0, Math.PI);
      ctx.fill();
    }
  }
  return canvasTexture(canvas);
}

/** Black pentagons sit on the 12 icosahedron vertices, like a classic football. */
function createFootballGeometry(radius: number) {
  const geo = new THREE.IcosahedronGeometry(radius, 4);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const phi = (1 + Math.sqrt(5)) / 2;
  const patches = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z).normalize());
  const colors = new Float32Array(pos.count * 3);
  const centre = new THREE.Vector3();
  for (let tri = 0; tri < pos.count; tri += 3) {
    centre.set(0, 0, 0);
    for (let k = 0; k < 3; k++) {
      centre.x += pos.getX(tri + k);
      centre.y += pos.getY(tri + k);
      centre.z += pos.getZ(tri + k);
    }
    centre.normalize();
    let near = -1;
    for (const p of patches) near = Math.max(near, centre.dot(p));
    const shade = near > 0.94 ? 0.06 : 0.95;
    for (let k = 0; k < 3; k++) colors.set([shade, shade, shade], (tri + k) * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geo;
}

function ChickenCoop() {
  const walls = useMemo(() => createPlankTexture(6), []);
  const roof = useMemo(() => createPlankTexture(5), []);
  const slopeX = 0.28 * Math.cos(COOP_PITCH);
  const slopeY = 1.24 - 0.28 * Math.sin(COOP_PITCH);

  return (
    <group>
      {[-0.32, 0.32].flatMap((x) =>
        [-0.26, 0.26].map((z) => <Post key={`${x}-${z}`} x={x} z={z} height={0.44} radius={0.03} color={PINE_DARK} />),
      )}
      <Block size={[0.76, 0.05, 0.62]} position={[0, 0.445, 0]} color={PINE_DARK} />
      <Block size={[0.7, 0.46, 0.56]} position={[0, 0.69, 0]} color={PINE} map={walls} />
      <group rotation={[0, Math.PI / 2, 0]}>
        <RoofPrism half={0.35} height={0.3} length={0.56} color={PINE} map={walls} position={[0, 0.92, 0]} />
      </group>

      {[-1, 1].map((side) => (
        <group key={side}>
          <Block
            size={[0.56, 0.035, 0.74]}
            position={[side * slopeX, slopeY, 0]}
            rotation={[0, 0, -side * COOP_PITCH]}
            color={PINE}
            map={roof}
          />
          <Block
            size={[0.5, 0.05, 0.025]}
            position={[side * slopeX * 0.92, slopeY - 0.03, 0.375]}
            rotation={[0, 0, -side * COOP_PITCH]}
            color={PINE_TRIM}
          />
          <Block size={[0.04, 0.48, 0.025]} position={[side * 0.335, 0.69, 0.285]} color={PINE_TRIM} />
          <Block size={[0.06, 0.22, 0.015]} position={[side * 0.17, 0.64, 0.29]} color={PINE_TRIM} />
          <Block size={[0.045, 0.018, 0.012]} position={[side * 0.2, 0.72, 0.3]} color={IRON} />
          <Block size={[0.045, 0.018, 0.012]} position={[side * 0.2, 0.56, 0.3]} color={IRON} />
        </group>
      ))}
      <Block size={[0.09, 0.045, 0.78]} position={[0, 1.245, 0]} color={PINE_DARK} />

      <Block size={[0.24, 0.28, 0.008]} position={[0, 0.62, 0.284]} color={PINE_TRIM} />
      <Block size={[0.16, 0.15, 0.01]} position={[0, 0.58, 0.29]} color={DOORWAY} />
      <mesh position={[0, 0.655, 0.296]}>
        <circleGeometry args={[0.08, 20, 0, Math.PI]} />
        <meshStandardMaterial color={DOORWAY} />
      </mesh>
      <Block size={[0.38, 0.035, 0.02]} position={[0, 0.8, 0.29]} color={PINE_TRIM} />
      <Block size={[0.012, 0.08, 0.2]} position={[0.352, 0.8, 0]} color={DOORWAY} />

      <Block size={[0.2, 0.025, 0.08]} position={[0, 0.47, 0.32]} color={PINE} />
      <group position={[0, 0.23, 0.62]} rotation={[0.69, 0, 0]}>
        <Block size={[0.16, 0.022, 0.74]} position={[0, 0, 0]} color={PINE} map={walls} />
        {[-0.27, -0.135, 0, 0.135, 0.27].map((z) => (
          <Block key={z} size={[0.16, 0.02, 0.025]} position={[0, 0.02, z]} color={PINE_DARK} />
        ))}
      </group>
    </group>
  );
}

const CHICKENS = [
  { seed: 1, body: "#f4efe4" },
  { seed: 2, body: "#a8643a" },
];

function Chicken({ seed, body }: { seed: number; body: string }) {
  const group = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const walk = useRef({ ready: false, x: 0, z: 0, tx: 0, tz: 0, wait: 0, heading: 0 });

  useFrame((state, delta) => {
    const g = group.current;
    const h = head.current;
    if (!g || !h) return;
    const w = walk.current;
    const t = state.clock.elapsedTime + seed * 3.1;
    const pickTarget = () => {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * 1.5;
      w.tx = YARD.x + Math.cos(a) * r;
      w.tz = YARD.z + Math.sin(a) * r;
    };
    if (!w.ready) {
      pickTarget();
      w.x = w.tx;
      w.z = w.tz;
      w.wait = Math.random() * 2;
      w.ready = true;
    }

    const dx = w.tx - w.x;
    const dz = w.tz - w.z;
    const dist = Math.hypot(dx, dz);
    let bob = 0;
    if (w.wait > 0) {
      w.wait -= delta;
      h.rotation.x = Math.max(0, Math.sin(t * 5)) * 0.9;
      if (w.wait <= 0) pickTarget();
    } else if (dist < 0.05) {
      w.wait = 1.4 + Math.random() * 3;
    } else {
      const step = Math.min(dist, 0.3 * delta);
      w.x += (dx / dist) * step;
      w.z += (dz / dist) * step;
      let turn = Math.atan2(dx, dz) - w.heading;
      turn = Math.atan2(Math.sin(turn), Math.cos(turn));
      w.heading += turn * (1 - Math.exp(-delta * 6));
      bob = Math.abs(Math.sin(t * 13)) * 0.03;
      h.rotation.x = Math.sin(t * 13) * 0.18;
    }

    g.position.set(w.x, groundHeight(w.x, w.z) + bob, w.z);
    g.rotation.y = w.heading;
  });

  return (
    <group ref={group} scale={1.4}>
      <mesh position={[0, 0.17, 0]} scale={[0.13, 0.12, 0.17]}>
        <sphereGeometry args={[1, 14, 10]} />
        <meshStandardMaterial color={body} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.25, -0.15]} rotation={[-0.7, 0, 0]}>
        <coneGeometry args={[0.07, 0.16, 6]} />
        <meshStandardMaterial color={body} roughness={0.9} />
      </mesh>
      {[-0.04, 0.04].map((x) => (
        <mesh key={x} position={[x, 0.05, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.1, 4]} />
          <meshStandardMaterial color="#d99a2b" />
        </mesh>
      ))}
      <group ref={head} position={[0, 0.25, 0.12]}>
        <mesh position={[0, 0.05, 0.03]}>
          <sphereGeometry args={[0.065, 12, 10]} />
          <meshStandardMaterial color={body} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.12, 0.03]}>
          <boxGeometry args={[0.02, 0.05, 0.06]} />
          <meshStandardMaterial color="#c8322a" />
        </mesh>
        <mesh position={[0, 0.04, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.02, 0.05, 5]} />
          <meshStandardMaterial color="#e0a02c" />
        </mesh>
      </group>
    </group>
  );
}

const BUTTERFLY_SPOTS = [
  { x: -2.6, z: -1.2 },
  { x: 3.4, z: 0.6 },
  { x: 7.8, z: -2.6 },
  { x: -6.8, z: 1.4 },
  { x: 0.6, z: -8.4 },
  { x: 9.6, z: -8.6 },
  { x: -0.8, z: -4.6 },
  { x: 5.6, z: -9.6 },
  { x: -9.6, z: -2.8 },
];

/** Rings along a capsule (v runs head to tail), with an optional pale stripe down each side. */
function createBandTexture(base: string, band: string, rings: number, stripe?: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 64, 128);
    if (stripe) {
      ctx.fillStyle = stripe;
      ctx.fillRect(12, 0, 6, 128);
      ctx.fillRect(44, 0, 6, 128);
    }
    ctx.fillStyle = band;
    for (let i = 1; i < rings; i++) ctx.fillRect(0, (i / rings) * 128 - 2, 64, 4);
  }
  return canvasTexture(canvas);
}

/** Herringbone marks on a grasshopper's jumping thigh. */
function createFemurTexture(base: string, mark: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 32, 64);
    ctx.strokeStyle = mark;
    ctx.lineWidth = 2.5;
    for (let y = 4; y < 64; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(16, y + 5);
      ctx.lineTo(32, y);
      ctx.stroke();
    }
  }
  return canvasTexture(canvas);
}

function createDragonflyWingTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "rgba(225, 240, 255, 0.32)";
    ctx.fillRect(0, 0, 128, 32);
    ctx.strokeStyle = "rgba(40, 50, 60, 0.55)";
    ctx.lineWidth = 1;
    for (let x = 8; x < 128; x += 9) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 3, 32);
      ctx.stroke();
    }
    for (const y of [9, 17, 25]) {
      ctx.beginPath();
      ctx.moveTo(0, 16);
      ctx.lineTo(128, y);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(30, 30, 35, 0.95)";
    ctx.fillRect(0, 0, 128, 3);
    ctx.fillRect(104, 2, 10, 6);
  }
  return canvasTexture(canvas);
}

function createDragonflyWingGeometry(length: number, width: number) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(length * 0.3, width * 0.65, length * 0.9, width * 0.6, length, width * 0.15);
  shape.bezierCurveTo(length, -width * 0.3, length * 0.5, -width * 0.5, 0, -width * 0.15);
  shape.lineTo(0, 0);
  const geo = new THREE.ShapeGeometry(shape, 10);
  geo.computeBoundingBox();
  const box = geo.boundingBox ?? new THREE.Box3();
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(
      i,
      (pos.getX(i) - box.min.x) / (box.max.x - box.min.x),
      (pos.getY(i) - box.min.y) / (box.max.y - box.min.y),
    );
  }
  geo.rotateX(-Math.PI / 2);
  return geo;
}

const DRAGONFLY_LOOKS = [
  { body: "#2a8fbf", band: "#10324a", eye: "#1d4f7a", thorax: "#3a6f8f" },
  { body: "#c8392b", band: "#4a1410", eye: "#7a1f1a", thorax: "#8a3a2a" },
  { body: "#3a9a5a", band: "#163a22", eye: "#2a5a3a", thorax: "#4a7a3a" },
];

function Dragonflies({ nightMix }: { nightMix: MutableRefObject<number> }) {
  const groups = useRef<(THREE.Group | null)[]>([]);
  const leftWings = useRef<(THREE.Group | null)[]>([]);
  const rightWings = useRef<(THREE.Group | null)[]>([]);
  const flyers = useRef(
    DRAGONFLY_LOOKS.map(() => ({ ready: false, x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0, wait: 0, heading: 0 })),
  );
  const parts = useMemo(() => {
    const wingMap = createDragonflyWingTexture();
    return {
      foreWing: createDragonflyWingGeometry(0.15, 0.032),
      hindWing: createDragonflyWingGeometry(0.14, 0.042),
      wing: new THREE.MeshStandardMaterial({
        map: wingMap,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        roughness: 0.3,
      }),
      looks: DRAGONFLY_LOOKS.map((look) => ({
        abdomen: new THREE.MeshStandardMaterial({ map: createBandTexture(look.body, look.band, 9), roughness: 0.45 }),
        thorax: new THREE.MeshStandardMaterial({
          map: createBandTexture(look.thorax, look.band, 3, "#e8d070"),
          roughness: 0.5,
        }),
        eye: new THREE.MeshStandardMaterial({ color: look.eye, roughness: 0.15, metalness: 0.2 }),
      })),
    };
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const day = 1 - nightMix.current;
    parts.wing.opacity = day;
    flyers.current.forEach((d, i) => {
      const g = groups.current[i];
      const l = leftWings.current[i];
      const r = rightWings.current[i];
      if (!g || !l || !r) return;
      g.visible = day > 0.02;
      if (!g.visible) return;
      const pick = () => {
        const a = Math.random() * Math.PI * 2;
        const reach = 0.3 + Math.random() * 1.1;
        d.tx = POND.x + Math.cos(a) * POND.rx * reach;
        d.tz = POND.z + Math.sin(a) * POND.rz * reach;
        d.ty = 0.35 + Math.random() * 0.6;
      };
      if (!d.ready) {
        pick();
        d.x = d.tx;
        d.y = d.ty;
        d.z = d.tz;
        d.wait = Math.random() * 1.5;
        d.ready = true;
      }
      const dx = d.tx - d.x;
      const dy = d.ty - d.y;
      const dz = d.tz - d.z;
      const dist = Math.hypot(dx, dy, dz);
      let jitter = 0;
      if (d.wait > 0) {
        d.wait -= delta;
        jitter = Math.sin(t * 7 + i) * 0.012;
        if (d.wait <= 0) pick();
      } else if (dist < 0.04) {
        d.wait = 0.6 + Math.random() * 1.8;
      } else {
        const step = Math.min(dist, Math.max(0.8, dist * 5) * delta);
        d.x += (dx / dist) * step;
        d.y += (dy / dist) * step;
        d.z += (dz / dist) * step;
        let turn = Math.atan2(dx, dz) - d.heading;
        turn = Math.atan2(Math.sin(turn), Math.cos(turn));
        d.heading += turn * Math.min(1, delta * 14);
      }
      g.position.set(d.x, d.y + jitter, d.z);
      g.rotation.y = d.heading;
      const flap = Math.sin(t * 48 + i) * 0.35;
      l.rotation.z = -flap;
      r.rotation.z = flap;
    });
  });

  return (
    <>
      {parts.looks.map((look, i) => (
        <group
          key={i}
          ref={(el) => {
            groups.current[i] = el;
          }}
          scale={1.6}
        >
          <mesh position={[0, 0, -0.07]} rotation={[-Math.PI / 2, 0, 0]} material={look.abdomen}>
            <capsuleGeometry args={[0.008, 0.17, 3, 8]} />
          </mesh>
          <mesh position={[0, 0.004, 0.035]} scale={[1, 1.05, 1.4]} rotation={[-Math.PI / 2, 0, 0]} material={look.thorax}>
            <sphereGeometry args={[0.017, 12, 10]} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.011, 0.006, 0.068]} material={look.eye}>
              <sphereGeometry args={[0.013, 12, 10]} />
            </mesh>
          ))}
          {[-1, 1].map((side) => (
            <group
              key={side}
              ref={(el) => {
                if (side < 0) leftWings.current[i] = el;
                else rightWings.current[i] = el;
              }}
              position={[side * 0.008, 0.016, 0.035]}
              scale={[side, 1, 1]}
            >
              <mesh position={[0, 0, 0.012]} rotation={[0, 0.12, 0]} geometry={parts.foreWing} material={parts.wing} />
              <mesh position={[0, 0, -0.014]} rotation={[0, -0.12, 0]} geometry={parts.hindWing} material={parts.wing} />
            </group>
          ))}
        </group>
      ))}
    </>
  );
}

const HOPPER_SPOTS = [
  { x: -4.5, z: 2.5 },
  { x: 2.5, z: 3.5 },
  { x: 6.5, z: 0.5 },
  { x: -1, z: -3 },
];

const HOPPER_LOOKS = [
  { body: "#7cb342", dark: "#4e7a22", stripe: "#d6e27a", wing: "#8d9f4a", eye: "#5a3a1e" },
  { body: "#9aae4a", dark: "#5f6f22", stripe: "#e6d98a", wing: "#a59a5a", eye: "#4a2a14" },
  { body: "#a08050", dark: "#5a4224", stripe: "#e0c890", wing: "#8a7048", eye: "#3a2210" },
  { body: "#6fa83a", dark: "#3f6a1e", stripe: "#cfe07a", wing: "#7f9a40", eye: "#5a3a1e" },
];

function Grasshoppers({ nightMix }: { nightMix: MutableRefObject<number> }) {
  const groups = useRef<(THREE.Group | null)[]>([]);
  const knees = useRef<(THREE.Group | null)[]>([]);
  const hips = useRef<(THREE.Group | null)[]>([]);
  const looks = useMemo(
    () =>
      HOPPER_LOOKS.map((look) => ({
        abdomen: new THREE.MeshStandardMaterial({
          map: createBandTexture(look.body, look.dark, 7, look.stripe),
          roughness: 0.7,
        }),
        thorax: new THREE.MeshStandardMaterial({
          map: createBandTexture(look.dark, look.body, 2, look.stripe),
          roughness: 0.6,
        }),
        head: new THREE.MeshStandardMaterial({ color: look.body, roughness: 0.6 }),
        femur: new THREE.MeshStandardMaterial({ map: createFemurTexture(look.body, look.dark), roughness: 0.7 }),
        leg: new THREE.MeshStandardMaterial({ color: look.dark, roughness: 0.8 }),
        wing: new THREE.MeshStandardMaterial({
          map: createBandTexture(look.wing, look.dark, 5),
          roughness: 0.8,
        }),
        eye: new THREE.MeshStandardMaterial({ color: look.eye, roughness: 0.2 }),
      })),
    [],
  );
  const hoppers = useRef(
    HOPPER_SPOTS.map((spot, i) => ({
      x: spot.x,
      z: spot.z,
      fx: spot.x,
      fz: spot.z,
      tx: spot.x,
      tz: spot.z,
      wait: 0.8 + i * 0.9,
      p: -1,
      peak: 1,
      dur: 0.6,
      heading: 0,
    })),
  );

  useFrame((state, delta) => {
    const day = 1 - nightMix.current;
    hoppers.current.forEach((h, i) => {
      const g = groups.current[i];
      if (!g) return;
      g.visible = day > 0.02;
      if (!g.visible) return;
      let y = groundHeight(h.x, h.z) + 0.1;
      let pitch = 0;
      let kick = 0;
      if (h.p >= 0) {
        h.p = Math.min(1, h.p + delta / h.dur);
        h.x = h.fx + (h.tx - h.fx) * h.p;
        h.z = h.fz + (h.tz - h.fz) * h.p;
        y = groundHeight(h.x, h.z) + 0.1 + 4 * h.peak * h.p * (1 - h.p);
        pitch = (h.p - 0.5) * 1.1;
        kick = Math.sin(Math.min(1, h.p * 1.6) * Math.PI);
        if (h.p >= 1) {
          h.p = -1;
          h.wait = 1.2 + Math.random() * 3;
        }
      } else {
        h.wait -= delta;
        if (h.wait <= 0) {
          const home = HOPPER_SPOTS[i];
          for (let tries = 0; tries < 6; tries++) {
            const a = Math.random() * Math.PI * 2;
            const reach = 0.8 + Math.random() * 1.2;
            const tx = h.x + Math.cos(a) * reach;
            const tz = h.z + Math.sin(a) * reach;
            if (clearing(tx, tz) > 0.4 && Math.hypot(tx - home.x, tz - home.z) < 3.5) {
              h.fx = h.x;
              h.fz = h.z;
              h.tx = tx;
              h.tz = tz;
              h.heading = Math.atan2(tx - h.x, tz - h.z);
              h.peak = 0.75 + Math.random() * 0.4;
              h.dur = 0.5 + Math.random() * 0.25;
              h.p = 0;
              break;
            }
          }
          if (h.p < 0) h.wait = 0.5;
        }
      }
      g.position.set(h.x, y, h.z);
      g.rotation.set(pitch, h.heading, 0, "YXZ");
      for (const side of [0, 1]) {
        const hip = hips.current[i * 2 + side];
        const knee = knees.current[i * 2 + side];
        if (hip) hip.rotation.x = 0.32 - kick * 0.45;
        if (knee) knee.rotation.x = -3.05 + kick * 2.5;
      }
    });
  });

  return (
    <>
      {looks.map((look, i) => (
        <group
          key={i}
          ref={(el) => {
            groups.current[i] = el;
          }}
          scale={1.6}
        >
          <mesh position={[0, 0, -0.045]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1, 1.1]} material={look.abdomen}>
            <capsuleGeometry args={[0.019, 0.08, 4, 10]} />
          </mesh>
          <mesh position={[0, 0.006, 0.035]} scale={[1, 1.15, 1.45]} rotation={[-Math.PI / 2, 0, 0]} material={look.thorax}>
            <sphereGeometry args={[0.022, 12, 10]} />
          </mesh>
          <mesh position={[0, 0.004, 0.075]} scale={[0.9, 1.15, 1]} rotation={[0.5, 0, 0]} material={look.head}>
            <sphereGeometry args={[0.02, 12, 10]} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={`eye${side}`} position={[side * 0.015, 0.013, 0.08]} material={look.eye}>
              <sphereGeometry args={[0.007, 8, 6]} />
            </mesh>
          ))}
          {[-1, 1].map((side) => (
            <mesh
              key={`wing${side}`}
              position={[side * 0.009, 0.02, -0.03]}
              rotation={[-Math.PI / 2 - 0.08, side * 0.06, 0]}
              scale={[0.75, 1, 0.3]}
              material={look.wing}
            >
              <capsuleGeometry args={[0.012, 0.1, 3, 6]} />
            </mesh>
          ))}
          {[-1, 1].map((side, s) => (
            <group
              key={`hind${side}`}
              ref={(el) => {
                hips.current[i * 2 + s] = el;
              }}
              position={[side * 0.026, 0.002, 0.03]}
            >
              <mesh position={[0, 0, -0.05]} rotation={[Math.PI / 2, 0, 0]} material={look.femur}>
                <cylinderGeometry args={[0.005, 0.011, 0.1, 8]} />
              </mesh>
              <group
                ref={(el) => {
                  knees.current[i * 2 + s] = el;
                }}
                position={[0, 0, -0.1]}
              >
                <mesh position={[0, 0, -0.045]} rotation={[Math.PI / 2, 0, 0]} material={look.leg}>
                  <cylinderGeometry args={[0.003, 0.003, 0.09, 5]} />
                </mesh>
              </group>
            </group>
          ))}
          {[-1, 1].flatMap((side) =>
            [0.06, 0.03].map((z) => (
              <mesh
                key={`leg${side}${z}`}
                position={[side * 0.025, -0.014, z]}
                rotation={[z > 0.04 ? 0.4 : -0.4, 0, side * 0.7]}
                material={look.leg}
              >
                <cylinderGeometry args={[0.0025, 0.0025, 0.05, 4]} />
              </mesh>
            )),
          )}
          {[-1, 1].map((side) => (
            <mesh
              key={`ant${side}`}
              position={[side * 0.012, 0.03, 0.115]}
              rotation={[0.9, 0, -side * 0.35]}
              material={look.leg}
            >
              <cylinderGeometry args={[0.0015, 0.002, 0.11, 3]} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

const BUTTERFLY_COLORS = ["#f39a2b", "#f5d24a", "#f4efe2", "#7fb2ff", "#f39a2b", "#f5d24a", "#e98aa8", "#f4efe2", "#f39a2b"];

function createWingTexture(color: string) {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);
    const edge = ctx.createRadialGradient(0, size / 2, size * 0.25, 0, size / 2, size * 0.95);
    edge.addColorStop(0, "rgba(20, 14, 10, 0)");
    edge.addColorStop(0.7, "rgba(20, 14, 10, 0.15)");
    edge.addColorStop(1, "rgba(20, 14, 10, 0.95)");
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "rgba(20, 14, 10, 0.35)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, size / 2);
      ctx.lineTo(size, (i + 0.5) * (size / 4));
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    for (const [x, y] of [[52, 14], [56, 26], [50, 44], [44, 54]]) {
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return canvasTexture(canvas);
}

function createWingGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.01);
  shape.bezierCurveTo(0.04, 0.13, 0.17, 0.15, 0.16, 0.05);
  shape.bezierCurveTo(0.15, 0.0, 0.13, -0.02, 0.1, -0.02);
  shape.bezierCurveTo(0.13, -0.08, 0.09, -0.13, 0.04, -0.1);
  shape.lineTo(0, -0.02);
  const geo = new THREE.ShapeGeometry(shape, 10);
  geo.computeBoundingBox();
  const box = geo.boundingBox ?? new THREE.Box3();
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(
      i,
      (pos.getX(i) - box.min.x) / (box.max.x - box.min.x),
      (pos.getY(i) - box.min.y) / (box.max.y - box.min.y),
    );
  }
  geo.rotateX(Math.PI / 2);
  return geo;
}

function Butterflies({ nightMix }: { nightMix: MutableRefObject<number> }) {
  const groups = useRef<(THREE.Group | null)[]>([]);
  const leftWings = useRef<(THREE.Mesh | null)[]>([]);
  const rightWings = useRef<(THREE.Mesh | null)[]>([]);
  const wing = useMemo(() => createWingGeometry(), []);
  const flyers = useMemo(
    () =>
      BUTTERFLY_COLORS.map((color, i) => ({
        material: new THREE.MeshStandardMaterial({
          map: createWingTexture(color),
          side: THREE.DoubleSide,
          transparent: true,
          roughness: 0.8,
        }),
        cx: BUTTERFLY_SPOTS[i % BUTTERFLY_SPOTS.length].x,
        cz: BUTTERFLY_SPOTS[i % BUTTERFLY_SPOTS.length].z,
        radius: 1 + seeded(i + 551) * 1.4,
        lift: 0.75 + seeded(i + 701) * 0.35,
        speed: 0.6 + seeded(i + 801) * 0.5,
        phase: seeded(i + 901) * Math.PI * 2,
        size: 1 + seeded(i + 1001) * 0.35,
      })),
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const day = 1 - nightMix.current;
    flyers.forEach((f, i) => {
      const g = groups.current[i];
      const l = leftWings.current[i];
      const r = rightWings.current[i];
      if (!g || !l || !r) return;
      g.visible = day > 0.02;
      if (!g.visible) return;
      f.material.opacity = day;
      const at = (time: number) => {
        const s = time * f.speed;
        const x = f.cx + Math.sin(s * 0.5 + f.phase) * f.radius + Math.sin(s * 1.3 + f.phase * 2) * 0.15;
        const z = f.cz + Math.cos(s * 0.37 + f.phase) * f.radius * 0.8 + Math.cos(s * 1.1) * 0.1;
        return { x, z };
      };
      const now = at(t);
      const next = at(t + 0.08);
      const flap = Math.sin(t * (13 + f.speed * 4) + f.phase);
      g.position.set(
        now.x,
        groundHeight(now.x, now.z) + f.lift + Math.sin(t * 1.3 + f.phase) * 0.18 + flap * 0.02,
        now.z,
      );
      g.rotation.y = Math.atan2(next.x - now.x, next.z - now.z);
      const open = 0.25 + (flap * 0.5 + 0.5) * 1.05;
      r.rotation.z = open;
      l.rotation.z = -open;
    });
  });

  return (
    <>
      {flyers.map((f, i) => (
        <group
          key={i}
          ref={(el) => {
            groups.current[i] = el;
          }}
          scale={f.size}
        >
          <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <capsuleGeometry args={[0.008, 0.09, 3, 6]} />
            <meshStandardMaterial color="#2a1d14" />
          </mesh>
          <mesh
            ref={(el) => {
              rightWings.current[i] = el;
            }}
            geometry={wing}
            material={f.material}
          />
          <mesh
            ref={(el) => {
              leftWings.current[i] = el;
            }}
            geometry={wing}
            material={f.material}
            scale={[-1, 1, 1]}
          />
        </group>
      ))}
    </>
  );
}

type Props = {
  count: number;
  pointer: MutableRefObject<MotionLabPointer | null>;
  night: boolean;
};

const NIGHT_FADE_SECONDS = 2.2;
const DAY_LOOK = {
  fog: new THREE.Color("#eebb80"),
  ambient: new THREE.Color("#fff4e0"),
  sun: new THREE.Color("#ffe1a8"),
  sky: new THREE.Color("#8ec5ff"),
  ground: new THREE.Color("#3d6b32"),
  sunPos: new THREE.Vector3(14, 10, -10),
};
const NIGHT_LOOK = {
  fog: new THREE.Color("#141c34"),
  ambient: new THREE.Color("#6a7cc0"),
  sun: new THREE.Color("#9fb4ff"),
  sky: new THREE.Color("#2a3a70"),
  ground: new THREE.Color("#0d1a12"),
  sunPos: new THREE.Vector3(-12, 11, -14),
};

function createFireflyGeometry() {
  const positions = new Float32Array(FIREFLIES * 3);
  const seeds = new Float32Array(FIREFLIES);
  for (let i = 0; i < FIREFLIES; i++) {
    const x = (seeded(i + 1) - 0.5) * 24;
    const z = -11 + seeded(i + 101) * 19;
    positions.set([x, groundHeight(x, z) + 0.4 + seeded(i + 201) * 0.9, z], i * 3);
    seeds[i] = seeded(i + 301);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  return geo;
}

export function MotionLabGrassScene({ count, pointer, night }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const nightMix = useRef(night ? 1 : 0);
  const fogRef = useRef<THREE.Fog>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const porchRef = useRef<THREE.PointLight>(null);
  const fireflyGeometry = useMemo(() => createFireflyGeometry(), []);
  const fireflyMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uNight: { value: 0 }, uScale: { value: 70 } },
        vertexShader: FIREFLY_VERT,
        fragmentShader: FIREFLY_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  const lastScreen = useRef<{ x: number; y: number } | null>(null);
  const lastHit = useRef<THREE.Vector2 | null>(null);
  const gust = useRef(0);
  const bendPixels = useMemo(() => new Uint8Array(GRID * GRID * 4), []);
  const bendAge = useMemo(() => new Float32Array(GRID * GRID).fill(BEND_HOLD + BEND_LIFE), []);
  const bendTarget = useMemo(() => new Float32Array(GRID * GRID), []);
  const bendShow = useMemo(() => new Float32Array(GRID * GRID), []);
  const bendDirX = useMemo(() => new Float32Array(GRID * GRID), []);
  const bendDirZ = useMemo(() => new Float32Array(GRID * GRID).fill(1), []);
  const bendTexture = useMemo(() => {
    const tex = new THREE.DataTexture(bendPixels, GRID, GRID);
    tex.colorSpace = THREE.NoColorSpace;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.flipY = false;
    tex.needsUpdate = true;
    return tex;
  }, [bendPixels]);
  const air = useMemo(() => Array.from({ length: TRAIL }, () => new THREE.Vector3(0, -999, 0)), []);
  const airAge = useMemo(() => new Float32Array(TRAIL).fill(99), []);
  const airGust = useMemo(() => new Float32Array(TRAIL), []);
  const airHead = useRef(0);
  const airLast = useRef(new THREE.Vector3(999, 999, 999));
  const airPlane = useMemo(() => new THREE.Plane(), []);
  const airHit = useMemo(() => new THREE.Vector3(), []);
  const camDir = useMemo(() => new THREE.Vector3(), []);
  const planePoint = useMemo(() => new THREE.Vector3(), []);
  const side = useMemo(() => new THREE.Vector3(), []);
  const tangent = useMemo(() => new THREE.Vector3(), []);
  const ribbons = useMemo(() => [createRibbon(0.22), createRibbon(0.5)], []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const hitEdge = useMemo(() => new THREE.Vector3(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const { camera } = useThree();

  const geometry = useMemo(() => createBladeGeometry(), []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uBend: { value: bendTexture },
          uCamera: { value: new THREE.Vector2() },
          uTime: { value: 0 },
          uTip: { value: new THREE.Color("#b6e86a") },
          uBase: { value: new THREE.Color("#1a5a28") },
          uHighlight: { value: new THREE.Color("#f3ffd2") },
          uNight: { value: 0 },
        },
        vertexShader: BLADE_VERT,
        fragmentShader: BLADE_FRAG,
        side: THREE.DoubleSide,
      }),
    [bendTexture],
  );

  const waterMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uNight: { value: 0 } },
        vertexShader: WATER_VERT,
        fragmentShader: WATER_FRAG,
      }),
    [],
  );

  const skyMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uNight: { value: 0 } },
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [],
  );

  useEffect(() => {
    camera.position.set(0, 3.5, 12.5);
    camera.lookAt(0, 0.85, -2);
  }, [camera]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const cols = Math.ceil(Math.sqrt(count));
    const span = 26;
    const dummy = new THREE.Object3D();
    let i = 0;
    for (let gx = 0; gx < cols; gx++) {
      for (let gz = 0; gz < cols; gz++) {
        if (i >= count) break;
        const x = (gx / cols - 0.5) * span + (Math.random() - 0.5) * 0.22;
        const z = (gz / cols - 0.5) * span + (Math.random() - 0.5) * 0.22;
        const open = clearing(x, z);
        const pond = pondDistance(x, z);
        if (pond < 1.16 || open < (Math.random() - 0.5) * 0.5) continue;
        const pondFront = z > POND.z ? Math.min(1, 0.3 + 0.4 * (pond - 1.16)) : 1;
        dummy.position.set(x, groundHeight(x, z) - 0.02, z);
        dummy.rotation.set(-0.08 + Math.random() * 0.08, Math.random() * Math.PI * 2, 0);
        dummy.scale.setScalar(
          (0.7 + Math.random() * 0.7) * (0.45 + 0.55 * smooth(0, 2.4, open)) * pathFrontScale(x, z) * pondFront,
        );
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        i++;
      }
    }
    mesh.count = i;
    mesh.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame((state, delta) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uCamera.value.set(camera.position.x, camera.position.z);

    const p = pointer.current;
    const prevScreen = lastScreen.current;
    const screenStep = p && prevScreen ? Math.hypot(p.x - prevScreen.x, p.y - prevScreen.y) : 0;
    lastScreen.current = p ? { x: p.x, y: p.y } : null;
    const moving = screenStep > 0.0006;
    const speed = screenStep / Math.max(delta, 1 / 240);
    const gustTarget = moving ? Math.min(1, speed / 2.4) : 0;
    gust.current += (gustTarget - gust.current) * (1 - Math.exp(-delta * (gustTarget > gust.current ? 14 : 5)));
    const g = gust.current;
    waterMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    skyMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    fireflyMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    fireflyMaterial.uniforms.uScale.value = 110 * state.gl.getPixelRatio();

    const fadeStep = delta / NIGHT_FADE_SECONDS;
    nightMix.current += Math.max(-fadeStep, Math.min(fadeStep, (night ? 1 : 0) - nightMix.current));
    const n = nightMix.current * nightMix.current * (3 - 2 * nightMix.current);
    material.uniforms.uNight.value = n;
    waterMaterial.uniforms.uNight.value = n;
    skyMaterial.uniforms.uNight.value = n;
    fireflyMaterial.uniforms.uNight.value = n;
    fogRef.current?.color.lerpColors(DAY_LOOK.fog, NIGHT_LOOK.fog, n);
    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(0.45, 0.16, n);
      ambientRef.current.color.lerpColors(DAY_LOOK.ambient, NIGHT_LOOK.ambient, n);
    }
    if (sunRef.current) {
      sunRef.current.intensity = THREE.MathUtils.lerp(1.15, 0.45, n);
      sunRef.current.color.lerpColors(DAY_LOOK.sun, NIGHT_LOOK.sun, n);
      sunRef.current.position.lerpVectors(DAY_LOOK.sunPos, NIGHT_LOOK.sunPos, n);
    }
    if (hemiRef.current) {
      hemiRef.current.intensity = THREE.MathUtils.lerp(0.45, 0.2, n);
      hemiRef.current.color.lerpColors(DAY_LOOK.sky, NIGHT_LOOK.sky, n);
      hemiRef.current.groundColor.lerpColors(DAY_LOOK.ground, NIGHT_LOOK.ground, n);
    }
    if (porchRef.current) porchRef.current.intensity = THREE.MathUtils.lerp(2.2, 5.5, n);
    ndc.set(p ? p.x * 2 - 1 : 9, -(p ? p.y * 2 - 1 : 9));
    raycaster.setFromCamera(ndc, camera);

    const onGrass = !!p && raycaster.ray.intersectPlane(plane, hit) !== null;
    let brush = 0.45;
    if (onGrass) {
      ndc.x += 0.1;
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.ray.intersectPlane(plane, hitEdge)) {
        brush = Math.min(2.4, Math.max(0.95, hit.distanceTo(hitEdge)));
      }
      ndc.x -= 0.1;
      raycaster.setFromCamera(ndc, camera);
    }
    camera.getWorldDirection(camDir);
    planePoint.copy(camera.position).addScaledVector(camDir, 7);
    airPlane.setFromNormalAndCoplanarPoint(camDir, planePoint);
    const onScreen = !!p && raycaster.ray.intersectPlane(airPlane, airHit) !== null;

    if (onGrass && moving) {
      const from = lastHit.current;
      const segX = from ? hit.x - from.x : 0;
      const segZ = from ? hit.z - from.y : 0;
      const segLen = Math.hypot(segX, segZ);
      const dirX = segLen > 0.0001 ? segX / segLen : 0;
      const dirZ = segLen > 0.0001 ? segZ / segLen : 1;
      const sigma = Math.max(0.45, brush * 0.55) * (0.8 + g * 0.4);
      const strength = 0.22 + 0.78 * Math.pow(g, 0.85);
      const cell = FIELD / GRID;
      const span = Math.ceil((sigma * 2.6) / cell);
      const steps = from && segLen < 8 ? Math.min(24, Math.ceil(segLen / (sigma * 0.6))) : 0;

      for (let s = 0; s <= steps; s++) {
        const f = steps === 0 ? 1 : s / steps;
        const sx = from && steps > 0 ? from.x + segX * f : hit.x;
        const sz = from && steps > 0 ? from.y + segZ * f : hit.z;
        const cx = Math.floor((sx / FIELD + 0.5) * GRID);
        const cz = Math.floor((sz / FIELD + 0.5) * GRID);
        for (let iz = cz - span; iz <= cz + span; iz++) {
          for (let ix = cx - span; ix <= cx + span; ix++) {
            if (ix < 0 || iz < 0 || ix >= GRID || iz >= GRID) continue;
            const wx = ((ix + 0.5) / GRID - 0.5) * FIELD;
            const wz = ((iz + 0.5) / GRID - 0.5) * FIELD;
            const d = Math.hypot(wx - sx, wz - sz);
            const falloff = Math.exp(-(d * d) / (2 * sigma * sigma)) * strength;
            if (falloff < 0.03) continue;
            const idx = iz * GRID + ix;
            const holding = bendAge[idx] < BEND_HOLD;
            const base = holding ? bendTarget[idx] : bendShow[idx];
            const blend = bendShow[idx] < 0.04 ? 1 : 0.35 * falloff;
            const nx = bendDirX[idx] + (dirX - bendDirX[idx]) * blend;
            const nz = bendDirZ[idx] + (dirZ - bendDirZ[idx]) * blend;
            const nLen = Math.hypot(nx, nz) || 1;
            bendDirX[idx] = nx / nLen;
            bendDirZ[idx] = nz / nLen;
            bendTarget[idx] = Math.max(base, falloff);
            bendAge[idx] = 0;
          }
        }
      }
      lastHit.current = new THREE.Vector2(hit.x, hit.z);
    } else if (!onGrass) {
      lastHit.current = null;
    }

    const rise = 1 - Math.exp(-delta * 7);
    for (let i = 0; i < GRID * GRID; i++) {
      if (bendAge[i] >= BEND_HOLD + BEND_LIFE) continue;
      bendAge[i] += delta;
      const age = bendAge[i];
      if (age < BEND_HOLD) {
        bendShow[i] += (bendTarget[i] - bendShow[i]) * rise;
      } else if (age < BEND_HOLD + BEND_LIFE) {
        const t = (age - BEND_HOLD) / BEND_LIFE;
        bendShow[i] = Math.min(bendShow[i], bendTarget[i] * (1 - t) * (1 - t));
      } else {
        bendShow[i] = 0;
        bendTarget[i] = 0;
      }
      const o = i * 4;
      bendPixels[o] = Math.round((bendDirX[i] * 0.5 + 0.5) * 255);
      bendPixels[o + 1] = Math.round((bendDirZ[i] * 0.5 + 0.5) * 255);
      bendPixels[o + 2] = Math.round(bendShow[i] * 255);
    }

    bendTexture.needsUpdate = true;

    for (let i = 0; i < TRAIL; i++) airAge[i] += delta;

    if (onScreen && moving && airHit.distanceTo(airLast.current) > 0.12) {
      airHead.current = (airHead.current + 1) % TRAIL;
      const i = airHead.current;
      air[i].copy(airHit);
      airAge[i] = 0;
      airGust[i] = g;
      airLast.current.copy(airHit);
    }

    const samples: { x: number; y: number; z: number; amt: number; gust: number }[] = [];
    for (let n = 0; n < TRAIL; n++) {
      const i = (airHead.current + 1 + n) % TRAIL;
      const life = 1 - airAge[i] / (1.2 + airGust[i] * 0.8);
      if (life <= 0.02 || air[i].y < -100) continue;
      samples.push({
        x: air[i].x,
        y: air[i].y,
        z: air[i].z,
        amt: life * life * (0.45 + airGust[i] * 0.55),
        gust: airGust[i],
      });
    }

    ribbons.forEach((ribbon, layer) => {
      const count = samples.length;
      if (count < 2) {
        ribbon.geo.setDrawRange(0, 0);
        return;
      }
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        const sample = samples[i];
        const next = samples[Math.min(i + 1, count - 1)];
        const prev = samples[Math.max(i - 1, 0)];
        tangent.set(next.x - prev.x, next.y - prev.y, next.z - prev.z);
        if (tangent.lengthSq() < 0.0001) tangent.set(0, 0, 1);
        tangent.normalize();
        side.crossVectors(tangent, camDir);
        if (side.lengthSq() < 0.0001) side.set(0, 1, 0);
        side.normalize();
        const taper = Math.pow(t, 0.72) * (1 - t * 0.15);
        const width = taper * (layer === 0 ? 0.55 : 0.2) * (0.4 + sample.amt) * (0.35 + sample.gust * 1.65);
        const wave = Math.sin(t * Math.PI * 3 + layer) * (1 - t) * 0.05;
        const cx = sample.x + side.x * wave;
        const cy = sample.y + side.y * wave + layer * 0.04;
        const cz = sample.z + side.z * wave;
        const o = i * 2;
        ribbon.positions[o * 3] = cx + side.x * width;
        ribbon.positions[o * 3 + 1] = cy + side.y * width;
        ribbon.positions[o * 3 + 2] = cz + side.z * width;
        ribbon.positions[(o + 1) * 3] = cx - side.x * width;
        ribbon.positions[(o + 1) * 3 + 1] = cy - side.y * width;
        ribbon.positions[(o + 1) * 3 + 2] = cz - side.z * width;
        ribbon.uvs[o * 2] = 0;
        ribbon.uvs[o * 2 + 1] = t;
        ribbon.uvs[(o + 1) * 2] = 1;
        ribbon.uvs[(o + 1) * 2 + 1] = t;
        ribbon.amts[o] = sample.amt;
        ribbon.amts[o + 1] = sample.amt;
      }
      ribbon.geo.attributes.position.needsUpdate = true;
      ribbon.geo.attributes.uv.needsUpdate = true;
      ribbon.geo.attributes.aAmt.needsUpdate = true;
      ribbon.geo.setDrawRange(0, (count - 1) * 6);
    });
  });

  return (
    <>
      <fog ref={fogRef} attach="fog" args={["#eebb80", 24, 78]} />
      <mesh scale={80} frustumCulled={false}>
        <sphereGeometry args={[1, 32, 20]} />
        <primitive object={skyMaterial} attach="material" />
      </mesh>
      <ambientLight ref={ambientRef} intensity={0.45} color="#fff4e0" />
      <directionalLight ref={sunRef} position={[14, 10, -10]} intensity={1.15} color="#ffe1a8" />
      <hemisphereLight ref={hemiRef} args={["#8ec5ff", "#3d6b32", 0.45]} />
      <Landscape water={waterMaterial} porchLight={porchRef} />
      <instancedMesh ref={meshRef} args={[geometry, material, count]} frustumCulled={false} />
      <points geometry={fireflyGeometry} material={fireflyMaterial} frustumCulled={false} />
      <Butterflies nightMix={nightMix} />
      <Dragonflies nightMix={nightMix} />
      <Grasshoppers nightMix={nightMix} />
      {ribbons.map((ribbon) => (
        <mesh key={ribbon.mat.uuid} geometry={ribbon.geo} material={ribbon.mat} frustumCulled={false} />
      ))}
    </>
  );
}
