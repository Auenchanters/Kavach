// The shared fraud graph in 3D (Three.js WebGPURenderer, WebGL2 fallback). Labels are DOM, so they stay readable and selectable.
// Colours carry meaning only: red = scam number / UPI / mule, dark red = syndicate, green = protected family, indigo = captured by KAVACH.
import * as THREE from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const STYLE = {
  syndicate: { r: 0.42, color: 0x7a2225 },
  phone: { r: 0.22, color: 0xe5484d },
  upi: { r: 0.2, color: 0xe5484d },
  mule: { r: 0.24, color: 0xe5484d },
  family: { r: 0.22, color: 0x4cc38a },
};

// 3D force layout, run to rest synchronously; positions persist across updates so the graph doesn't jump.
function layout(graph, prev) {
  const nodes = graph.nodes.map((n, i) => {
    const p = prev.get(n.id);
    const a = i * 2.39996, z = (i / graph.nodes.length) * 2 - 1, rr = Math.sqrt(1 - z * z);
    return { ...n, p: p ? p.clone() : new THREE.Vector3(Math.cos(a) * rr * 3, z * 2, Math.sin(a) * rr * 3) };
  });
  const idx = new Map(nodes.map((n, i) => [n.id, i]));
  const links = graph.links.filter((l) => idx.has(l.source) && idx.has(l.target));
  const d = new THREE.Vector3();
  for (let it = 0; it < 240; it++) {
    const k = 1 - it / 240;
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      d.subVectors(nodes[i].p, nodes[j].p);
      const len2 = Math.max(d.lengthSq(), 0.01);
      d.multiplyScalar((3.2 / len2) * k * 0.5);
      nodes[i].p.add(d); nodes[j].p.sub(d);
    }
    for (const l of links) {
      const a = nodes[idx.get(l.source)].p, b = nodes[idx.get(l.target)].p;
      d.subVectors(b, a);
      const len = d.length() || 1;
      d.multiplyScalar(((len - 1.8) / len) * 0.08 * k);
      a.add(d); b.sub(d);
    }
    for (const n of nodes) n.p.multiplyScalar(1 - 0.01 * k);
  }
  // centre and fit inside a sphere of radius 3, so the camera always frames every node
  const c = new THREE.Vector3();
  nodes.forEach((n) => c.add(n.p));
  c.divideScalar(nodes.length || 1);
  const far = Math.max(...nodes.map((n) => n.p.distanceTo(c)), 0.001);
  nodes.forEach((n) => n.p.sub(c).multiplyScalar(3.4 / far));
  return { nodes, links, idx };
}

export async function mountGraph(el, graph) {
  const renderer = new THREE.WebGPURenderer({ antialias: true, alpha: true });
  await renderer.init();
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  el.append(renderer.domElement);
  const labels = new CSS2DRenderer();
  labels.domElement.className = "graph-labels";
  el.append(labels.domElement);
  el.dataset.backend = renderer.backend.isWebGPUBackend ? "webgpu" : "webgl2";

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 1.2, 9.5);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x222226, 2.2));
  const dir = new THREE.DirectionalLight(0xffffff, 1.2);
  dir.position.set(4, 6, 5);
  scene.add(dir);

  const controls = new OrbitControls(camera, labels.domElement);
  controls.enableZoom = false;   // never hijack page scroll
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.autoRotate = !reduced;
  controls.autoRotateSpeed = 0.6;

  const group = new THREE.Group();
  scene.add(group);
  const prev = new Map();
  const sphere = new THREE.SphereGeometry(1, 32, 16);

  function build(g) {
    group.traverse((o) => { if (o.element) o.element.remove(); });
    group.clear();
    const { nodes, links, idx } = layout(g, prev);
    for (const n of nodes) {
      prev.set(n.id, n.p.clone());
      const st = STYLE[n.type] || STYLE.phone;
      const color = n.fresh ? 0x6c70f0 : n.type === "phone" && n.risk < 0.5 ? 0x4cc38a : st.color;
      const m = new THREE.Mesh(sphere, new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.2 }));
      m.scale.setScalar(st.r);
      m.position.copy(n.p);
      group.add(m);
      const div = document.createElement("div");
      div.className = `node-label${n.fresh ? " fresh" : ""}${n.type === "syndicate" ? " ring" : ""}`;
      div.textContent = n.label;
      const lab = new CSS2DObject(div);
      lab.position.copy(n.p).add(new THREE.Vector3(0, st.r + 0.18, 0));
      group.add(lab);
    }
    const pos = [], col = [];
    const grey = new THREE.Color(0x8a8a90), ind = new THREE.Color(0x6c70f0);
    for (const l of links) {
      const a = nodes[idx.get(l.source)].p, b = nodes[idx.get(l.target)].p;
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
      const c = l.fresh ? ind : grey;
      col.push(c.r, c.g, c.b, c.r, c.g, c.b);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    group.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.7 })));
  }
  build(graph);

  const fit = () => {
    const w = el.clientWidth || 1, h = el.clientHeight || 1;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    labels.setSize(w, h);
    camera.aspect = w / h;
    camera.position.setLength(w < 600 ? 11.5 : 8.6);
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(fit);
  ro.observe(el);
  fit();

  let raf = 0, visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); });
  io.observe(el);
  function frame() {
    controls.update();
    renderer.render(scene, camera);
    labels.render(scene, camera);
    raf = visible ? requestAnimationFrame(frame) : 0;
  }
  raf = requestAnimationFrame(frame);

  return {
    backend: el.dataset.backend,
    update(g) { build(g); },
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); controls.dispose(); renderer.dispose(); el.replaceChildren(); },
  };
}

export async function tryMountGraph(el, graph) {
  try { return await mountGraph(el, graph); }
  catch (e) { console.warn("3D graph unavailable:", e); el.classList.add("no-3d"); return { update() {}, dispose() {}, backend: "none" }; }
}
