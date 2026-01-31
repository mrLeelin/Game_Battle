/**
 * 材质工具集
 *
 * 提供材质创建、PBR 配置、着色器编写相关的工具
 */

import { createTool, ParamTypes, ToolCategories, generateId } from './tool-base.js';

/**
 * 创建 PBR 材质
 */
const createPbrMaterial = createTool(
  'create_pbr_material',
  '创建 PBR 物理材质',
  ToolCategories.MATERIAL,
  {
    name: { type: ParamTypes.STRING, required: true, description: '材质名称' },
    color: { type: ParamTypes.COLOR, required: false, description: '基础颜色' },
    metalness: { type: ParamTypes.NUMBER, required: false, min: 0, max: 1, description: '金属度' },
    roughness: { type: ParamTypes.NUMBER, required: false, min: 0, max: 1, description: '粗糙度' },
    textures: { type: ParamTypes.OBJECT, required: false, description: '贴图配置' }
  },
  async (params) => {
    const {
      name,
      color = 0xffffff,
      metalness = 0.0,
      roughness = 0.5,
      textures = {}
    } = params;

    const colorStr = typeof color === 'string' ? `'${color}'` : `0x${color.toString(16).padStart(6, '0')}`;

    const code = `
// PBR 材质: ${name}
const textureLoader = new THREE.TextureLoader();

/**
 * 创建 PBR 材质
 */
function create${name}Material(options = {}) {
  const material = new THREE.MeshStandardMaterial({
    name: '${name}',
    color: options.color ?? ${colorStr},
    metalness: options.metalness ?? ${metalness},
    roughness: options.roughness ?? ${roughness},

    // 可选贴图
    ${textures.map ? `map: textureLoader.load('${textures.map}'),` : '// map: textureLoader.load("path/to/diffuse.jpg"),'}
    ${textures.normalMap ? `normalMap: textureLoader.load('${textures.normalMap}'),` : '// normalMap: textureLoader.load("path/to/normal.jpg"),'}
    ${textures.roughnessMap ? `roughnessMap: textureLoader.load('${textures.roughnessMap}'),` : '// roughnessMap: textureLoader.load("path/to/roughness.jpg"),'}
    ${textures.metalnessMap ? `metalnessMap: textureLoader.load('${textures.metalnessMap}'),` : '// metalnessMap: textureLoader.load("path/to/metalness.jpg"),'}
    ${textures.aoMap ? `aoMap: textureLoader.load('${textures.aoMap}'),` : '// aoMap: textureLoader.load("path/to/ao.jpg"),'}
    ${textures.emissiveMap ? `emissiveMap: textureLoader.load('${textures.emissiveMap}'),` : '// emissiveMap: textureLoader.load("path/to/emissive.jpg"),'}

    // 法线贴图强度
    normalScale: new THREE.Vector2(1, 1),

    // 环境光遮蔽强度
    aoMapIntensity: 1.0,

    // 自发光
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 1.0,

    // 透明度
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1.0,

    // 双面渲染
    side: options.side ?? THREE.FrontSide,

    // 平滑着色
    flatShading: options.flatShading ?? false
  });

  return material;
}

/**
 * 材质变体生成器
 */
class MaterialVariantGenerator {
  constructor(baseMaterial) {
    this.baseMaterial = baseMaterial;
    this.variants = new Map();
  }

  /**
   * 创建颜色变体
   */
  createColorVariant(name, color) {
    const variant = this.baseMaterial.clone();
    variant.name = name;
    variant.color.set(color);
    this.variants.set(name, variant);
    return variant;
  }

  /**
   * 创建磨损变体
   */
  createWornVariant(name, wearLevel = 0.5) {
    const variant = this.baseMaterial.clone();
    variant.name = name;
    variant.roughness = Math.min(1, this.baseMaterial.roughness + wearLevel * 0.3);
    variant.metalness = Math.max(0, this.baseMaterial.metalness - wearLevel * 0.2);
    this.variants.set(name, variant);
    return variant;
  }

  /**
   * 获取变体
   */
  getVariant(name) {
    return this.variants.get(name);
  }

  /**
   * 释放所有变体
   */
  dispose() {
    for (const material of this.variants.values()) {
      material.dispose();
    }
    this.variants.clear();
  }
}

// 使用示例
/*
const material = create${name}Material({
  color: 0xff5500,
  metalness: 0.8,
  roughness: 0.2
});

mesh.material = material;

// 创建变体
const generator = new MaterialVariantGenerator(material);
const redVariant = generator.createColorVariant('red', 0xff0000);
const wornVariant = generator.createWornVariant('worn', 0.7);
*/

export { create${name}Material, MaterialVariantGenerator };
`;

    return {
      code: code.trim(),
      description: `创建了 PBR 材质: ${name}`
    };
  }
);

/**
 * 烘焙光照贴图
 */
