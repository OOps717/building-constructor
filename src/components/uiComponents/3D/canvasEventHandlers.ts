import * as THREE from "three";
import type { RefObject } from "react";
import type { SceneInteractor } from "./sceneInteractor";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { scene3DControllers } from "./main";

export default class SceneHandler {
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
  lastMode: "translate" | "rotate" | "scale" | null;
  pressCount: number;
  isDragging: boolean;

  constructor(params: scene3DControllers) {
    this.container = params.container;
    this.renderer = params.renderer;
    this.activeProjectRef = params.activeProjectRef;
    this.transformControlsRef = params.transformControlsRef;
    this.orbitControlsRef = params.orbitControlsRef;
    this.objCacheRef = params.objCacheRef;
    this.selectedToDropRef = params.selectedToDropRef;
    this.selectedToDropOBJRef = params.selectedToDropOBJRef;
    this.selectMeshRef = params.selectMeshRef;
    this.isSnappingRef = params.isSnappingRef;
    this.focusOnObjectRef = params.focusOnObjectRef;
    this.notifySceneChanged = params.notifySceneChanged;

    this.lastMode = null;
    this.pressCount = 0;
    this.isDragging = false;
  }

  resize() {
    const project = this.activeProjectRef.current;
    if (!project?.camera) return;

    const w = this.container.clientWidth;
    const h = this.container.clientHeight;

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

    (
      project.camera as THREE.PerspectiveCamera | THREE.OrthographicCamera
    ).updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  async onPointerMove(event: PointerEvent) {
    const project = this.activeProjectRef.current;
    if (!project) return;

    if (this.selectedToDropRef.current)
      project.movePrimitiveBeforeDrop(
        event,
        this.renderer.domElement,
        this.selectedToDropRef.current,
      );
    if (this.selectedToDropOBJRef.current)
      project.moveObjBeforeDrop(
        event,
        this.renderer.domElement,
        this.objCacheRef,
        this.selectedToDropOBJRef.current,
      );
  }

  onPointerDown(event: PointerEvent) {
    if (event.button === 0) {
      if (this.isDragging) return;
      const project = this.activeProjectRef.current;
      if (!project) return;

      const selection = project.selectMeshToModify(
        event,
        this.renderer.domElement,
      );
      if (selection) {
        if (
          this.selectMeshRef.current !== selection &&
          this.transformControlsRef.current
        ) {
          this.transformControlsRef.current.showX = false;
          this.transformControlsRef.current.showY = false;
          this.transformControlsRef.current.showZ = false;
          this.pressCount = 0;
          this.focusOnObjectRef.current = true;
        }

        this.selectMeshRef.current = selection;
        this.transformControlsRef.current?.attach(selection);
      }
    } else this.focusOnObjectRef.current = false;
  }

  handleWheel() {
    this.focusOnObjectRef.current = false;
  }

  handleClick(_event: MouseEvent | PointerEvent, isDirty: RefObject<boolean>) {
    const project = this.activeProjectRef.current;
    if (!project || this.isDragging || !project.tmpMesh) return;
    project.dropMesh();

    isDirty.current = true;
    this.notifySceneChanged();
    this.selectedToDropOBJRef.current = null;
    this.selectedToDropRef.current = null;
  }

  onKeyDown(e: KeyboardEvent) {
    const key = e.key.toLowerCase();
    if (["t", "r", "s"].includes(key)) {
      if (
        !this.transformControlsRef.current ||
        !this.transformControlsRef.current?.object
      )
        return;
      let nextMode: "translate" | "rotate" | "scale" | null = null;

      if (key === "t") nextMode = "translate";
      if (key === "r") nextMode = "rotate";
      if (key === "s") nextMode = "scale";

      if (!nextMode) return;

      if (this.lastMode === nextMode) this.pressCount += 1;
      else {
        this.lastMode = nextMode;
        this.pressCount = 1;
      }

      this.transformControlsRef.current.setMode(nextMode);

      if (this.pressCount >= 2) {
        this.transformControlsRef.current.showX = false;
        this.transformControlsRef.current.showY = false;
        this.transformControlsRef.current.showZ = false;
        this.pressCount = 0;
      } else {
        this.transformControlsRef.current.showX = true;
        this.transformControlsRef.current.showY = true;
        this.transformControlsRef.current.showZ = true;
      }
    }
    if (key === "escape") {
      const project = this.activeProjectRef.current;
      if (!project?.scene) return;
      project.removeTmpObject();
      this.selectedToDropRef.current = null;
      this.selectedToDropOBJRef.current = null;
    }
  }
}
