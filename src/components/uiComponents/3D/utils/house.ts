import * as THREE from "three";

const SHADOW_SIZE = 1024;

interface HouseInterface {
  houseSize?: THREE.Vector3;
  roofSize?: THREE.Vector2; // x = radius, y = height
  roofEdges?: number;
}

export default class House extends THREE.Object3D {
  houseSize: THREE.Vector3;
  roofSize: THREE.Vector2;
  roofEdges: number;
  roofBottomPoints: THREE.Vector3[];
  house: THREE.Mesh;
  roof: THREE.Mesh;
  panels: THREE.Mesh[];

  constructor(params: HouseInterface = {}) {
    super();

    this.houseSize = params.houseSize ?? new THREE.Vector3(6, 4, 6);
    this.roofSize = params.roofSize ?? new THREE.Vector2(5, 3);
    this.roofEdges = params.roofEdges ?? 4;

    const houseGeometry = new THREE.BoxGeometry(
      this.houseSize.x,
      this.houseSize.y,
      this.houseSize.z,
    );

    const houseMaterial = new THREE.MeshStandardMaterial({
      color: 0xffe4c4,
    });

    this.house = new THREE.Mesh(houseGeometry, houseMaterial);
    this.house.position.y = this.houseSize.y / 2;
    this.house.castShadow = true;
    this.house.receiveShadow = true;
    this.house.userData.editable = true;
    this.add(this.house);

    const roofGeometry = new THREE.CylinderGeometry(
      0,
      this.roofSize.x,
      this.roofSize.y,
      this.roofEdges,
    );
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b0000,
    });

    this.roof = new THREE.Mesh(roofGeometry, roofMaterial);
    this.roof.position.y = this.houseSize.y / 2 + this.roofSize.y / 2;
    this.roof.rotation.y = Math.PI / 4; // align pyramid faces with house diagonals
    this.roof.castShadow = true;
    this.roof.receiveShadow = true;
    this.house.add(this.roof);

    this.roofBottomPoints = this.computeRoofContourPoints(
      this.roofSize.x,
      this.roofSize.y,
      this.roofEdges,
    );

    const maxOffset = this.roofSize.x / 2;

    this.panels = [];
    // this.createPanelOnRoof(
    //   new THREE.Vector3(maxOffset, -this.roofSize.y / 2, -maxOffset),
    //   this.roofSize.y * 0.5,
    // );
    this.createPanelOnRoof(
      new THREE.Vector3(maxOffset, -this.roofSize.y / 2, maxOffset),
      this.roofSize.y * 0.5,
    );
  }

  computeRoofContourPoints(radius: number, height: number, segments: number) {
    const bottomY = -height / 2;
    const contourPoints: THREE.Vector3[] = [];

    for (let i = 0; i < segments; i++) {
      const angle = (2 * Math.PI * i) / segments;

      const p = new THREE.Vector3(
        radius * Math.cos(angle),
        bottomY,
        radius * Math.sin(angle),
      );
      contourPoints.push(p);
    }

    return contourPoints;
  }

  createPanelOnRoof(pointOnLowerEdge: THREE.Vector3, height: number) {
    const panelGeometry = new THREE.PlaneGeometry(2.2, 1.2, 1, 1);
    const points = panelGeometry.getAttribute("position");
    const vertexCount = points.count;
    const colors = new Float32Array(vertexCount * 3);

    const color = new THREE.Color(0x1e2a5a);
    for (let i = 0; i < vertexCount; i++) {
      colors[i * 3 + 0] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    panelGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const panelMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      metalness: 0.6,
      roughness: 0.25,
      side: THREE.DoubleSide,
    });
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.copy(pointOnLowerEdge);
    panel.receiveShadow = true;

    const topPoint = new THREE.Vector3(0, this.roofSize.y / 2, 0);

    const slopeVector = new THREE.Vector3()
      .subVectors(topPoint, pointOnLowerEdge)
      .normalize();

    const edgeVector = this.findEdgeForPoint(pointOnLowerEdge);
    if (!edgeVector) return null;

    const calculatedNormal = new THREE.Vector3()
      .crossVectors(edgeVector, slopeVector)
      .normalize();

    if (calculatedNormal) {
      const zAxis = calculatedNormal.clone().normalize();
      const xAxis = edgeVector.clone().normalize();
      const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis).normalize();

      const basis = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);

      panel.quaternion.setFromRotationMatrix(basis);

      panel.position.addScaledVector(zAxis, -0.002);
      panel.position.add(slopeVector.multiplyScalar(height));
    }

    this.roof.add(panel);
    this.panels.push(panel);
  }

  findEdgeForPoint(pointOnEdge: THREE.Vector3): THREE.Vector3 | null {
    const tolerance = 1e-4;
    const count = this.roofBottomPoints.length;

    for (let i = 0; i < count; i++) {
      const a = this.roofBottomPoints[i];
      const b = this.roofBottomPoints[(i + 1) % count];

      const edge = new THREE.Vector3().subVectors(b, a);
      const ap = new THREE.Vector3().subVectors(pointOnEdge, a);

      if (edge.clone().cross(ap).lengthSq() > tolerance) continue;
      const dot = ap.dot(edge);
      if (dot < -tolerance || dot > edge.lengthSq() + tolerance) continue;

      return edge.normalize();
    }
    return null;
  }
}
