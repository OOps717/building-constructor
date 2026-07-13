import * as THREE from "three";

const SHADOW_SIZE = 1024;

export default class ShadowTextureManager {
  light!: THREE.DirectionalLight;
  lightCamera!: THREE.OrthographicCamera;

  shadowTarget: THREE.WebGLRenderTarget;
  depthMaterial: THREE.MeshDepthMaterial;

  depthBuffer: Uint8Array;
  lightViewProj: THREE.Matrix4;

  private tmpVec4 = new THREE.Vector4();
  private originalClearColor = new THREE.Color();

  constructor() {
    this.shadowTarget = new THREE.WebGLRenderTarget(SHADOW_SIZE, SHADOW_SIZE, {
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: true,
    });

    this.depthMaterial = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
    });

    this.depthBuffer = new Uint8Array(SHADOW_SIZE * SHADOW_SIZE * 4);
    this.lightViewProj = new THREE.Matrix4();

    // this.updateLightMatrices();
  }

  setLight(light: THREE.DirectionalLight) {
    this.light = light;
    this.lightCamera = light.shadow.camera as THREE.OrthographicCamera;
    this.updateLightMatrices();
  }

  updateLightMatrices() {
    this.light.shadow.updateMatrices(this.light);
    this.lightCamera.updateMatrixWorld(true);

    this.lightViewProj
      .copy(this.lightCamera.projectionMatrix)
      .multiply(this.lightCamera.matrixWorldInverse);
  }

  renderShadowTexture(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    if (!this.light || !this.lightCamera) return;

    this.updateLightMatrices();

    const originalMaterials = new Map<
      THREE.Mesh,
      THREE.Material | THREE.Material[]
    >();
    const originalRenderTarget = renderer.getRenderTarget();
    const originalClearAlpha = renderer.getClearAlpha();

    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.castShadow) {
        originalMaterials.set(obj, obj.material);
        obj.material = this.depthMaterial;
      }
    });

    renderer.getClearColor(this.originalClearColor);
    renderer.setClearColor(0xffffff, 1);
    renderer.setRenderTarget(this.shadowTarget);
    renderer.clear();
    renderer.render(scene, this.lightCamera);
    renderer.setRenderTarget(originalRenderTarget);
    renderer.setClearColor(this.originalClearColor, originalClearAlpha);

    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.castShadow) {
        const original = originalMaterials.get(obj);
        if (original) obj.material = original;
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
    this.tmpVec4.set(worldPos.x, worldPos.y, worldPos.z, 1.0);
    this.tmpVec4.applyMatrix4(this.lightViewProj);

    if (this.tmpVec4.w !== 0) this.tmpVec4.divideScalar(this.tmpVec4.w);

    return {
      u: this.tmpVec4.x * 0.5 + 0.5,
      v: this.tmpVec4.y * 0.5 + 0.5,
      depth: this.tmpVec4.z * 0.5 + 0.5,
    };
  }

  getDepthAt(x: number, y: number): number {
    const i = (y * SHADOW_SIZE + x) * 4;

    const r = this.depthBuffer[i + 0] / 255;
    const g = this.depthBuffer[i + 1] / 255;
    const b = this.depthBuffer[i + 2] / 255;
    const a = this.depthBuffer[i + 3] / 255;

    // ⭐ Правильная распаковка RGBADepthPacking
    return r + g / 256.0 + b / (256.0 * 256.0) + a / (256.0 * 256.0 * 256.0);
  }

  isInShadow(worldPos: THREE.Vector3, bias = 0.003): boolean {
    const uvz = this.worldToShadowUV(worldPos);

    if (uvz.u < 0 || uvz.u > 1 || uvz.v < 0 || uvz.v > 1) return false;

    const x = Math.min(SHADOW_SIZE - 1, (uvz.u * SHADOW_SIZE) | 0);
    const y = Math.min(SHADOW_SIZE - 1, (uvz.v * SHADOW_SIZE) | 0);

    const yFlipped = SHADOW_SIZE - 1 - y;

    const mapDepth = this.getDepthAt(x, yFlipped);

    return uvz.depth > mapDepth + bias;
  }
}
