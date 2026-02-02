import * as THREE from "three";

export function getRenderer(
  container: HTMLElement,
  renderer: THREE.WebGLRenderer | null,
) {
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  if (!container.contains(renderer.domElement)) {
    container.appendChild(renderer.domElement);
  }

  renderer.setSize(container.clientWidth, container.clientHeight);
  return renderer;
}
