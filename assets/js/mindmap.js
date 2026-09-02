// Connecting the dots — 3D 마인드맵
// 중앙 고리(yejin)를 중심으로 1단계 고리 6개, 2단계 고리 14개가 공간에 떠 있고 선으로 이어진다.
// 고리와 글자는 늘 카메라를 향하고(읽히도록), 배치와 선은 진짜 3D여서 돌리면 깊이가 드러난다.
// 고리 안쪽은 뒤에 있는 선을 가린다(캔버스 밖 배경 점은 그대로 비친다). 선은 늘 고리 테두리에서 시작하고 끝난다.
// 마우스·손가락으로 끌어 돌리고, 가만히 두면 천천히 자동 회전한다. 휠은 페이지 스크롤에 양보(확대 없음).

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

const stage = document.getElementById('mindmap');
if (stage) init(stage);

function init(stage) {
  const INK = 0x000000;
  const LINE_PX = 2;          // 1.5pt
  const R0 = 1.1;             // 중앙 고리 반지름
  const R1 = 0.95;            // 1단계 고리 반지름
  const R2 = 0.7;             // 2단계 고리 반지름
  const D1 = 5.6;             // 중앙 → 1단계 거리
  const D2 = 3.1;             // 1단계 → 2단계 거리
  const CHILDREN = [3, 2, 3, 2, 2, 2];   // 1단계 고리마다 달린 2단계 고리 수 (합 14)

  // ---------- 배치 ----------
  // 1단계: 구 표면에 고르게 흩어진 6방향 (살짝 기울여 정면에서 봐도 대칭이 아니게)
  const dirs1 = fibonacciSphere(6).map(v => v.applyAxisAngle(new THREE.Vector3(1, 0.3, 0.2).normalize(), 0.6));
  const nodes = [{ pos: new THREE.Vector3(0, 0, 0), r: R0, level: 0, parent: -1, text: 'yejin' }];
  dirs1.forEach((d, i) => {
    nodes.push({ pos: d.clone().multiplyScalar(D1), r: R1, level: 1, parent: 0, text: 'text' });
    const parentIdx = nodes.length - 1;
    const n = CHILDREN[i];
    // 자식은 부모의 바깥 방향을 축으로 한 작은 원 위에 놓는다
    const axis = d.clone();
    const perp1 = new THREE.Vector3().crossVectors(axis, Math.abs(axis.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)).normalize();
    const perp2 = new THREE.Vector3().crossVectors(axis, perp1).normalize();
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + i * 0.9;
      const dir = axis.clone().multiplyScalar(0.55)
        .addScaledVector(perp1, Math.cos(a) * 1.1)
        .addScaledVector(perp2, Math.sin(a) * 1.1)
        .normalize();
      nodes.push({ pos: nodes[parentIdx].pos.clone().addScaledVector(dir, D2), r: R2, level: 2, parent: parentIdx, text: 'text' });
    }
  });
  relax(nodes, D1, D2);

  // ---------- 씬 ----------
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  // 그림 전체가 담기는 반지름: 가장 먼 고리의 바깥 가장자리 + 여유
  const extent = nodes.reduce((m, n) => Math.max(m, n.pos.length() + n.r), 0) + 0.8;
  camera.position.set(0, 0.6, 23);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  stage.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = 'mm-labels';
  stage.appendChild(labelRenderer.domElement);

  const lineMat = new LineMaterial({ color: INK, linewidth: LINE_PX, worldUnits: false });

  // 고리 안쪽 가림막: 색은 칠하지 않고 깊이만 남겨, 뒤에 있는 선을 지운다.
  // 캔버스는 투명하므로 페이지의 노란 배경 점은 그대로 보인다
  const maskMat = new THREE.MeshBasicMaterial({ colorWrite: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });

  // 카메라를 향해 서는 것들(고리·가림막)을 모아 두고 매 프레임 방향을 맞춘다
  const billboards = [];

  const ringPts = (r) => {
    const pts = [];
    for (let i = 0; i <= 96; i++) {
      const t = (i / 96) * Math.PI * 2;
      pts.push(Math.cos(t) * r, Math.sin(t) * r, 0);
    }
    return pts;
  };

  // 고리 + 가림막 + 안의 글자
  nodes.forEach((n) => {
    const geo = new LineGeometry();
    geo.setPositions(ringPts(n.r));
    const ring = new Line2(geo, lineMat);
    ring.position.copy(n.pos);
    const mask = new THREE.Mesh(new THREE.CircleGeometry(n.r * 0.985, 48), maskMat);
    ring.add(mask);
    scene.add(ring);
    billboards.push(ring);
    n.label = makeLabel(n.text, n.level === 0 ? 'center' : 'node');
    ring.add(n.label);
  });

  // 이음선: 위치는 매 프레임 다시 잡는다(화면에서 고리 테두리에 정확히 닿도록)
  const links = nodes.filter(n => n.parent >= 0).map(n => [nodes[n.parent], n]);
  const segGeo = new LineSegmentsGeometry();
  segGeo.setPositions(new Array(links.length * 6).fill(0));
  scene.add(new LineSegments2(segGeo, lineMat));

  const camDir = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const perp = new THREE.Vector3();
  const pa = new THREE.Vector3();
  const pb = new THREE.Vector3();
  // 고리 중심에서 상대 쪽으로, 화면상 고리 반지름만큼 나간 지점 (보는 방향과 나란한 선은 절반까지만)
  function edgePoint(out, from, to, r, len) {
    dir.subVectors(to.pos, from.pos).normalize();
    perp.copy(dir).addScaledVector(camDir, -dir.dot(camDir));
    const s = Math.min(r / Math.max(perp.length(), 1e-3), len / 2);
    return out.copy(from.pos).addScaledVector(dir, s);
  }
  function updateLinks() {
    camDir.copy(camera.position).normalize();
    const buf = segGeo.attributes.instanceStart.data;
    const arr = buf.array;
    links.forEach(([a, b], i) => {
      const len = a.pos.distanceTo(b.pos);
      edgePoint(pa, a, b, a.r, len);
      edgePoint(pb, b, a, b.r, len);
      arr.set([pa.x, pa.y, pa.z, pb.x, pb.y, pb.z], i * 6);
    });
    buf.needsUpdate = true;
  }

  // 글자 가림: 더 앞에 있는 고리 안에 중심이 들어간 글자는 숨긴다 (가림막이 선을 가리는 것과 같은 규칙)
  const sp = new THREE.Vector3();
  function updateLabels() {
    const halfV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const info = nodes.map((n) => {
      sp.copy(n.pos).project(camera);
      const depth = camera.position.distanceTo(n.pos);
      return { x: sp.x, y: sp.y, depth, rx: (n.r / (depth * halfV)) / camera.aspect, ry: n.r / (depth * halfV) };
    });
    nodes.forEach((n, i) => {
      let hidden = false;
      for (let j = 0; j < nodes.length && !hidden; j++) {
        if (j === i || info[j].depth >= info[i].depth) continue;
        const dx = (info[i].x - info[j].x) / info[j].rx;
        const dy = (info[i].y - info[j].y) / info[j].ry;
        if (dx * dx + dy * dy < 1) hidden = true;
      }
      n.label.element.style.opacity = hidden ? '0' : '1';
    });
  }

  // ---------- 조작 ----------
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.rotateSpeed = 0.6;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.4;

  // 끌기 시작하면 자동 회전을 멈추고, 손을 뗀 뒤 잠시 있으면 다시 돈다
  let resumeTimer = null;
  controls.addEventListener('start', () => {
    controls.autoRotate = false;
    clearTimeout(resumeTimer);
  });
  controls.addEventListener('end', () => {
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => { controls.autoRotate = true; }, 2500);
  });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) controls.autoRotate = false;

  // ---------- 크기 ----------
  function resize() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // 세로·가로 어느 쪽으로도 잘리지 않는 거리로 카메라를 물린다 (좁은 화면이면 더 멀리)
    const halfV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dist = extent / Math.min(halfV, halfV * camera.aspect);
    camera.position.setLength(dist);
    controls.minDistance = controls.maxDistance = dist;
    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
    lineMat.resolution.set(w, h);
  }
  resize();
  new ResizeObserver(resize).observe(stage);

  // ---------- 그리기 ----------
  function frame() {
    controls.update();
    for (const b of billboards) b.quaternion.copy(camera.quaternion);
    updateLinks();
    updateLabels();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  frame();

  function makeLabel(text, kind) {
    const el = document.createElement('div');
    el.className = 'mm-label ' + kind;
    const span = document.createElement('span');
    span.textContent = text;
    el.appendChild(span);
    return new CSS2DObject(el);
  }
}