const bakeLightmap = createTool(
  'bake_lightmap',
  '生成光照贴图烘焙代码',
  ToolCategories.MATERIAL,
  {
    resolution: { type: ParamTypes.NUMBER, required: false, description: '贴图分辨率' },
    samples: { type: ParamTypes.NUMBER, required: false, description: '采样数' }
  },
  async (params) => {
    const {
      resolution = 1024,
      samples = 64
    } = params;

    const code = `
// 光照贴图烘焙系统
// 注意：完整的光照烘焙通常在离线工具中完成
// 这里提供运行时的简化版本

/**
 * 简易光照烘焙器
 * 使用光线追踪计算静态光照
 */
class LightmapBaker {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.resolution = options.resolution || ${resolution};
    this.samples = options.samples || ${samples};
    this.lightmaps = new Map();
  }

  /**
   * 烘焙指定物体的光照
   */
  async bake(mesh) {
    return new Promise((resolve) => {
      // 创建光照贴图
      const canvas = document.createElement('canvas');
      canvas.width = this.resolution;
      canvas.height = this.resolution;
      const ctx = canvas.getContext('2d');

      // 获取 UV2（光照贴图 UV）
      const uv2 = mesh.geometry.attributes.uv2 || mesh.geometry.attributes.uv;
      if (!uv2) {
        console.warn('Mesh needs UV2 for lightmap baking');
        resolve(null);
        return;
      }

      // 获取顶点位置和法线
      const positions = mesh.geometry.attributes.position;
      const normals = mesh.geometry.attributes.normal;

      // 收集场景中的光源
      const lights = [];
      this.scene.traverse((obj) => {
        if (obj.isLight && obj.castShadow) {
          lights.push(obj);
        }
      });

      // 逐像素计算光照
      const imageData = ctx.createImageData(this.resolution, this.resolution);

      for (let y = 0; y < this.resolution; y++) {
        for (let x = 0; x < this.resolution; x++) {
          const u = x / this.resolution;
          const v = 1 - y / this.resolution;

          // 简化：使用顶点插值
          let totalLight = 0.1; // 环境光

          for (const light of lights) {
            if (light.isDirectionalLight) {
              // 平行光：简单的法线点积
              totalLight += Math.max(0, 0.5) * light.intensity;
            } else if (light.isPointLight) {
              // 点光源：距离衰减
              totalLight += light.intensity * 0.3;
            }
          }

          totalLight = Math.min(1, totalLight);

          const idx = (y * this.resolution + x) * 4;
          imageData.data[idx] = totalLight * 255;
          imageData.data[idx + 1] = totalLight * 255;
          imageData.data[idx + 2] = totalLight * 255;
          imageData.data[idx + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // 创建纹理
      const texture = new THREE.CanvasTexture(canvas);
      texture.flipY = false;

      // 应用到材质
      if (mesh.material.lightMap) {
        mesh.material.lightMap.dispose();
      }
      mesh.material.lightMap = texture;
      mesh.material.lightMapIntensity = 1.0;
      mesh.material.needsUpdate = true;

      this.lightmaps.set(mesh.uuid, texture);
      resolve(texture);
    });
  }

  /**
   * 烘焙场景中所有静态物体
   */
  async bakeAll(filter = (mesh) => mesh.userData.static === true) {
    const meshes = [];
    this.scene.traverse((obj) => {
      if (obj.isMesh && filter(obj)) {
        meshes.push(obj);
      }
    });

    const results = [];
    for (const mesh of meshes) {
      const result = await this.bake(mesh);
      results.push({ mesh, lightmap: result });
    }

    return results;
  }

  /**
   * 导出光照贴图
   */
  exportLightmap(mesh, filename) {
    const texture = this.lightmaps.get(mesh.uuid);
    if (!texture) return;

    const canvas = texture.image;
    const link = document.createElement('a');
    link.download = filename || \`lightmap_\${mesh.name}.png\`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  /**
   * 清理资源
   */
  dispose() {
    for (const texture of this.lightmaps.values()) {
      texture.dispose();
    }
    this.lightmaps.clear();
  }
}

// 使用示例
/*
const baker = new LightmapBaker(scene, {
  resolution: ${resolution},
  samples: ${samples}
});

// 标记静态物体
staticMesh.userData.static = true;

// 烘焙所有静态物体
await baker.bakeAll();

// 或烘焙单个物体
await baker.bake(specificMesh);
*/

export { LightmapBaker };
`;

    return {
      code: code.trim(),
      description: `创建了光照贴图烘焙器，分辨率 ${resolution}，采样数 ${samples}`
    };
  }
);

/**
 * 配置阴影
 */
