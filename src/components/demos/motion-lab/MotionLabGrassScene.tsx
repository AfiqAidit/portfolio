"use client";
/* eslint-disable react-hooks/immutability -- three.js buffers and uniforms are mutated per frame inside useFrame */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
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
varying vec2 vUv;
varying float vWake;

void main() {
  vec3 col = mix(uBase, uTip, pow(vUv.y, 0.75));
  col = mix(col, uHighlight, smoothstep(0.72, 1.0, vUv.y) * 0.45);
  col = mix(col, vec3(0.93, 0.98, 0.72), vWake * 0.18);
  float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
  col *= 0.82 + edge * 0.18;
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

vec3 skyColor(vec3 dir, float time) {
  float h = clamp(dir.y * 0.55 + 0.15, 0.0, 1.0);
  vec3 horizon = vec3(0.98, 0.68, 0.38);
  vec3 zenith = vec3(0.34, 0.62, 0.92);
  vec3 col = mix(horizon, zenith, smoothstep(0.0, 0.62, h));
  float sunDot = max(dot(dir, SUN_DIR), 0.0);
  col += vec3(1.0, 0.62, 0.28) * pow(sunDot, 6.0) * 0.4;

  if (dir.y > 0.0) {
    vec2 uv = dir.xz / (dir.y + 0.14) * 0.8 + vec2(time * 0.012, time * 0.004);
    float n = skyFbm(uv * 1.4);
    float cover = smoothstep(0.48, 0.74, n) * smoothstep(0.0, 0.2, dir.y);
    float depth = skyFbm(uv * 1.4 + vec2(0.18, 0.12));
    vec3 lit = vec3(1.0, 0.9, 0.78) + vec3(0.35, 0.22, 0.08) * pow(sunDot, 4.0);
    vec3 shade = vec3(0.86, 0.66, 0.62);
    vec3 cloud = mix(shade, lit, smoothstep(0.35, 0.75, n - depth + 0.5));
    col = mix(col, cloud, cover * 0.88);
  }

  col += vec3(1.0, 0.95, 0.75) * pow(sunDot, 360.0);
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
  vec3 deep = vec3(0.1, 0.25, 0.28);
  vec3 col = mix(deep, skyColor(refl, uTime) * 0.92, fresnel);
  float edge = clamp(length(vUv - 0.5) * 2.0, 0.0, 1.0);
  col = mix(col, vec3(0.2, 0.28, 0.16), smoothstep(0.84, 1.0, edge) * 0.7);
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
varying vec3 vWorld;
${SKY_FN}
void main() {
  gl_FragColor = vec4(skyColor(normalize(vWorld), uTime), 1.0);
}
`;

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

function Landscape({ water }: { water: THREE.ShaderMaterial }) {
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
        <Homestead />
      </group>
      {CHICKENS.map((chicken) => (
        <Chicken key={chicken.seed} {...chicken} />
      ))}
    </group>
  );
}

const WOOD = "#9a6a42";
const WOOD_DARK = "#5a3622";
const ROOF = "#8f3b2c";

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
}: {
  size: [number, number, number];
  position: [number, number, number];
  color: string;
  rotation?: [number, number, number];
  glow?: boolean;
  map?: THREE.Texture;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        map={map ?? null}
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
const BALUSTERS = [-0.56, -0.44, -0.32, 0.32, 0.44, 0.56];

function Homestead() {
  return (
    <group>
      {HOUSE_POSTS.map((p) => (
        <Post key={`${p.x}-${p.z}`} x={p.x} z={p.z} height={0.8} />
      ))}
      <Block size={[2.2, 0.1, 1.4]} position={[0, 0.82, 0]} color={WOOD_DARK} />
      <Block size={[2, 0.86, 1.2]} position={[0, 1.3, 0]} color={WOOD} />
      <Block size={[2.02, 0.12, 1.22]} position={[0, 1.67, 0]} color="#e8d6b0" />
      {[-0.72, 0.72].map((x) => (
        <group key={x}>
          <Block size={[0.4, 0.44, 0.015]} position={[x, 1.28, 0.6]} color={WOOD_DARK} />
          <Block size={[0.3, 0.34, 0.02]} position={[x, 1.28, 0.605]} color="#ffd28a" glow />
        </group>
      ))}
      <Block size={[0.02, 0.34, 0.3]} position={[1.005, 1.28, 0]} color="#ffd28a" glow />
      <Block size={[0.34, 0.64, 0.02]} position={[0, 1.2, 0.605]} color={WOOD_DARK} />
      <RoofPrism half={0.92} height={0.78} length={2.6} color={ROOF} position={[0, 1.73, 0]} />
      {[-1.3, 1.3].map((x) => (
        <group key={x} position={[x, 2.56, 0]}>
          <Block size={[0.04, 0.42, 0.04]} position={[0, 0, 0.07]} rotation={[0.6, 0, 0]} color={WOOD_DARK} />
          <Block size={[0.04, 0.42, 0.04]} position={[0, 0, -0.07]} rotation={[-0.6, 0, 0]} color={WOOD_DARK} />
        </group>
      ))}

      {[-0.6, 0.6].map((x) => (
        <Post key={x} x={x} z={1.32} height={1.44} radius={0.04} />
      ))}
      <Block size={[1.3, 0.08, 0.75]} position={[0, 0.62, 0.98]} color={WOOD_DARK} />
      <Block size={[1.5, 0.05, 0.95]} position={[0, 1.6, 1.05]} rotation={[0.32, 0, 0]} color={ROOF} />
      {[-0.41, 0.41].map((x) => (
        <Block key={x} size={[0.38, 0.04, 0.04]} position={[x, 0.93, 1.33]} color={WOOD_DARK} />
      ))}
      {[-0.63, 0.63].map((x) => (
        <Block key={x} size={[0.04, 0.04, 0.75]} position={[x, 0.93, 0.98]} color={WOOD_DARK} />
      ))}
      {BALUSTERS.map((x) => (
        <Block key={x} size={[0.025, 0.3, 0.025]} position={[x, 0.78, 1.33]} color={WOOD_DARK} />
      ))}
      {[0.47, 0.32, 0.17].map((y, i) => (
        <Block key={y} size={[0.44, 0.05, 0.18]} position={[0, y, 1.47 + i * 0.14]} color={WOOD} />
      ))}
      <mesh position={[0.62, 0.13, 1.72]} scale={[1, 1.15, 1]}>
        <sphereGeometry args={[0.13, 16, 12]} />
        <meshStandardMaterial color="#7a4a2a" roughness={0.6} />
      </mesh>
      <pointLight position={[0, 1.2, 1.1]} color="#ffb35c" intensity={2.2} distance={5} decay={2} />

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
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
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

type Props = {
  count: number;
  pointer: MutableRefObject<MotionLabPointer | null>;
};

export function MotionLabGrassScene({ count, pointer }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
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
        uniforms: { uTime: { value: 0 } },
        vertexShader: WATER_VERT,
        fragmentShader: WATER_FRAG,
      }),
    [],
  );

  const skyMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
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
      <fog attach="fog" args={["#eebb80", 24, 78]} />
      <mesh scale={80} frustumCulled={false}>
        <sphereGeometry args={[1, 32, 20]} />
        <primitive object={skyMaterial} attach="material" />
      </mesh>
      <ambientLight intensity={0.45} color="#fff4e0" />
      <directionalLight position={[14, 10, -10]} intensity={1.15} color="#ffe1a8" />
      <hemisphereLight args={["#8ec5ff", "#3d6b32", 0.45]} />
      <Landscape water={waterMaterial} />
      <instancedMesh ref={meshRef} args={[geometry, material, count]} frustumCulled={false} />
      {ribbons.map((ribbon) => (
        <mesh key={ribbon.mat.uuid} geometry={ribbon.geo} material={ribbon.mat} frustumCulled={false} />
      ))}
    </>
  );
}
