import * as THREE from "three";

export class SceneInteractor {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  public raycaster: THREE.Raycaster;
  public mouseNDC: THREE.Vector2;
  public tmpMesh: THREE.Mesh | null;

  constructor() {
    this.createScene();
    this.raycaster = new THREE.Raycaster();
    this.mouseNDC = new THREE.Vector2();
    this.tmpMesh = null;
  }

  addEdges(mesh: THREE.Mesh) {
    const edges = new THREE.EdgesGeometry(mesh.geometry, 1);
    const material = new THREE.LineBasicMaterial({
      color: "#48ff00",
      linewidth: 1,
    });
    const line = new THREE.LineSegments(edges, material);
    line.name = "__edges__";
    mesh.add(line);
  }

  addBasicPrimitive(
    type: string,
    material: THREE.MeshStandardMaterial,
    name?: string,
  ) {
    let mesh: THREE.Mesh;
    switch (type) {
      case "cube":
        const boxGeometry = new THREE.BoxGeometry(3, 3, 3);
        mesh = new THREE.Mesh(boxGeometry, material);
        break;
      case "sphere":
        const sphereGeometry = new THREE.SphereGeometry(3, 10, 10);
        mesh = new THREE.Mesh(sphereGeometry, material);
        break;
      case "capsule":
        const capsuleGeometry = new THREE.CapsuleGeometry(3, 4, 10);
        mesh = new THREE.Mesh(capsuleGeometry, material);
        break;
      case "cylinder":
        const cylinderGeometry = new THREE.CylinderGeometry(3, 3, 4, 10);
        mesh = new THREE.Mesh(cylinderGeometry, material);
        break;
      default:
        mesh = new THREE.Mesh();
        break;
    }

    name
      ? (mesh.name = name)
      : (mesh.name = "primitive_" + Math.floor(Math.random() * 10000));
    this.addEdges(mesh);
    this.scene.add(mesh);

    return mesh;
  }

  createScene() {
    this.scene = new THREE.Scene();
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

    const standardMaterial = new THREE.MeshStandardMaterial({
      color: "#567d46",
      transparent: true,
      opacity: 0.95,
    });
    const primitive = this.addBasicPrimitive("cube", standardMaterial);
    primitive.translateY(4);

    const planeGeometry = new THREE.PlaneGeometry(50, 50, 20, 20);
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: "#72bcd4",
      wireframe: true,
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotateX(-Math.PI / 2);
    this.scene.add(plane);
  }

  movePrimitiveBeforeDrop(
    event: MouseEvent,
    canvas: HTMLCanvasElement,
    type: string,
    radius = 20,
  ) {
    if (!this.tmpMesh) {
      const standardMaterial = new THREE.MeshStandardMaterial({
        color: "#567d46",
        transparent: true,
        opacity: 0.95,
      });
      this.tmpMesh = this.addBasicPrimitive(type, standardMaterial);

      this.tmpMesh.userData.boundingBoxSize = new THREE.Box3()
        .setFromObject(this.tmpMesh)
        .getSize(new THREE.Vector3());
    }
    const hit = this.raycastFromMouse(event, canvas, radius);
    if (hit) this.snapObjectToSurface(this.tmpMesh, hit);
    else {
      const position = this.raycaster.ray.origin
        .clone()
        .add(this.raycaster.ray.direction.clone().multiplyScalar(radius));
      this.tmpMesh.position.copy(position);
    }
  }

  private updateMouseNDC(event: MouseEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();

    this.mouseNDC.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseNDC.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private isEditorObject(obj: THREE.Object3D): boolean {
    let current: THREE.Object3D | null = obj;
    while (current) {
      if (current.userData.__editor) return true;
      current = current.parent;
    }
    return false;
  }

  raycastFromMouse(
    event: MouseEvent,
    canvas: HTMLCanvasElement,
    radius?: number,
  ) {
    this.updateMouseNDC(event, canvas);
    this.raycaster.setFromCamera(this.mouseNDC, this.camera);
    this.raycaster.far = radius ?? Infinity;
    this.raycaster.near = 0;

    const hits = this.raycaster
      .intersectObjects(this.scene.children, true)
      .filter(
        (hit) =>
          !hit.object.userData?.__editor &&
          !hit.object.name.includes("__edges__") &&
          hit.object !== this.tmpMesh &&
          hit.object.parent !== this.tmpMesh &&
          !this.tmpMesh?.children.includes(hit.object),
      );

    if (hits.length > 0) {
      return hits[0];
    }

    return null;
  }

  private snapObjectToSurface(object: THREE.Object3D, hit: THREE.Intersection) {
    let size = new THREE.Vector3();
    if (!object.userData.halfHeight) {
      const box = new THREE.Box3().setFromObject(object); // bounding box
      box.getSize(size);
    } else size = object.userData.boundingBoxSize;

    object.position.copy(hit.point);
    object.position.add(hit.face!.normal.clone().multiplyScalar(size.y / 2));
  }

  applySnapping(object: THREE.Object3D | null | undefined) {
    if (!object) return;

    const origin = object.position.clone();
    origin.y += 0.01;
    const direction = new THREE.Vector3(0, -1, 0);

    this.raycaster.set(origin, direction);

    const hits = this.raycaster
      .intersectObjects(this.scene.children, true)
      .filter(
        (hit) =>
          !hit.object.userData?.__editor &&
          !hit.object.name.includes("__edges__") &&
          hit.object !== object,
      );

    if (!hits.length) return;
    const hit = hits[0];

    this.snapObjectToSurface(object, hit);
  }

  disposeObject(object: THREE.Object3D) {
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

  clearScene() {
    const toRemove = [...this.scene.children];

    for (const obj of toRemove) {
      this.scene.remove(obj);
      this.disposeObject(obj);
    }
  }
}
