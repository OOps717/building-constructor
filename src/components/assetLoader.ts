import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";

const loader = new OBJLoader();

async function loadObjFromURL(url: string): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
}

export async function setObj(
  name: string,
  objModulesRef: React.RefObject<Record<string, string>>,
  objCacheRef: React.RefObject<Map<string, THREE.Group>>,
) {
  const url = objModulesRef.current[name];
  if (!url) return;

  if (objCacheRef.current.has(name)) return;
  const obj = await loadObjFromURL(url);
  objCacheRef.current.set(name, obj);
}

export async function getObj(
  name: string,
  objCacheRef: React.RefObject<Map<string, THREE.Group>>,
): Promise<THREE.Group | null> {
  return await objCacheRef.current.get(name)!.clone(true);
}
