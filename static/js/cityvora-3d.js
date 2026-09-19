import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function seedFrom(text) {
  let seed = 0;
  for (let i = 0; i < text.length; i++) seed = (seed * 31 + text.charCodeAt(i)) >>> 0;
  return seed || 1;
}

function random(seed) {
  let x = seed >>> 0;
  return () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return ((x >>> 0) % 10000) / 10000;
  };
}

function markerPosition(lat, lon, radius) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function createScene(host) {
  const canvas = host.querySelector('.cityvora-3d-canvas');
  if (!canvas) return;

  const width = host.clientWidth || 600;
  const height = host.clientHeight || 400;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
  camera.position.set(0, 0.15, 4.7);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
  renderer.setSize(width, height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 3.2;
  controls.maxDistance = 6.2;
  controls.autoRotate = !reduced;
  controls.autoRotateSpeed = 0.38;

  const group = new THREE.Group();
  scene.add(group);

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(1.35, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0x0a141b, transparent: true, opacity: 0.92 })
  );
  group.add(core);

  const wire = new THREE.Mesh(
    new THREE.SphereGeometry(1.39, 32, 24),
    new THREE.MeshBasicMaterial({ color: 0x55e6ff, wireframe: true, transparent: true, opacity: 0.16 })
  );
  group.add(wire);

  const inner = new THREE.Mesh(
    new THREE.SphereGeometry(1.02, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x55e6ff, transparent: true, opacity: 0.045 })
  );
  group.add(inner);

  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x55e6ff, transparent: true, opacity: 0.22 });
  [1.72, 2.0].forEach((radius, index) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.006, 8, 160), ringMaterial);
    ring.rotation.x = index ? Math.PI / 2.6 : Math.PI / 3.2;
    ring.rotation.z = index ? -0.4 : 0.35;
    group.add(ring);
  });

  const name = host.dataset.cityName || 'Cityvora';
  const rng = random(seedFrom(name));
  const markerGroup = new THREE.Group();
  const points = [];
  const baseLat = 20 + rng() * 30;
  const baseLon = 55 + rng() * 65;

  for (let i = 0; i < 18; i++) {
    const lat = Math.max(-70, Math.min(70, baseLat + (rng() - 0.5) * 45));
    const lon = baseLon + (rng() - 0.5) * 70;
    const p = markerPosition(lat, lon, 1.405);
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(i === 0 ? 0.045 : 0.024, 12, 12),
      new THREE.MeshBasicMaterial({ color: i === 0 ? 0xffffff : 0x55e6ff })
    );
    dot.position.copy(p);
    markerGroup.add(dot);
    points.push(p.clone());
  }
  group.add(markerGroup);

  const starGeometry = new THREE.BufferGeometry();
  const starPositions = [];
  for (let i = 0; i < 260; i++) {
    const r = 4.2 + rng() * 3.5;
    const a = rng() * Math.PI * 2;
    const b = Math.acos(2 * rng() - 1);
    starPositions.push(r * Math.sin(b) * Math.cos(a), r * Math.cos(b), r * Math.sin(b) * Math.sin(a));
  }
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0x6e8792, size: 0.012, transparent: true, opacity: 0.7 }));
  scene.add(stars);

  const ambient = new THREE.AmbientLight(0x8addeb, 1.2);
  scene.add(ambient);
  const key = new THREE.PointLight(0x55e6ff, 8, 10);
  key.position.set(3, 2, 4);
  scene.add(key);

  const resize = () => {
    const w = host.clientWidth || 600;
    const h = host.clientHeight || 400;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  window.addEventListener('resize', resize, { passive: true });

  let t = 0;
  renderer.setAnimationLoop(() => {
    t += 0.006;
    markerGroup.rotation.y = Math.sin(t * 0.45) * 0.025;
    stars.rotation.y += reduced ? 0.00005 : 0.00018;
    group.rotation.z = Math.sin(t * 0.22) * 0.018;
    controls.update();
    renderer.render(scene, camera);
  });
}

function boot3D() {
  document.querySelectorAll('[data-city-3d]').forEach(host => {
    try { createScene(host); } catch (error) {
      host.classList.add('three-fallback');
      console.warn('Cityvora 3D scene unavailable:', error);
    }
  });
}

if (!reduced) {
  if ('WebGL2RenderingContext' in window) boot3D();
} else {
  document.querySelectorAll('[data-city-3d]').forEach(host => host.classList.add('three-reduced'));
}
