import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { getObj } from "../../assetLoader";
import type { RefObject } from "react";

export class SceneInteractor {
  public scene: THREE.Scene;
  public camera:
    | THREE.PerspectiveCamera
    | THREE.OrthographicCamera
    | THREE.Camera;
  public raycaster: THREE.Raycaster;
  public mouseNDC: THREE.Vector2;
  public tmpMesh: THREE.Mesh | THREE.Object3D | THREE.Group | null;
  public materials: THREE.Material[];

  constructor() {
    this.materials = [
      new THREE.MeshStandardMaterial({
        color: "#567d46",
        transparent: true,
        opacity: 0.95,
      }),
    ];
    this.raycaster = new THREE.Raycaster();
    this.mouseNDC = new THREE.Vector2();
    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();

    this.tmpMesh = null;
    this.createScene();
  }

  addEdges(mesh: THREE.Mesh) {
    const edges = new THREE.EdgesGeometry(mesh.geometry, 1);
    const material = new THREE.LineBasicMaterial({
      color: "#48ff00",
      linewidth: 1,
    });
    const line = new THREE.LineSegments(edges, material);
    line.name = "__edges__";
    line.userData.editable = false;
    mesh.add(line);
  }

  addBasicPrimitive(
    type: string,
    material?: THREE.MeshStandardMaterial,
    name?: string,
  ) {
    let mesh: THREE.Mesh;
    let geometry: THREE.BufferGeometry;
    switch (type) {
      case "cube":
        geometry = new THREE.BoxGeometry(3, 3, 3);
        break;
      case "sphere":
        geometry = new THREE.SphereGeometry(3, 10, 10);
        break;
      case "capsule":
        geometry = new THREE.CapsuleGeometry(3, 4, 10);
        break;
      case "cylinder":
        geometry = new THREE.CylinderGeometry(3, 3, 4, 10);
        break;
      default:
        geometry = new THREE.BufferGeometry();
        mesh = new THREE.Mesh();
        break;
    }

    mesh = new THREE.Mesh(geometry, material ?? this.materials[0]);

    this.setBoundingObjects(mesh);
    mesh.userData.editable = true;

    name
      ? (mesh.name = name)
      : (mesh.name = "primitive_" + Math.floor(Math.random() * 10000));
    this.addEdges(mesh);
    this.scene.add(mesh);

    return mesh;
  }

  setBoundingObjects(mesh: THREE.Object3D) {
    const boundingBox = new THREE.Box3().setFromObject(mesh);
    mesh.userData.boundingBox = boundingBox;
    mesh.userData.boundingBoxSize = boundingBox.getSize(new THREE.Vector3());

    const boundingSphere = new THREE.Sphere();
    mesh.userData.boundingSphere =
      boundingBox.getBoundingSphere(boundingSphere);
  }

  createScene() {
    this.scene.background = new THREE.Color(0x404040);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000,
    );
    this.camera.position.set(20, 20, 20);
    this.camera.lookAt(0, 0, 0);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(20, 20, 20);
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;

    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 2000;
    this.scene.add(light);

    const primitive = this.addBasicPrimitive("cube");
    primitive.translateY(4);
    this.setBoundingObjects(primitive);

