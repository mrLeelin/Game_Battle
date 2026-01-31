/**
 * 模型工具集
 *
 * 提供 3D 模型加载、优化、LOD 配置相关的工具
 */

import { createTool, ParamTypes, ToolCategories, generateId } from './tool-base.js';

/**
 * 加载 3D 模型
 */
const loadModel = createTool(
  'load_model',
  '加载 3D 模型（支持 GLB/GLTF/FBX/OBJ）',
  ToolCategories.MODEL,
  {
    url: { type: ParamTypes.STRING, required: true, description: '模型文件 URL' },
    format: { type: ParamTypes.STRING, required: false, enum: ['gltf', 'glb', 'fbx', 'obj'], description: '模型格式' },
    position: { type: ParamTypes.VECTOR3, required: false, description: '初始位置' },
    scale: { type: ParamTypes.NUMBER, required: false, description: '缩放比例' },
    castShadow: { type: ParamTypes.BOOLEAN, required: false, description: '投射阴影' },
    receiveShadow: { type: ParamTypes.BOOLEAN, required: false, description: '接收阴影' }
  },
  async (params) => {
    const {
      url,
      format = 'gltf',
      position = { x: 0, y: 0, z: 0 },
      scale = 1,
      castShadow = true,
      receiveShadow = true
    } = params;

    const modelId = generateId('model');
    let code = '';

    switch (format) {
      case 'gltf':
      case 'glb':
        code = `
// 加载 GLTF/GLB 模型
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

const gltfLoader = new GLTFLoader();

// 可选：配置 DRACO 解压（用于压缩模型）
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
gltfLoader.setDRACOLoader(dracoLoader);

gltfLoader.load(
  '${url}',
  (gltf) => {
    const model = gltf.scene;
    model.name = '${modelId}';
    model.position.set(${position.x}, ${position.y}, ${position.z});
    model.scale.setScalar(${scale});

    // 设置阴影
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = ${castShadow};
        child.receiveShadow = ${receiveShadow};
      }
    });

    this.scene.add(model);

    // 存储动画（如果有）
    if (gltf.animations.length > 0) {
      this.mixer = new THREE.AnimationMixer(model);
      this.animations = gltf.animations;
    }

    console.log('Model loaded: ${modelId}');
  },
  (progress) => {
    console.log('Loading progress:', (progress.loaded / progress.total * 100).toFixed(2) + '%');
  },
  (error) => {
    console.error('Error loading model:', error);
  }
);
`;
        break;

      case 'fbx':
        code = `
// 加载 FBX 模型
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

const fbxLoader = new FBXLoader();
fbxLoader.load(
  '${url}',
  (fbx) => {
    fbx.name = '${modelId}';
    fbx.position.set(${position.x}, ${position.y}, ${position.z});
    fbx.scale.setScalar(${scale});

    // 设置阴影
    fbx.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = ${castShadow};
        child.receiveShadow = ${receiveShadow};
      }
    });

    this.scene.add(fbx);

    // 存储动画（如果有）
    if (fbx.animations.length > 0) {
      this.mixer = new THREE.AnimationMixer(fbx);
      this.animations = fbx.animations;
    }

    console.log('FBX Model loaded: ${modelId}');
  },
  (progress) => {
    console.log('Loading progress:', (progress.loaded / progress.total * 100).toFixed(2) + '%');
  },
  (error) => {
    console.error('Error loading FBX:', error);
  }
);
`;
        break;

      case 'obj':
        code = `
// 加载 OBJ 模型
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';

// 如果有 MTL 材质文件
const mtlUrl = '${url.replace('.obj', '.mtl')}';

const mtlLoader = new MTLLoader();
mtlLoader.load(mtlUrl, (materials) => {
  materials.preload();

  const objLoader = new OBJLoader();
  objLoader.setMaterials(materials);

  objLoader.load(
    '${url}',
    (obj) => {
      obj.name = '${modelId}';
      obj.position.set(${position.x}, ${position.y}, ${position.z});
      obj.scale.setScalar(${scale});

      obj.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = ${castShadow};
          child.receiveShadow = ${receiveShadow};
        }
      });

      this.scene.add(obj);
      console.log('OBJ Model loaded: ${modelId}');
    }
  );
}, undefined, () => {
  // 如果没有 MTL 文件，直接加载 OBJ
  const objLoader = new OBJLoader();
  objLoader.load('${url}', (obj) => {
    obj.name = '${modelId}';
    obj.position.set(${position.x}, ${position.y}, ${position.z});
    obj.scale.setScalar(${scale});
    this.scene.add(obj);
  });
});
`;
        break;
    }

    return {
      code: code.trim(),
      modelId,
      description: `加载 ${format.toUpperCase()} 模型: ${url}`
    };
  }
);