const setupShadows = createTool(
  'setup_shadows',
  '配置场景阴影',
  ToolCategories.MATERIAL,
  {
    type: { type: ParamTypes.STRING, required: false, enum: ['basic', 'pcf', 'pcfsoft', 'vsm'], description: '阴影类型' },
    mapSize: { type: ParamTypes.NUMBER, required: false, description: '阴影贴图尺寸' },
    cascades: { type: ParamTypes.NUMBER, required: false, description: '级联阴影层数' }
  },
  async (params) => {
    const {
      type = 'pcfsoft',
      mapSize = 2048,
      cascades = 3
    } = params;

    const shadowTypeMap = {
      'basic': 'THREE.BasicShadowMap',
      'pcf': 'THREE.PCFShadowMap',
      'pcfsoft': 'THREE.PCFSoftShadowMap',
      'vsm': 'THREE.VSMShadowMap'
    };

    const code = `
// 阴影配置系统

/**
 * 阴影配置器
 */
class ShadowConfigurator {
  constructor(renderer, scene) {
    this.renderer = renderer;
    this.scene = scene;
  }

  /**
   * 配置基础阴影
   */
  setupBasicShadows(options = {}) {
    const {
      type = '${type}',
      mapSize = ${mapSize}
    } = options;

    // 启用阴影
    this.renderer.shadowMap.enabled = true;

    // 阴影类型
    switch (type) {
      case 'basic':
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
        break;
      case 'pcf':
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        break;
      case 'pcfsoft':
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        break;
      case 'vsm':
        this.renderer.shadowMap.type = THREE.VSMShadowMap;
        break;
    }

    // 配置所有光源
    this.scene.traverse((obj) => {
      if (obj.isDirectionalLight || obj.isSpotLight || obj.isPointLight) {
        this.configureLightShadow(obj, mapSize);
      }
    });
  }

  /**
   * 配置光源阴影
   */
  configureLightShadow(light, mapSize) {
    light.castShadow = true;
    light.shadow.mapSize.width = mapSize;
    light.shadow.mapSize.height = mapSize;

    if (light.isDirectionalLight) {
      // 平行光阴影相机
      const d = 50;
      light.shadow.camera.left = -d;
      light.shadow.camera.right = d;
      light.shadow.camera.top = d;
      light.shadow.camera.bottom = -d;
      light.shadow.camera.near = 0.1;
      light.shadow.camera.far = 200;
      light.shadow.bias = -0.0001;
    } else if (light.isSpotLight) {
      // 聚光灯阴影
      light.shadow.camera.near = 0.1;
      light.shadow.camera.far = light.distance || 100;
      light.shadow.bias = -0.0001;
    } else if (light.isPointLight) {
      // 点光源阴影
      light.shadow.camera.near = 0.1;
      light.shadow.camera.far = light.distance || 100;
      light.shadow.bias = -0.001;
    }
  }

  /**
   * 配置级联阴影贴图（CSM）
   * 需要安装: three/examples/jsm/csm/CSM
   */
  setupCascadedShadows(options = {}) {
    const code = \`
import { CSM } from 'three/examples/jsm/csm/CSM';
import { CSMHelper } from 'three/examples/jsm/csm/CSMHelper';

const csm = new CSM({
  maxFar: camera.far,
  cascades: ${cascades},
  mode: 'practical',
  parent: scene,
  shadowMapSize: ${mapSize},
  lightDirection: new THREE.Vector3(-1, -1, -1).normalize(),
  camera: camera
});

// 可选：添加调试辅助
const csmHelper = new CSMHelper(csm);
csmHelper.visible = false;
scene.add(csmHelper);

// 在 update 中更新 CSM
csm.update();

// 窗口大小变化时
csm.updateFrustums();
\`;
    console.log('CSM setup code:\\n', code);
    return code;
  }

  /**
   * 配置物体阴影属性
   */
  configureMeshShadows(options = {}) {
    const {
      castShadow = true,
      receiveShadow = true,
      filter = null
    } = options;

    this.scene.traverse((obj) => {
      if (obj.isMesh) {
        if (filter && !filter(obj)) return;

        obj.castShadow = castShadow;
        obj.receiveShadow = receiveShadow;
      }
    });
  }

  /**
   * 接触阴影（地面贴合阴影）
   */
  createContactShadow(options = {}) {
    const {
      size = 10,
      opacity = 0.5,
      blur = 2,
      resolution = 512
    } = options;

    // 创建阴影接收平面
    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.ShadowMaterial({
      opacity: opacity,
      transparent: true
    });

    const shadowPlane = new THREE.Mesh(geometry, material);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.receiveShadow = true;
    shadowPlane.name = 'contactShadow';

    return shadowPlane;
  }
}

// 使用示例
/*
const shadowConfig = new ShadowConfigurator(renderer, scene);

// 基础阴影配置
shadowConfig.setupBasicShadows({
  type: '${type}',
  mapSize: ${mapSize}
});

// 配置所有网格
shadowConfig.configureMeshShadows({
  castShadow: true,
  receiveShadow: true,
  filter: (mesh) => mesh.name !== 'sky' // 排除天空盒
});

// 添加接触阴影
const contactShadow = shadowConfig.createContactShadow({
  size: 20,
  opacity: 0.4
});
scene.add(contactShadow);
*/

export { ShadowConfigurator };
`;

    return {
      code: code.trim(),
      description: `配置了 ${type} 类型阴影，贴图尺寸 ${mapSize}`
    };
  }
);

// ============================================================
// 导出工具集
// ============================================================

export const materialTools = {
  create_pbr_material: createPbrMaterial,
  bake_lightmap: bakeLightmap,
  setup_shadows: setupShadows
};