    // Plane for Editor
    const planeGeometry = new THREE.PlaneGeometry(500, 500, 20, 20);
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: "#72bcd4",
      wireframe: true,
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.userData.editable = false;
    plane.rotateX(-Math.PI / 2);
    this.scene.add(plane);
  }

  focusOnObject(
    mesh: THREE.Object3D,
    offset: number,
    orbitControls: OrbitControls,
  ) {
    const sphere = mesh.userData.boundingSphere;
    const target = sphere.center.clone();

    const dir = new THREE.Vector3()
      .subVectors(this.camera.position, target)
      .normalize();
    if (dir.lengthSq() < 0.0001) {
      dir.set(0, 0, 1);
    }
    const distance = sphere.radius + offset;
    const desiredPos = target.clone().add(dir.multiplyScalar(distance));

    this.camera.position.add(
      desiredPos.sub(this.camera.position).multiplyScalar(0.08),
    );

    orbitControls.target.lerp(target, 0.08);
    orbitControls.update();

    return {
      cameraDistance: this.camera.position.distanceTo(target),
      orbitControlsDistance: orbitControls.target.distanceTo(target),
    };
  }

  movePrimitiveBeforeDrop(
    event: MouseEvent,
    canvas: HTMLCanvasElement,
    type: string,
    radius = 20,
  ) {
    if (!this.tmpMesh) {
      this.tmpMesh = this.addBasicPrimitive(
        type,
        this.materials[0] as THREE.MeshStandardMaterial,
      );
      this.tmpMesh.userData.editable = false;
    }

    let objectsToCheck: THREE.Object3D[] = [];
    this.scene.traverse((obj) => {
      if (
        obj !== this.tmpMesh &&
        !this.tmpMesh?.getObjectById(obj.id) &&
        !obj.name.includes("__edges__") &&
        !this.isEditorObject(obj)
      )
        objectsToCheck.push(obj);
    });
    const hit = this.raycastFromMouse(event, canvas, {
      radius,
      objectsToCheck,
    });
    if (hit) this.snapToSurface(this.tmpMesh, hit);
    else {
      const position = this.raycaster.ray.origin
        .clone()
        .add(this.raycaster.ray.direction.clone().multiplyScalar(radius));
      this.tmpMesh.position.copy(position);
    }
  }

  async moveObjBeforeDrop(
    event: MouseEvent,
    canvas: HTMLCanvasElement,
    objCacheRef: RefObject<Map<string, THREE.Group>>,
    name: string,
    radius = 20,
  ) {
    if (!this.tmpMesh) {
      const obj = await getObj(name, objCacheRef);
      if (!obj) return;

      const instanceName = `${name}_${Math.floor(Math.random() * 10000)}`;
      obj.name = instanceName;

      this.tmpMesh = obj;
      this.tmpMesh.userData.editable = false;

      this.scene.add(this.tmpMesh);
    }
    const objectsToCheck: THREE.Object3D[] = [];
    this.scene.traverse((obj) => {
      if (
        obj !== this.tmpMesh &&
        !this.tmpMesh?.getObjectById(obj.id) &&
        !obj.name.includes("__edges__") &&
        !this.isEditorObject(obj)
      ) {
        objectsToCheck.push(obj);
      }
    });

    const hit = this.raycastFromMouse(event, canvas, {
      radius,
      objectsToCheck,
    });
    if (hit) this.snapToSurface(this.tmpMesh, hit);
    else {
      const position = this.raycaster.ray.origin
        .clone()
        .add(this.raycaster.ray.direction.clone().multiplyScalar(radius));
      this.tmpMesh?.position.copy(position);
    }
  }

  dropMesh() {
    if (!this.tmpMesh) return;
    const mesh = this.tmpMesh.clone(true);

    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (Array.isArray(child.material))
          child.material = child.material.map((m) => m.clone());
        else child.material = child.material.clone();
      }
    });

    mesh.userData.editable = true;

    this.scene.add(mesh);
    this.setBoundingObjects(mesh);

    this.removeTmpObject();
  }

  removeTmpObject() {
    if (this.tmpMesh) {
      this.scene.remove(this.tmpMesh);
      this.disposeObject(this.tmpMesh);
      this.tmpMesh = null;
    }
  }

  private updateMouseNDC(event: MouseEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();

    this.mouseNDC.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseNDC.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  isEditorObject(obj: THREE.Object3D): boolean {
    let current: THREE.Object3D | null = obj;
    while (current) {
      if (current.userData.__editor) return true;
      current = current.parent;
    }
    return false;
  }

  selectMeshToModify(event: MouseEvent, canvas: HTMLCanvasElement) {
    let objectsToCheck: THREE.Object3D[] = [];

    this.scene.traverse((obj) => {
      if (obj.userData.editable && !this.isEditorObject(obj))
        objectsToCheck.push(obj);
    });

    const result = this.raycastFromMouse(event, canvas, {
      objectsToCheck,
    })?.object;
    if (result?.parent?.isGroup) return result.parent;
    return result;
  }

  raycastFromMouse(
    event: MouseEvent,
    canvas: HTMLCanvasElement,
    options?: {
      objectsToCheck?: THREE.Object3D[];
      radius?: number;
    },
  ) {
    this.updateMouseNDC(event, canvas);
    this.raycaster.setFromCamera(this.mouseNDC, this.camera);
    this.raycaster.far = options?.radius ?? Infinity;
    this.raycaster.near = 0;
    const hits = this.raycaster.intersectObjects(
      options?.objectsToCheck ??
        this.scene.children.filter((obj) => !this.isEditorObject(obj)),
      options?.objectsToCheck ? false : true,
    );

    if (hits.length > 0) {
      return hits[0];
    }

    return null;
  }

  private snapToSurface(
    object: THREE.Object3D | THREE.Group,
    hit: THREE.Intersection,
  ) {
    const point = hit.point.clone();
    const normal =
      hit.face?.normal?.clone().transformDirection(hit.object.matrixWorld) ??
      new THREE.Vector3(0, 1, 0);
    const up = new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(up, normal);
    object.quaternion.slerp(q, 0.2);

    object.position.copy(point);

    const box = new THREE.Box3().setFromObject(object);
    const offset = -box.min.dot(normal);
    object.position.addScaledVector(normal, offset);
  }

  applySnapping(object: THREE.Object3D | null | undefined) {
    if (!object) return;

    const origin = object.position.clone();
    origin.y += 0.01;
    const direction = new THREE.Vector3(0, -1, 0);

    this.raycaster.set(origin, direction);
    let objectsToCheck: THREE.Object3D[] = [];
    this.scene.traverse((obj) => {
      if (
        obj !== object &&
        !object.getObjectById(obj.id) &&
        !obj.name.includes("__edges__") &&
        !this.isEditorObject(obj)
      ) {
        objectsToCheck.push(obj);
      }
    });

    const hits = this.raycaster.intersectObjects(objectsToCheck, false);

    if (!hits.length) return;
    const hit = hits[0];

    this.snapToSurface(object, hit);
  }

  disposeObject(object: THREE.Object3D) {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];
        materials.forEach((material) => {
          if (!material) return;
          for (const key in material) {
            const value = (material as any)[key];
            if (value && value.isTexture) {
              value.dispose();
            }
          }
          material.dispose();
        });
      }
    });
  }

  clearScene() {
    const toRemove = [...this.scene.children];

    for (const obj of toRemove) {
      this.scene.remove(obj);
      this.disposeObject(obj);
    }
  }
}