/**
 * 优化模型
 */
const optimizeModel = createTool(
  'optimize_model',
  '优化 3D 模型（减面、合并网格、实例化）',
  ToolCategories.MODEL,
  {
    operation: { type: ParamTypes.STRING, required: true, enum: ['simplify', 'merge', 'instance', 'dispose'], description: '优化操作' },
    targetRatio: { type: ParamTypes.NUMBER, required: false, min: 0.1, max: 1, description: '目标面数比例（简化时）' },
    modelName: { type: ParamTypes.STRING, required: false, description: '模型名称' }
  },
  async (params) => {
    const {
      operation,
      targetRatio = 0.5,
      modelName = 'model'
    } = params;

    let code = '';

    switch (operation) {
      case 'simplify':
        code = `
// 模型简化（减面）
import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier';

function simplifyModel(model, ratio = ${targetRatio}) {
  const modifier = new SimplifyModifier();

  model.traverse((child) => {
    if (child.isMesh && child.geometry) {
      const originalCount = child.geometry.attributes.position.count;
      const targetCount = Math.floor(originalCount * ratio);

      if (targetCount > 0) {
        const simplified = modifier.modify(child.geometry, targetCount);
        child.geometry.dispose();
        child.geometry = simplified;
      }
    }
  });

  console.log('Model simplified to', (ratio * 100).toFixed(0) + '% of original');
}

// 使用
const model = this.scene.getObjectByName('${modelName}');
if (model) {
  simplifyModel(model, ${targetRatio});
}
`;
        break;

      case 'merge':
        code = `
// 合并网格（减少 Draw Call）
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';

function mergeModelMeshes(model) {
  const geometries = [];
  const materials = [];

  model.traverse((child) => {
    if (child.isMesh) {
      // 克隆几何体并应用变换
      const geometry = child.geometry.clone();
      geometry.applyMatrix4(child.matrixWorld);
      geometries.push(geometry);
      materials.push(child.material);
    }
  });

  if (geometries.length === 0) return null;

  // 合并几何体
  const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries, true);

  // 创建合并后的网格
  const mergedMesh = new THREE.Mesh(mergedGeometry, materials);
  mergedMesh.castShadow = true;
  mergedMesh.receiveShadow = true;

  // 清理原始网格
  model.traverse((child) => {
    if (child.isMesh) {
      child.geometry.dispose();
    }
  });

  return mergedMesh;
}

// 使用
const model = this.scene.getObjectByName('${modelName}');
if (model) {
  const mergedMesh = mergeModelMeshes(model);
  if (mergedMesh) {
    this.scene.remove(model);
    this.scene.add(mergedMesh);
    console.log('Model meshes merged');
  }
}
`;
        break;

      case 'instance':
        code = `
// 实例化渲染（大量相同物体）
function createInstancedMesh(geometry, material, count, positions) {
  const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
  instancedMesh.castShadow = true;
  instancedMesh.receiveShadow = true;

  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const rotation = new THREE.Euler();
  const scale = new THREE.Vector3(1, 1, 1);
  const quaternion = new THREE.Quaternion();

  for (let i = 0; i < count; i++) {
    position.set(
      positions[i]?.x || (Math.random() - 0.5) * 100,
      positions[i]?.y || 0,
      positions[i]?.z || (Math.random() - 0.5) * 100
    );

    rotation.set(0, Math.random() * Math.PI * 2, 0);
    quaternion.setFromEuler(rotation);

    matrix.compose(position, quaternion, scale);
    instancedMesh.setMatrixAt(i, matrix);
  }

  instancedMesh.instanceMatrix.needsUpdate = true;
  return instancedMesh;
}

// 使用示例
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const positions = []; // 填入位置数组
const instancedMesh = createInstancedMesh(geometry, material, 1000, positions);
this.scene.add(instancedMesh);
`;
        break;

      case 'dispose':
        code = `
// 释放模型资源
function disposeModel(model) {
  model.traverse((child) => {
    if (child.isMesh) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => {
            disposeMaterial(m);
          });
        } else {
          disposeMaterial(child.material);
        }
      }
    }
  });

  model.parent?.remove(model);
  console.log('Model disposed');
}

function disposeMaterial(material) {
  material.dispose();

  // 释放贴图
  for (const key of Object.keys(material)) {
    const value = material[key];
    if (value && value.isTexture) {
      value.dispose();
    }
  }
}

// 使用
const model = this.scene.getObjectByName('${modelName}');
if (model) {
  disposeModel(model);
}
`;
        break;
    }

    return {
      code: code.trim(),
      description: `模型优化操作: ${operation}`
    };
  }
);

