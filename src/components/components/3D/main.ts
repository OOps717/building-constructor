import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as THREE from "three";
import type { SceneInteractor } from "./sceneInteractor";
import { TransformControls } from "three/addons/controls/TransformControls.js";

export function initThree(
  container: HTMLElement,
  renderer: THREE.WebGLRenderer,
  activeProjectRef: React.RefObject<SceneInteractor | null>,
  transformControlsRef: React.RefObject<TransformControls | null>,
  isSnapping: React.RefObject<boolean>,
  selectedToDrop: React.RefObject<string | null | undefined>,
) {
  let orbitControls: OrbitControls | null = null;
  let lastCamera: THREE.Camera | null = null;
  let lastScene: THREE.Scene | null = null;
  let running = true;
  let isDragging = false;

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

  const onPointerDown = (event: PointerEvent) => {
    if (isDragging) return;
    const project = activeProjectRef.current;
    if (!project) return;

    const selectedMesh = project.raycastFromMouse(event, renderer.domElement);
    if (selectedMesh) {
      transformControlsRef.current?.attach(selectedMesh.object);
    }
  };
  renderer.domElement.addEventListener("pointerdown", onPointerDown);

  const onPointerMove = (event: PointerEvent) => {
    const project = activeProjectRef.current;
    if (!project || !selectedToDrop.current) return;
    project.movePrimitiveBeforeDrop(
      event,
      renderer.domElement,
      selectedToDrop.current,
    );
  };
  renderer.domElement.addEventListener("pointermove", onPointerMove);

  const handleClick = (event: MouseEvent | PointerEvent) => {
    const project = activeProjectRef.current;
    if (!project) return;
    selectedToDrop.current = null;
    project.tmpMesh = null;
  };
  renderer.domElement.addEventListener("click", handleClick);

  let lastMode: "translate" | "rotate" | "scale" | null = null;
  let pressCount = 0;
  const onKeyDown = (e: KeyboardEvent) => {
    if (!transformControlsRef.current || !transformControlsRef.current?.object)
      return;

    const key = e.key.toLowerCase();
    let nextMode: "translate" | "rotate" | "scale" | null = null;

    if (key === "t") nextMode = "translate";
    if (key === "r") nextMode = "rotate";
    if (key === "s") nextMode = "scale";

    if (!nextMode) return;

    if (lastMode === nextMode) pressCount += 1;
    else {
      lastMode = nextMode;
      pressCount = 1;
    }

    transformControlsRef.current.setMode(nextMode);

    console.log(pressCount);
    if (pressCount >= 2) {
      transformControlsRef.current.showX = false;
      transformControlsRef.current.showY = false;
      transformControlsRef.current.showZ = false;
      pressCount = 0;
    } else {
      transformControlsRef.current.showX = true;
      transformControlsRef.current.showY = true;
      transformControlsRef.current.showZ = true;
    }
  };
  window.addEventListener("keydown", onKeyDown);

  const animate = () => {
    if (!running) return;

    const project = activeProjectRef.current;
    if (!project?.scene || !project.camera) {
      requestAnimationFrame(animate);
      return;
    }

    if (project.camera !== lastCamera || project.scene !== lastScene) {
      orbitControls?.dispose();
      orbitControls = new OrbitControls(project.camera, renderer.domElement);
      transformControlsRef.current?.dispose();
      transformControlsRef.current = new TransformControls(
        project.camera,
        renderer.domElement,
      );

      transformControlsRef.current.addEventListener("dragging-changed", (e) => {
        isDragging = e.value as boolean;
        if (orbitControls) orbitControls.enabled = !e.value;
      });

      transformControlsRef.current.addEventListener("objectChange", () => {
        if (isDragging && isSnapping.current)
          project.applySnapping(transformControlsRef.current?.object);
      });

      const gizmo = transformControlsRef.current.getHelper();
      gizmo.userData.__editor = true;
      gizmo.traverse((child) => {
        child.userData.__editor = true;
      });
      project.scene.add(gizmo as any);

      resize();
      lastCamera = project.camera;
      lastScene = project.scene;
    }

    renderer.render(project.scene, project.camera);
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);

  resize();

  const disposeScene = () => {
    running = false;
    orbitControls?.dispose();
    transformControlsRef.current?.dispose();
    transformControlsRef.current = null;
    renderer.domElement.removeEventListener("pointerdown", onPointerDown);
    renderer.domElement.removeEventListener("pointermove", onPointerMove);
    renderer.domElement.removeEventListener("click", handleClick);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("resize", resize);
  };

  return disposeScene;
}
