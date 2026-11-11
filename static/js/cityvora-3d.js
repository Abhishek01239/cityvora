import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function seedFrom(text) {
  let seed = 0;
  for (let i = 0; i < text.length; i++) seed = (seed * 31 + text.charCodeAt(i)) >>> 0;
  return seed || 1;
}

function random(seed) {
  let value = seed >>> 0;
  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return (value >>> 0) / 4294967296;
  };
}

function makeCityStudy(host) {
  const canvas = host.querySelector('.cityvora-3d-canvas');
  if (!canvas) return;

  const scene = new THREE.Scene();
  const width = Math.max(1, host.clientWidth);
  const height = Math.max(1, host.clientHeight);
  const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
  camera.position.set(4.5, 5.2, 6.1);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(width, height, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene.add(new THREE.HemisphereLight(0xfffdf7, 0xaaa79e, 2.0));
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.1);
  keyLight.position.set(-3.5, 7, 4.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.left = -5;
  keyLight.shadow.camera.right = 5;
  keyLight.shadow.camera.top = 5;
  keyLight.shadow.camera.bottom = -5;
  keyLight.shadow.bias = -0.0005;
  scene.add(keyLight);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0.08, 0);
  controls.enableDamping = !reducedMotion;
  controls.dampingFactor = 0.075;
  controls.enablePan = false;
  controls.minDistance = 5.2;
  controls.maxDistance = 9.2;
  controls.minPolarAngle = 0.48;
  controls.maxPolarAngle = 1.28;
  controls.autoRotate = !reducedMotion;
  controls.autoRotateSpeed = 0.24;
  controls.update();

  const cityName = host.dataset.cityName || 'Cityvora';
  const rng = random(seedFrom(`${cityName}|${host.dataset.cityState || ''}`));
  const model = new THREE.Group();
  model.rotation.y = (rng() - 0.5) * 0.34;
  scene.add(model);

  const sideMaterial = new THREE.MeshStandardMaterial({ color: 0x292925, roughness: 0.52, metalness: 0.06 });
  const topMaterial = new THREE.MeshStandardMaterial({ color: 0xe9e7df, roughness: 0.88 });
  const roadMaterial = new THREE.MeshStandardMaterial({ color: 0xd0cec5, roughness: 0.95 });
  const buildingMaterials = [
    new THREE.MeshStandardMaterial({ color: 0xf8f7f2, roughness: 0.68 }),
    new THREE.MeshStandardMaterial({ color: 0xc9c7bf, roughness: 0.75 }),
    new THREE.MeshStandardMaterial({ color: 0x77766f, roughness: 0.65 }),
    new THREE.MeshStandardMaterial({ color: 0x33332f, roughness: 0.55 }),
    new THREE.MeshStandardMaterial({ color: 0xb66b4d, roughness: 0.62 })
  ];

  const base = new THREE.Mesh(new THREE.BoxGeometry(4.55, 0.24, 3.22), sideMaterial);
  base.position.y = -0.16;
  base.castShadow = true;
  base.receiveShadow = true;
  model.add(base);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(4.48, 3.15), topMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.037;
  ground.receiveShadow = true;
  model.add(ground);

  const rows = 7;
  const columns = 9;
  const spacingX = 0.45;
  const spacingZ = 0.39;
  const groundY = -0.018;

  for (let column = 0; column < columns - 1; column++) {
    const x = (column + 0.5 - (columns - 1) / 2) * spacingX;
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.008, 2.72), roadMaterial);
    seam.position.set(x, groundY, 0);
    model.add(seam);
  }
  for (let row = 0; row < rows - 1; row++) {
    const z = (row + 0.5 - (rows - 1) / 2) * spacingZ;
    const seam = new THREE.Mesh(new THREE.BoxGeometry(4.05, 0.008, 0.018), roadMaterial);
    seam.position.set(0, groundY, z);
    model.add(seam);
  }

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      if (rng() < 0.15) continue;
      const width = 0.20 + rng() * 0.10;
      const depth = 0.17 + rng() * 0.09;
      const landmark = rng() > 0.88;
      const buildingHeight = landmark ? 0.5 + rng() * 0.28 : 0.12 + Math.pow(rng(), 1.45) * 0.42;
      const x = (column - (columns - 1) / 2) * spacingX + (rng() - 0.5) * 0.055;
      const z = (row - (rows - 1) / 2) * spacingZ + (rng() - 0.5) * 0.045;
      const materialIndex = rng() > 0.88 ? 4 : Math.floor(rng() * 4);
      const geometry = landmark && rng() > 0.5
        ? new THREE.CylinderGeometry(width * 0.30, width * 0.54, buildingHeight, 7)
        : new THREE.BoxGeometry(width, buildingHeight, depth);
      const building = new THREE.Mesh(geometry, buildingMaterials[materialIndex]);
      building.position.set(x, groundY + buildingHeight / 2, z);
      building.castShadow = true;
      building.receiveShadow = true;
      model.add(building);

      if (landmark && rng() > 0.5) {
        const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.54, 0.07, depth * 0.54), buildingMaterials[3]);
        roof.position.set(x, groundY + buildingHeight + 0.035, z);
        roof.castShadow = true;
        model.add(roof);
      }
    }
  }

  const render = () => renderer.render(scene, camera);
  const animate = () => {
    controls.update();
    render();
  };
  let sceneIsVisible = false;
  let visibilityObserver = null;
  const syncAnimation = () => {
    renderer.setAnimationLoop(!reducedMotion && sceneIsVisible && !document.hidden ? animate : null);
  };
  if (reducedMotion) {
    controls.addEventListener('change', render);
    render();
  } else if ('IntersectionObserver' in window) {
    visibilityObserver = new IntersectionObserver(entries => {
      sceneIsVisible = entries.some(entry => entry.isIntersecting);
      syncAnimation();
    }, { threshold: 0 });
    visibilityObserver.observe(host);
    document.addEventListener('visibilitychange', syncAnimation);
    syncAnimation();
  } else {
    renderer.setAnimationLoop(animate);
  }

  const resizeObserver = new ResizeObserver(() => {
    const nextWidth = Math.max(1, host.clientWidth);
    const nextHeight = Math.max(1, host.clientHeight);
    camera.aspect = nextWidth / nextHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(nextWidth, nextHeight, false);
    render();
  });
  resizeObserver.observe(host);

  canvas.addEventListener('keydown', event => {
    const step = 0.11;
    if (event.key === 'ArrowLeft') model.rotation.y -= step;
    else if (event.key === 'ArrowRight') model.rotation.y += step;
    else if (event.key === 'ArrowUp') model.rotation.x = Math.max(-0.28, model.rotation.x - step);
    else if (event.key === 'ArrowDown') model.rotation.x = Math.min(0.28, model.rotation.x + step);
    else if (event.key === '+' || event.key === '=') {
      const offset = camera.position.clone().sub(controls.target).multiplyScalar(0.92);
      camera.position.copy(controls.target).add(offset.clampLength(controls.minDistance, controls.maxDistance));
    } else if (event.key === '-' || event.key === '_') {
      const offset = camera.position.clone().sub(controls.target).multiplyScalar(1.08);
      camera.position.copy(controls.target).add(offset.clampLength(controls.minDistance, controls.maxDistance));
    } else return;
    event.preventDefault();
    controls.update();
    render();
  });

  host.classList.add('is-rendered');
  window.addEventListener('pagehide', () => {
    resizeObserver.disconnect();
    visibilityObserver?.disconnect();
    document.removeEventListener('visibilitychange', syncAnimation);
    controls.dispose();
    renderer.setAnimationLoop(null);
    renderer.dispose();
  }, { once: true });
}

function boot3D() {
  const hosts = [...document.querySelectorAll('[data-city-3d]')];
  if (!('WebGL2RenderingContext' in window)) {
    hosts.forEach(host => host.classList.add('three-fallback'));
    return;
  }

  const initialize = host => {
    if (host.dataset.cityReady === 'true') return;
    host.dataset.cityReady = 'true';
    try {
      makeCityStudy(host);
    } catch (error) {
      host.classList.add('three-fallback');
      console.warn('Cityvora city study unavailable:', error);
    }
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          initialize(entry.target);
        }
      });
    }, { rootMargin: '160px' });
    hosts.forEach(host => observer.observe(host));
  } else hosts.forEach(initialize);
}

boot3D();
