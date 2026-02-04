import * as THREE from "three";

const SHADOW_SIZE = 1024;

export default class ShadowTextureManager {
  lightCamera: THREE.OrthographicCamera;
  shadowTarget: THREE.WebGLRenderTarget;
  shadowMaterial: THREE.ShaderMaterial;

  depthBuffer: Uint8Array;
  lightViewProj: THREE.Matrix4;

  constructor() {
    this.lightCamera = new THREE.OrthographicCamera(
      -100,
      100,
      100,
      -100,
      0.1,
      200,
    );
    this.lightCamera.position.set(10, 10, 10);
    this.lightCamera.lookAt(0, 0, 0);
    this.lightCamera.updateMatrixWorld(true);

    this.shadowTarget = new THREE.WebGLRenderTarget(SHADOW_SIZE, SHADOW_SIZE, {
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: true,
    });

    this.shadowMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec4 vLightPos;

        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vLightPos = projectionMatrix * viewMatrix * worldPos;
          gl_Position = vLightPos;
        }
      `,
      fragmentShader: `
        precision highp float;

        varying vec4 vLightPos;

        void main() {
          float depth = vLightPos.z / vLightPos.w; // NDC [-1,1]
          depth = depth * 0.5 + 0.5;               // [0,1]
          gl_FragColor = vec4(depth, depth, depth, 1.0);
        }
      `,
    });

    this.depthBuffer = new Uint8Array(SHADOW_SIZE * SHADOW_SIZE * 4);

    this.lightViewProj = new THREE.Matrix4();
    this.updateLightMatrices();
  }

  updateLightMatrices() {
    this.lightCamera.updateMatrixWorld(true);
    this.lightViewProj
      .copy(this.lightCamera.projectionMatrix)
      .multiply(this.lightCamera.matrixWorldInverse);
  }

  renderShadowTexture(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.updateLightMatrices();
    const originalMaterials = new Map<
      THREE.Mesh,
      THREE.Material | THREE.Material[]
    >();

    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.castShadow) {
        originalMaterials.set(obj, obj.material);
        obj.material = this.shadowMaterial;
      }
    });

    renderer.setRenderTarget(this.shadowTarget);
    renderer.clear();
    renderer.render(scene, this.lightCamera);
    renderer.setRenderTarget(null);

    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.castShadow) {
        obj.material = originalMaterials.get(obj);
      }
    });

    renderer.readRenderTargetPixels(
      this.shadowTarget,
      0,
      0,
      SHADOW_SIZE,
      SHADOW_SIZE,
      this.depthBuffer,
    );
  }

  worldToShadowUV(worldPos: THREE.Vector3) {
    const p = new THREE.Vector4(worldPos.x, worldPos.y, worldPos.z, 1.0);

    p.applyMatrix4(this.lightViewProj);
    p.divideScalar(p.w);

    return {
      u: p.x * 0.5 + 0.5,
      v: p.y * 0.5 + 0.5,
      depth: p.z * 0.5 + 0.5,
    };
  }

  getDepthAt(x: number, y: number): number {
    const index = (y * SHADOW_SIZE + x) * 4;
    return this.depthBuffer[index] / 255.0;
  }

  isInShadow(worldPos: THREE.Vector3, bias = 0.03): boolean {
    const uvz = this.worldToShadowUV(worldPos);

    // Outside shadow map
    if (
      uvz.u < 0 ||
      uvz.u > 1 ||
      uvz.v < 0 ||
      uvz.v > 1 ||
      uvz.depth < 0 ||
      uvz.depth > 1
    ) {
      return false;
    }

    const x = Math.min(SHADOW_SIZE - 1, Math.floor(uvz.u * SHADOW_SIZE));
    const y = Math.min(SHADOW_SIZE - 1, Math.floor(uvz.v * SHADOW_SIZE));
    const yFlipped = SHADOW_SIZE - 1 - y;

    const depthFromMap = this.getDepthAt(x, yFlipped);
    return uvz.depth > depthFromMap + bias;
  }
}
