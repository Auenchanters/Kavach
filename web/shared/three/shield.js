// The steel + indigo enamel shield from the pitch film, rendered with Three.js WebGPURenderer
// (falls back to WebGL2 by itself). States: idle (slow turn), joined (lifts, rings pulse with the voice), ended (settles, green ring).
import * as THREE from "three/webgpu";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

export async function mountShield(el, { level = () => 0 } = {}) {
  const renderer = new THREE.WebGPURenderer({ antialias: true, alpha: true });
  await renderer.init();
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.85;
  el.append(renderer.domElement);
  el.dataset.backend = renderer.backend.isWebGPUBackend ? "webgpu" : "webgl2";

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 0, 7.2);
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 4, 5);
  scene.add(key, new THREE.AmbientLight(0xffffff, 0.25));

  const rig = new THREE.Group();
  scene.add(rig);
  const gltf = await new GLTFLoader().loadAsync(new URL("../models/shield.glb", import.meta.url).href);
  const shield = gltf.scene;
  shield.traverse((o) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    o.material = mats.map((m) => /enamel/i.test(m.name)
      ? new THREE.MeshPhysicalMaterial({ color: 0x2a2fd0, metalness: 0.1, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.06 })
      : new THREE.MeshPhysicalMaterial({ color: 0x9a9ea7, metalness: 1, roughness: 0.36 }));
    if (o.material.length === 1) o.material = o.material[0];
  });
  const box = new THREE.Box3().setFromObject(shield);
  const size = box.getSize(new THREE.Vector3());
  shield.position.sub(box.getCenter(new THREE.Vector3()));
  const holder = new THREE.Group();
  holder.add(shield);
  holder.scale.setScalar(2.1 / Math.max(size.x, size.y, size.z));
  rig.add(holder);

  // two thin rings: one breathes with the voice, one ripples outward
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x6c70f0, transparent: true, opacity: 0 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.012, 8, 160), ringMat);
  const rippleMat = ringMat.clone();
  const ripple = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.008, 8, 160), rippleMat);
  rig.add(ring, ripple);

  let state = "idle", lift = 0, liftTarget = 0, ripplePhase = 0, raf = 0, t0 = performance.now();
  const fit = () => {
    const w = el.clientWidth || 1, h = el.clientHeight || 1;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(fit);
  ro.observe(el);
  fit();

  function frame(now) {
    const t = (now - t0) / 1000;
    lift += (liftTarget - lift) * 0.06;
    const lv = level();
    holder.rotation.y = reduced ? -0.35 : Math.sin(t * 0.45) * 0.42 - 0.2;
    holder.rotation.x = reduced ? 0.05 : Math.sin(t * 0.3) * 0.05;
    rig.position.y = lift * 0.18;
    rig.scale.setScalar(1 + lift * 0.05);
    const on = state !== "idle";
    ringMat.opacity += ((on ? 0.35 + lv * 0.65 : 0) - ringMat.opacity) * 0.15;
    ring.scale.setScalar(1 + lv * 0.06);
    ripplePhase = on && !reduced ? (ripplePhase + 0.006 + lv * 0.02) % 1 : 0;
    ripple.scale.setScalar(1 + ripplePhase * 0.45);
    rippleMat.opacity = on ? (1 - ripplePhase) * 0.35 : 0;
    renderer.render(scene, camera);
    raf = reduced && !on ? 0 : requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return {
    backend: el.dataset.backend,
    setState(s) {
      state = s;
      liftTarget = s === "joined" ? 1 : 0;
      const c = s === "ended" ? 0x4cc38a : 0x6c70f0;
      ringMat.color.setHex(c);
      rippleMat.color.setHex(c);
      if (!raf) raf = requestAnimationFrame(frame);
    },
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); el.replaceChildren(); },
  };
}

/** Mount, or leave the element's own fallback (a flat shield) in place when no GPU path works. */
export async function tryMountShield(el, opts) {
  try { return await mountShield(el, opts); }
  catch (e) { console.warn("3D shield unavailable:", e); el.classList.add("no-3d"); return { setState() {}, dispose() {}, backend: "none" }; }
}
