import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as THREE from "three";
import type { ProjectRuntime } from "../../../App";
import type { RefObject } from "react";

export function initThree(
  container: HTMLElement,
  renderer: THREE.WebGLRenderer,
  activeProjectRef: React.RefObject<ProjectRuntime | null>,
) {
  let controls: OrbitControls | null = null;
  let lastCamera: THREE.Camera | null = null;
  let running = true;

  const resize = () => {
    const project = activeProjectRef.current;
    if (!project?.camera) return;

    const w = container.clientWidth;
    const h = container.clientHeight;

    if (project.camera instanceof THREE.PerspectiveCamera) {
      project.camera.aspect = w / h;
    }

    if (project.camera instanceof THREE.OrthographicCamera) {
      const aspect = w / h;
      project.camera.left = -aspect;
      project.camera.right = aspect;
      project.camera.top = 1;
      project.camera.bottom = -1;
    }

    project.camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener("resize", resize);

  // window.addEventListener("pointerup", () => {
  //   console.log();
  // });

  const animate = () => {
    if (!running) {
      lastCamera = null;
      return;
    }

    const project = activeProjectRef.current;
    if (!project?.scene || !project.camera) {
      requestAnimationFrame(animate);
      return;
    }

    if (project.camera !== lastCamera) {
      controls?.dispose();
      controls = new OrbitControls(project.camera, renderer.domElement);
      controls.enableDamping = true;
      resize();
      lastCamera = project.camera;
    }

    controls?.update();
    renderer.render(project.scene, project.camera);
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);

  resize();
  // savePreview();

  const disposeScene = () => {
    running = false;
    controls?.dispose();
    window.removeEventListener("resize", resize);
  };

  return disposeScene;
}