/**
 * 配置 LOD
 */
const setupLod = createTool(
  'setup_lod',
  '配置 LOD（Level of Detail）层级',
  ToolCategories.MODEL,
  {
    levels: { type: ParamTypes.ARRAY, required: true, description: 'LOD 层级配置 [{distance, model}]' },
    modelName: { type: ParamTypes.STRING, required: false, description: '模型名称' }
  },
  async (params) => {
    const {
      levels = [
        { distance: 0, detail: 'high' },
        { distance: 50, detail: 'medium' },
        { distance: 100, detail: 'low' }
      ],
      modelName = 'model'
    } = params;

    const code = `
// LOD（细节层次）配置
const lod = new THREE.LOD();

// 高精度模型（近距离）
const highDetailGeometry = new THREE.BoxGeometry(1, 1, 1, 16, 16, 16);
const highDetailMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const highDetailMesh = new THREE.Mesh(highDetailGeometry, highDetailMaterial);
lod.addLevel(highDetailMesh, ${levels[0]?.distance || 0});

// 中等精度模型
const mediumDetailGeometry = new THREE.BoxGeometry(1, 1, 1, 8, 8, 8);
const mediumDetailMaterial = new THREE.MeshStandardMaterial({ color: 0x00dd00 });
const mediumDetailMesh = new THREE.Mesh(mediumDetailGeometry, mediumDetailMaterial);
lod.addLevel(mediumDetailMesh, ${levels[1]?.distance || 50});

// 低精度模型（远距离）
const lowDetailGeometry = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2);
const lowDetailMaterial = new THREE.MeshStandardMaterial({ color: 0x00bb00 });
const lowDetailMesh = new THREE.Mesh(lowDetailGeometry, lowDetailMaterial);
lod.addLevel(lowDetailMesh, ${levels[2]?.distance || 100});

lod.name = '${modelName}_lod';
this.scene.add(lod);

// 在 update 中更新 LOD
// lod.update(this.camera);

/**
 * LOD 辅助函数
 */
class LODManager {
  constructor() {
    this.lods = [];
  }

  add(lod) {
    this.lods.push(lod);
  }

  update(camera) {
    for (const lod of this.lods) {
      lod.update(camera);
    }
  }

  remove(lod) {
    const index = this.lods.indexOf(lod);
    if (index > -1) {
      this.lods.splice(index, 1);
    }
  }
}
`;

    return {
      code: code.trim(),
      description: `配置了 ${levels.length} 级 LOD`
    };
  }
);

// ============================================================
// 导出工具集
// ============================================================

export const modelTools = {
  load_model: loadModel,
  optimize_model: optimizeModel,
  setup_lod: setupLod
};