// 구 표면에 n개의 점을 고르게 뿌리는 방향 벡터 (피보나치 격자)
function fibonacciSphere(n) {
  const out = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = golden * i;
    out.push(new THREE.Vector3(Math.cos(t) * r, y, Math.sin(t) * r));
  }
  return out;
}

// 겹치는 고리를 밀어내고, 자식은 부모와의 거리를 지키게 몇 번 다듬는다 (결과는 매번 같다)
function relax(nodes, d1, d2) {
  const MIN_GAP = 0.9;
  for (let iter = 0; iter < 80; iter++) {
    for (let i = 1; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const d = new THREE.Vector3().subVectors(b.pos, a.pos);
        const dist = d.length();
        const min = a.r + b.r + MIN_GAP;
        if (dist < min && dist > 1e-6) {
          d.normalize().multiplyScalar((min - dist) * 0.5);
          a.pos.sub(d);
          b.pos.add(d);
        }
      }
    }
    // 부모와의 거리 복원 (중앙은 고정)
    for (let i = 1; i < nodes.length; i++) {
      const n = nodes[i], p = nodes[n.parent];
      const target = n.level === 1 ? d1 : d2;
      const d = new THREE.Vector3().subVectors(n.pos, p.pos);
      const dist = d.length() || 1e-6;
      n.pos.copy(p.pos).addScaledVector(d.normalize(), dist + (target - dist) * 0.5);
    }
  }
}
