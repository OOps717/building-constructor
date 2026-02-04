import * as THREE from "three";
import SceneHandler from "./canvasEventHandlers.ts";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import type { SceneInteractor } from "./sceneInteractor.ts";
import type { RefObject } from "react";

const OFFSET_TO_SPHERE = 10;

export interface scene3DControllers {
  container: HTMLElement;
  renderer: THREE.WebGLRenderer;
  activeProjectRef: RefObject<SceneInteractor | null>;
  transformControlsRef: RefObject<TransformControls | null>;
  orbitControlsRef: RefObject<OrbitControls | null>;
  objCacheRef: RefObject<Map<string, THREE.Group>>;
  selectedToDropRef: RefObject<string | null | undefined>;
  selectedToDropOBJRef: RefObject<string | null | undefined>;
  selectMeshRef: RefObject<THREE.Object3D | null>;
  isSnappingRef: RefObject<boolean>;
  focusOnObjectRef: RefObject<boolean>;
  notifySceneChanged: () => void;
}

export function initThree(params: scene3DControllers) {
  const {
    renderer,
    activeProjectRef,
    transformControlsRef,
    orbitControlsRef,
    selectMeshRef,
    focusOnObjectRef,
    isSnappingRef,
    notifySceneChanged,
  } = params;

  let lastCamera: THREE.Camera | null = null;
  let lastScene: THREE.Scene | null = null;
  let running = true;
  let isDragging = false;

  const sceneHandler = new SceneHandler(params);

  window.addEventListener("resize", () => {
    sceneHandler.resize();
  });

  renderer.domElement.addEventListener("pointerdown", (event) => {
    sceneHandler.onPointerDown(event, isDragging);
  });

  renderer.domElement.addEventListener("pointermove", async (event) => {
    await sceneHandler.onPointerMove(event);
  });

  renderer.domElement.addEventListener("click", (event) => {
    sceneHandler.handleClick(event, isDragging);
  });

  renderer.domElement.addEventListener("wheel", async (event) => {
    await sceneHandler.handleWheel();
  });

  window.addEventListener("keydown", (event) => {
    sceneHandler.onKeyDown(event);
  });

  const animate = () => {
    if (!running) return;

    const project = activeProjectRef.current;
    if (!project?.scene || !project.camera) {
      requestAnimationFrame(animate);
      return;
    }

    if (project.camera !== lastCamera || project.scene !== lastScene) {
      // reinitialize transformers
      orbitControlsRef.current?.dispose();
      orbitControlsRef.current = new OrbitControls(
        project.camera,
        renderer.domElement,
      );
      transformControlsRef.current?.dispose();
      transformControlsRef.current = new TransformControls(
        project.camera,
        renderer.domElement,
      );
      transformControlsRef.current.showX = false;
      transformControlsRef.current.showY = false;
      transformControlsRef.current.showZ = false;

      transformControlsRef.current.addEventListener("dragging-changed", (e) => {
        isDragging = e.value as boolean;
        if (orbitControlsRef.current)
          orbitControlsRef.current.enabled = !e.value;
      });

      transformControlsRef.current.addEventListener("objectChange", () => {
        if (isDragging && isSnappingRef.current)
          project.applySnapping(transformControlsRef.current?.object);
      });

      const gizmo = transformControlsRef.current.getHelper();
      gizmo.userData.__editor = true;
      gizmo.traverse((child) => {
        child.userData.__editor = true;
      });
      project.scene.add(gizmo as any);

      sceneHandler.resize();
      lastCamera = project.camera;
      lastScene = project.scene;
    }

    if (
      focusOnObjectRef.current &&
      selectMeshRef.current &&
      orbitControlsRef.current &&
      !transformControlsRef.current?.showX
    ) {
      let { cameraDistance, orbitControlsDistance } = project.focusOnObject(
        selectMeshRef.current,
        OFFSET_TO_SPHERE,
        orbitControlsRef.current,
      );

      if (cameraDistance - OFFSET_TO_SPHERE < 4 && orbitControlsDistance < 1) {
        focusOnObjectRef.current = false;
      }
    }

    project.scene.updateMatrixWorld(true);
    // TO CORRECT
    // project.shadowTextureManager.renderShadowTexture(project.scene, renderer);
    // Array.from(project.shadowsReceivables).forEach((receivable) => {
    //   receivable.updateMatrixWorld(true);

    //   const positionAttr = receivable.geometry.getAttribute("position");
    //   const normalAttr = receivable.geometry.getAttribute("normal");
    //   const colorAttr = receivable.geometry.getAttribute("color");

    //   const positions = positionAttr.array as Float32Array;
    //   const colors = colorAttr.array as Float32Array;

    //   for (let v = 0; v < positionAttr.count; v++) {
    //     const i3 = v * 3;

    //     const normal = new THREE.Vector3(
    //       normalAttr.array[i3 + 0],
    //       normalAttr.array[i3 + 1],
    //       normalAttr.array[i3 + 2],
    //     ).transformDirection(receivable.matrixWorld);

    //     const worldPoint = new THREE.Vector3(
    //       positions[i3 + 0],
    //       positions[i3 + 1],
    //       positions[i3 + 2],
    //     ).applyMatrix4(receivable.matrixWorld);
    //     worldPoint.addScaledVector(normal, 0.05);

    //     const inShadow = project.shadowTextureManager.isInShadow(worldPoint);

    //     if (inShadow) {
    //       // blue
    //       colors[i3 + 0] = 1;
    //       colors[i3 + 1] = 1;
    //       colors[i3 + 2] = 1;
    //     } else {
    //       const color = new THREE.Color(0x1e2a5a);
    //       colors[i3 + 0] = color.r;
    //       colors[i3 + 1] = color.g;
    //       colors[i3 + 2] = color.b;
    //     }
    //   }

    //   colorAttr.needsUpdate = true;
    // });

    renderer.render(project.scene, project.camera);
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);

  sceneHandler.resize();
  notifySceneChanged();

  const disposeScene = () => {
    running = false;
    orbitControlsRef.current?.dispose();
    if (transformControlsRef.current) {
      const gizmo = transformControlsRef.current.getHelper();
      const parent = gizmo!.parent;
      parent!.remove(gizmo);
      gizmo.dispose();
    }
    transformControlsRef.current?.dispose();
    transformControlsRef.current = null;
    renderer.domElement.removeEventListener("pointerdown", (event) => {
      sceneHandler.onPointerDown(event, isDragging);
    });
    renderer.domElement.removeEventListener("pointermove", async (event) => {
      await sceneHandler.onPointerMove(event);
    });
    renderer.domElement.removeEventListener("click", (event) =>
      sceneHandler.handleClick(event, isDragging),
    );
    renderer.domElement.removeEventListener("wheel", async (event) => {
      await sceneHandler.handleWheel();
    });
    window.removeEventListener("keydown", (event) => {
      sceneHandler.onKeyDown(event);
    });
    window.removeEventListener("resize", () => {
      sceneHandler.resize();
    });
  };
  return disposeScene;
}
