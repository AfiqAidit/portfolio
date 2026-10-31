"use client";

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
const HOUSE = { x: -7.2, z: -8.2 };

function smooth(edge0: number, edge1: number, v: number) {
  const t = Math.min(1, Math.max(0, (v - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function pondDistance(x: number, z: number) {
  return Math.hypot((x - POND.x) / POND.rx, (z - POND.z) / POND.rz);
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
  const geo = new THREE.PlaneGeometry(120, 84, 200, 140);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, -20);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const field = new THREE.Color("#1d4a24");
  const slope = new THREE.Color("#3f7a3f");
  const crest = new THREE.Color("#8aa95a");
  const mud = new THREE.Color("#4a4026");
  const col = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = groundHeight(x, z);
    pos.setY(i, y - 0.02);
    col.copy(field).lerp(slope, smooth(0.3, 2.2, y));
    col.lerp(crest, smooth(2.6, 5.5, y) * 0.7);
    col.lerp(mud, (1 - smooth(1.0, 1.25, pondDistance(x, z))) * 0.8);
    colors.set([col.r, col.g, col.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

const TREES = [
  [-9.6, -9.8, 1.1],
  [-5.2, -10.4, 0.85],
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

const REEDS = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * Math.PI * 2 + Math.sin(i * 7.3) * 0.2;
  const r = 1.02 + (Math.sin(i * 3.7) * 0.5 + 0.5) * 0.08;
  return {
    x: POND.x + Math.cos(a) * POND.rx * r,
    z: POND.z + Math.sin(a) * POND.rz * r,
    h: 0.5 + (Math.sin(i * 5.1) * 0.5 + 0.5) * 0.45,
  };
});

function Pond({ material }: { material: THREE.ShaderMaterial }) {
  return (
    <group>
      <mesh position={[POND.x, 0.02, POND.z]} rotation={[-Math.PI / 2, 0, 0]} scale={[POND.rx, POND.rz, 1]}>
        <circleGeometry args={[1.04, 48]} />
        <primitive object={material} attach="material" />
      </mesh>
      {REEDS.filter((_, i) => i % 3 !== 1).map((reed) => (
        <mesh key={`${reed.x}-${reed.z}`} position={[reed.x, reed.h / 2, reed.z]}>
          <coneGeometry args={[0.025, reed.h, 4]} />
          <meshStandardMaterial color="#4d6b2a" roughness={1} />
        </mesh>
      ))}
    </group>
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
      <group position={[HOUSE.x, houseY, HOUSE.z]} rotation={[0, 0.5, 0]}>
        {[
          [-0.72, 0.32, -0.42],
          [0.72, 0.32, -0.42],
          [-0.72, 0.32, 0.42],
          [0.72, 0.32, 0.42],
        ].map((p) => (
          <mesh key={p.join()} position={p as [number, number, number]}>
            <cylinderGeometry args={[0.055, 0.07, 0.64, 6]} />
            <meshStandardMaterial color="#6a4630" roughness={0.9} />
          </mesh>
        ))}
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[1.9, 0.1, 1.25]} />
          <meshStandardMaterial color="#8b6244" />
        </mesh>
        <mesh position={[0, 1.18, 0]}>
          <boxGeometry args={[1.65, 0.82, 1.05]} />
          <meshStandardMaterial color="#f3ead8" roughness={0.85} />
        </mesh>
        <mesh position={[0, 1.18, 0.53]}>
          <boxGeometry args={[0.28, 0.42, 0.04]} />
          <meshStandardMaterial color="#6e3b2a" />
        </mesh>
        <mesh position={[0, 1.82, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[1.35, 0.62, 4]} />
          <meshStandardMaterial color="#9c3d32" roughness={0.8} />
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
        if (pondDistance(x, z) < 1.08 || Math.hypot(x - HOUSE.x, z - HOUSE.z) < 1.35) continue;
        dummy.position.set(x, groundHeight(x, z) - 0.02, z);
        dummy.rotation.set(-0.08 + Math.random() * 0.08, Math.random() * Math.PI * 2, 0);
        dummy.scale.setScalar(0.7 + Math.random() * 0.7);
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
