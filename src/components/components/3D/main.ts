import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createScene } from "./scene";
import { createRenderer } from "./renderer";
import * as THREE from "three";

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      if (Array.isArray(child.material))
        child.material.forEach((m) => m.dispose());
      else child.material.dispose();
    }

    if ((child as any).material?.map) {
      (child as any).material.map.dispose();
    }
  });
}

function clearScene(scene: THREE.Scene) {
  const toRemove = [...scene.children];

  for (const obj of toRemove) {
    scene.remove(obj);
    disposeObject(obj);
  }
}

export function initThree(
  container: HTMLElement,
  activeTab: string,
  scene3DRef: React.RefObject<THREE.Scene | null>,
  onReady?: (scene: THREE.Scene) => void,
) {
  const { scene, camera } = createScene();
  const renderer = createRenderer(container);

  const canvas = renderer.domElement;
  let running = true;

  const controls = new OrbitControls(camera, canvas);

  const resize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener("resize", resize);

  // window.addEventListener("pointerup", () => {
  //   console.log();
  // });

  // Not working for now
  const savePreview = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    const canvas = renderer.domElement;
    renderer.setSize(256, 256);
    renderer.render(scene, camera);
    const preview = canvas.toDataURL("image/png");
    renderer.setSize(width, height);
    localStorage.setItem(`scene-preview:${activeTab}`, preview);
  };

  const animate = (now: number) => {
    if (!running) return;
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);

  scene3DRef.current = scene;
  onReady?.(scene);
  resize();
  savePreview();

  const disposeScene = () => {
    if (!scene) return;
    clearScene(scene);
    running = false;
    window.removeEventListener("resize", resize);
    renderer.dispose();
    container.removeChild(renderer.domElement);
  };

  return disposeScene;
}
