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

export function clearScene(scene: THREE.Scene) {
  const toRemove = [...scene.children];

  for (const obj of toRemove) {
    scene.remove(obj);
    disposeObject(obj);
  }
}

function addEdges(mesh: THREE.Mesh) {
  const edges = new THREE.EdgesGeometry(mesh.geometry, 1);
  const material = new THREE.LineBasicMaterial({
    color: "#48ff00",
    linewidth: 1,
  });
  const line = new THREE.LineSegments(edges, material);
  line.name = "__edges__";
  mesh.add(line);
}

function addBasicPrimitive(type: string, material: THREE.MeshStandardMaterial) {
  switch (type) {
    case "cube":
      const boxGeometry = new THREE.BoxGeometry(3, 3, 3);
      return new THREE.Mesh(boxGeometry, material);
    case "sphere":
      const sphereGeometry = new THREE.SphereGeometry(3, 10, 10);
      return new THREE.Mesh(sphereGeometry, material);
    case "capsule":
      const capsuleGeometry = new THREE.CapsuleGeometry(3, 4, 10);
      return new THREE.Mesh(capsuleGeometry, material);
    case "cylinder":
      const cylinderGeometry = new THREE.CylinderGeometry(3, 3, 4, 10);
      return new THREE.Mesh(cylinderGeometry, material);
    default:
      return new THREE.Mesh();
  }
}

export function createScene(): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
} {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x404040);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    2000,
  );
  camera.position.set(20, 20, 20);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(20, 20, 20);
  light.castShadow = true;
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;

  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 2000;
  scene.add(light);

  const standardMaterial = new THREE.MeshStandardMaterial({
    color: "#567d46",
    transparent: true,
    opacity: 0.95,
  });
  const primitive = addBasicPrimitive("cube", standardMaterial);
  primitive.translateY(4);
  addEdges(primitive);
  scene.add(primitive);

  const planeGeometry = new THREE.PlaneGeometry(50, 50, 20, 20);
  const planeMaterial = new THREE.MeshStandardMaterial({
    color: "#72bcd4",
    wireframe: true,
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotateX(Math.PI / 2);
  scene.add(plane);

  return { scene, camera };
}
