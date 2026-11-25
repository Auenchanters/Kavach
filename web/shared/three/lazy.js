// Three.js comes from a CDN. Loading the 3D modules lazily keeps every button working when that fails
// (offline, a network that blocks the CDN, a browser without import maps): the page just shows no 3D.
const off = (el, e) => {
  console.warn("3D unavailable:", e);
  el.classList.add("no-3d");
  return { setState() {}, update() {}, dispose() {}, backend: "none" };
};

export const tryMountShield = (el, opts) =>
  import("./shield.js").then((m) => m.tryMountShield(el, opts), (e) => off(el, e));

export const tryMountGraph = (el, graph) =>
  import("./graph.js").then((m) => m.tryMountGraph(el, graph), (e) => off(el, e));
