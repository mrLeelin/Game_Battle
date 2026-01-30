/**
 * 场景工具集
 *
 * 提供 3D 场景创建、管理、配置相关的工具
 */

import { createTool, ParamTypes, ToolCategories, renderTemplate, generateId } from './tool-base.js';

// ============================================================
// 场景模板
// ============================================================

const SCENE_TEMPLATES = {
  basic: `
import * as THREE from 'three';

export class {{sceneName}} {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    this.init();
  }

  init() {
    this.setupCamera();
    this.setupRenderer();
    this.setupLights();
    this.setupEnvironment();

    window.addEventListener('resize', () => this.onResize());
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      {{fov}},
      window.innerWidth / window.innerHeight,
      {{near}},
      {{far}}
    );
    this.camera.position.set({{cameraX}}, {{cameraY}}, {{cameraZ}});
    this.camera.lookAt(0, 0, 0);
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: {{antialias}},
      alpha: {{alpha}}
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = {{shadows}};
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.container.appendChild(this.renderer.domElement);
  }

  setupLights() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0x{{ambientColor}}, {{ambientIntensity}});
    this.scene.add(ambientLight);

    // 主光源
    const mainLight = new THREE.DirectionalLight(0x{{mainLightColor}}, {{mainLightIntensity}});
    mainLight.position.set(50, 50, 50);
    mainLight.castShadow = {{shadows}};
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 500;
    mainLight.shadow.camera.left = -100;
    mainLight.shadow.camera.right = 100;
    mainLight.shadow.camera.top = 100;
    mainLight.shadow.camera.bottom = -100;
    this.scene.add(mainLight);
  }

  setupEnvironment() {
    {{environmentCode}}
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  update(delta) {
    // 游戏逻辑更新
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();
    this.update(delta);
    this.render();
  }

  start() {
    this.animate();
  }

  dispose() {
    this.renderer.dispose();
    this.scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(m => m.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
}
`,

  outdoor: `
// 户外场景 - 包含地形、天空、雾效
setupEnvironment() {
  // 天空
  const sky = new THREE.Color(0x87CEEB);
  this.scene.background = sky;

  // 雾效
  this.scene.fog = new THREE.Fog(0x87CEEB, 100, 500);

  // 地面
  const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x3d6b3d,
    roughness: 0.8,
    metalness: 0.2
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  this.scene.add(ground);

  // 添加网格辅助线（开发用）
  const gridHelper = new THREE.GridHelper(1000, 100, 0x000000, 0x444444);
  gridHelper.material.opacity = 0.2;
  gridHelper.material.transparent = true;
  this.scene.add(gridHelper);
}
`,

  indoor: `
// 室内场景 - 包含房间、室内光照
setupEnvironment() {
  // 背景色
  this.scene.background = new THREE.Color(0x1a1a2e);

  // 地板
  const floorGeometry = new THREE.PlaneGeometry(20, 20);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d2d2d,
    roughness: 0.5,
    metalness: 0.3
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  this.scene.add(floor);

  // 墙壁
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x3d3d3d,
    roughness: 0.7,
    metalness: 0.1
  });

  // 后墙
  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 5),
    wallMaterial
  );
  backWall.position.set(0, 2.5, -10);
  backWall.receiveShadow = true;
  this.scene.add(backWall);

  // 点光源（模拟室内照明）
  const pointLight = new THREE.PointLight(0xffffff, 1, 20);
  pointLight.position.set(0, 4, 0);
  pointLight.castShadow = true;
  this.scene.add(pointLight);
}
`,

  space: `
// 太空场景 - 星空背景、无重力
setupEnvironment() {
  // 星空背景
  this.scene.background = new THREE.Color(0x000011);

  // 创建星星
  const starsGeometry = new THREE.BufferGeometry();
  const starCount = 10000;
  const positions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 2000;
    positions[i + 1] = (Math.random() - 0.5) * 2000;
    positions[i + 2] = (Math.random() - 0.5) * 2000;
  }

  starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    sizeAttenuation: true
  });

  const stars = new THREE.Points(starsGeometry, starsMaterial);
  this.scene.add(stars);

  // 环境光（微弱）
  const ambientLight = new THREE.AmbientLight(0x111122, 0.3);
  this.scene.add(ambientLight);
}
`
};

// ============================================================
// 工具定义
// ============================================================

/**
 * 创建场景
 */
const createScene = createTool(
  'create_scene',
  '创建一个新的 3D 场景',
  ToolCategories.SCENE,
  {
    sceneName: { type: ParamTypes.STRING, required: true, description: '场景类名' },
    template: { type: ParamTypes.STRING, required: false, enum: ['basic', 'outdoor', 'indoor', 'space'], description: '场景模板' },
    fov: { type: ParamTypes.NUMBER, required: false, min: 30, max: 120, description: '相机视角' },
    near: { type: ParamTypes.NUMBER, required: false, description: '近裁剪面' },
    far: { type: ParamTypes.NUMBER, required: false, description: '远裁剪面' },
    cameraPosition: { type: ParamTypes.VECTOR3, required: false, description: '相机位置' },
    antialias: { type: ParamTypes.BOOLEAN, required: false, description: '抗锯齿' },
    shadows: { type: ParamTypes.BOOLEAN, required: false, description: '阴影' }
  },
  async (params) => {
    const {
      sceneName = 'GameScene',
      template = 'basic',
      fov = 75,
      near = 0.1,
      far = 1000,
      cameraPosition = { x: 0, y: 5, z: 10 },
      antialias = true,
      shadows = true
    } = params;

    // 获取环境代码
    let environmentCode = '// 默认环境';
    if (template !== 'basic' && SCENE_TEMPLATES[template]) {
      environmentCode = SCENE_TEMPLATES[template]
        .replace('setupEnvironment() {', '')
        .replace(/}$/, '')
        .trim();
    }

    // 渲染模板
    const code = renderTemplate(SCENE_TEMPLATES.basic, {
      sceneName,
      fov: fov.toString(),
      near: near.toString(),
      far: far.toString(),
      cameraX: cameraPosition.x.toString(),
      cameraY: cameraPosition.y.toString(),
      cameraZ: cameraPosition.z.toString(),
      antialias: antialias.toString(),
      alpha: 'false',
      shadows: shadows.toString(),
      ambientColor: '404040',
      ambientIntensity: '0.5',
      mainLightColor: 'ffffff',
      mainLightIntensity: '1',
      environmentCode
    });

    return {
      code,
      filename: `${sceneName}.js`,
      description: `创建了 ${template} 类型的场景: ${sceneName}`
    };
  }
);

/**
 * 添加地形
 */
const addTerrain = createTool(
  'add_terrain',
  '添加地形到场景',
  ToolCategories.SCENE,
  {
    type: { type: ParamTypes.STRING, required: false, enum: ['flat', 'heightmap', 'procedural'], description: '地形类型' },
    size: { type: ParamTypes.NUMBER, required: false, description: '地形尺寸' },
    segments: { type: ParamTypes.NUMBER, required: false, description: '细分数量' },
    heightmapUrl: { type: ParamTypes.STRING, required: false, description: '高度图 URL' },
    maxHeight: { type: ParamTypes.NUMBER, required: false, description: '最大高度' }
  },
  async (params) => {
    const {
      type = 'flat',
      size = 500,
      segments = 128,
      heightmapUrl = '',
      maxHeight = 50
    } = params;

    let code = '';

    switch (type) {
      case 'flat':
        code = `
// 平坦地形
const terrainGeometry = new THREE.PlaneGeometry(${size}, ${size}, ${segments}, ${segments});
const terrainMaterial = new THREE.MeshStandardMaterial({
  color: 0x3d6b3d,
  roughness: 0.8,
  metalness: 0.1
});
const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
terrain.rotation.x = -Math.PI / 2;
terrain.receiveShadow = true;
this.scene.add(terrain);
`;
        break;

      case 'heightmap':
        code = `
// 高度图地形
const loader = new THREE.TextureLoader();
loader.load('${heightmapUrl}', (texture) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = texture.image.width;
  canvas.height = texture.image.height;
  ctx.drawImage(texture.image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const terrainGeometry = new THREE.PlaneGeometry(${size}, ${size}, ${segments}, ${segments});
  const vertices = terrainGeometry.attributes.position.array;

  for (let i = 0, j = 0; i < vertices.length; i += 3, j++) {
    const x = Math.floor((j % (${segments} + 1)) / (${segments} + 1) * canvas.width);
    const y = Math.floor(j / (${segments} + 1) / (${segments} + 1) * canvas.height);
    const idx = (y * canvas.width + x) * 4;
    vertices[i + 2] = (imageData.data[idx] / 255) * ${maxHeight};
  }

  terrainGeometry.computeVertexNormals();

  const terrainMaterial = new THREE.MeshStandardMaterial({
    color: 0x3d6b3d,
    roughness: 0.8
  });
  const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
  terrain.rotation.x = -Math.PI / 2;
  terrain.receiveShadow = true;
  this.scene.add(terrain);
});
`;
        break;

      case 'procedural':
        code = `
// 程序化地形（使用噪声）
import { createNoise2D } from 'simplex-noise';

const noise2D = createNoise2D();
const terrainGeometry = new THREE.PlaneGeometry(${size}, ${size}, ${segments}, ${segments});
const vertices = terrainGeometry.attributes.position.array;

for (let i = 0; i < vertices.length; i += 3) {
  const x = vertices[i];
  const y = vertices[i + 1];

  // 多层噪声叠加
  let height = 0;
  height += noise2D(x * 0.01, y * 0.01) * ${maxHeight};
  height += noise2D(x * 0.02, y * 0.02) * ${maxHeight * 0.5};
  height += noise2D(x * 0.05, y * 0.05) * ${maxHeight * 0.25};

  vertices[i + 2] = height;
}

terrainGeometry.computeVertexNormals();

const terrainMaterial = new THREE.MeshStandardMaterial({
  color: 0x3d6b3d,
  roughness: 0.8,
  flatShading: true
});
const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
terrain.rotation.x = -Math.PI / 2;
terrain.receiveShadow = true;
this.scene.add(terrain);
`;
        break;
    }

    return {
      code: code.trim(),
      description: `添加了 ${type} 类型的地形，尺寸 ${size}x${size}`
    };
  }
);

/**
 * 配置天空盒
 */
const setupSkybox = createTool(
  'setup_skybox',
  '配置天空盒',
  ToolCategories.SCENE,
  {
    type: { type: ParamTypes.STRING, required: false, enum: ['color', 'cubemap', 'hdr', 'procedural'], description: '天空盒类型' },
    color: { type: ParamTypes.COLOR, required: false, description: '背景颜色' },
    urls: { type: ParamTypes.ARRAY, required: false, description: 'CubeMap 六面图片 URL' },
    hdrUrl: { type: ParamTypes.STRING, required: false, description: 'HDR 贴图 URL' }
  },
  async (params) => {
    const {
      type = 'color',
      color = 0x87CEEB,
      urls = [],
      hdrUrl = ''
    } = params;

    let code = '';

    switch (type) {
      case 'color':
        code = `
// 纯色背景
this.scene.background = new THREE.Color(${typeof color === 'string' ? `'${color}'` : color});
`;
        break;

      case 'cubemap':
        code = `
// CubeMap 天空盒
const cubeTextureLoader = new THREE.CubeTextureLoader();
const environmentMap = cubeTextureLoader.load([
  ${urls.map(url => `'${url}'`).join(',\n  ')}
]);
this.scene.background = environmentMap;
this.scene.environment = environmentMap; // 用于环境反射
`;
        break;

      case 'hdr':
        code = `
// HDR 环境贴图
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

const rgbeLoader = new RGBELoader();
rgbeLoader.load('${hdrUrl}', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  this.scene.background = texture;
  this.scene.environment = texture;
});
`;
        break;

      case 'procedural':
        code = `
// 程序化天空
import { Sky } from 'three/examples/jsm/objects/Sky';

const sky = new Sky();
sky.scale.setScalar(10000);
this.scene.add(sky);

const sun = new THREE.Vector3();
const skyUniforms = sky.material.uniforms;
skyUniforms['turbidity'].value = 10;
skyUniforms['rayleigh'].value = 2;
skyUniforms['mieCoefficient'].value = 0.005;
skyUniforms['mieDirectionalG'].value = 0.8;

const phi = THREE.MathUtils.degToRad(90 - 30); // 太阳高度
const theta = THREE.MathUtils.degToRad(180);   // 太阳方位
sun.setFromSphericalCoords(1, phi, theta);
skyUniforms['sunPosition'].value.copy(sun);
`;
        break;
    }

    return {
      code: code.trim(),
      description: `配置了 ${type} 类型的天空盒`
    };
  }
);

/**
 * 添加光源
 */
const addLighting = createTool(
  'add_lighting',
  '添加光源到场景',
  ToolCategories.SCENE,
  {
    type: { type: ParamTypes.STRING, required: true, enum: ['ambient', 'directional', 'point', 'spot', 'hemisphere'], description: '光源类型' },
    color: { type: ParamTypes.COLOR, required: false, description: '光源颜色' },
    intensity: { type: ParamTypes.NUMBER, required: false, description: '光源强度' },
    position: { type: ParamTypes.VECTOR3, required: false, description: '光源位置' },
    castShadow: { type: ParamTypes.BOOLEAN, required: false, description: '是否投射阴影' }
  },
  async (params) => {
    const {
      type,
      color = 0xffffff,
      intensity = 1,
      position = { x: 0, y: 10, z: 0 },
      castShadow = true
    } = params;

    const colorStr = typeof color === 'string' ? `'${color}'` : `0x${color.toString(16).padStart(6, '0')}`;
    let code = '';

    switch (type) {
      case 'ambient':
        code = `
// 环境光
const ambientLight = new THREE.AmbientLight(${colorStr}, ${intensity});
this.scene.add(ambientLight);
`;
        break;

      case 'directional':
        code = `
// 平行光
const directionalLight = new THREE.DirectionalLight(${colorStr}, ${intensity});
directionalLight.position.set(${position.x}, ${position.y}, ${position.z});
directionalLight.castShadow = ${castShadow};
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
this.scene.add(directionalLight);
`;
        break;

      case 'point':
        code = `
// 点光源
const pointLight = new THREE.PointLight(${colorStr}, ${intensity}, 100);
pointLight.position.set(${position.x}, ${position.y}, ${position.z});
pointLight.castShadow = ${castShadow};
pointLight.shadow.mapSize.width = 1024;
pointLight.shadow.mapSize.height = 1024;
this.scene.add(pointLight);
`;
        break;

      case 'spot':
        code = `
// 聚光灯
const spotLight = new THREE.SpotLight(${colorStr}, ${intensity});
spotLight.position.set(${position.x}, ${position.y}, ${position.z});
spotLight.angle = Math.PI / 6;
spotLight.penumbra = 0.2;
spotLight.decay = 2;
spotLight.distance = 200;
spotLight.castShadow = ${castShadow};
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
this.scene.add(spotLight);
`;
        break;

      case 'hemisphere':
        code = `
// 半球光
const hemisphereLight = new THREE.HemisphereLight(
  ${colorStr},  // 天空颜色
  0x444444,     // 地面颜色
  ${intensity}
);
this.scene.add(hemisphereLight);
`;
        break;
    }

    return {
      code: code.trim(),
      description: `添加了 ${type} 类型的光源`
    };
  }
);

// ============================================================
// 导出工具集
// ============================================================

export const sceneTools = {
  create_scene: createScene,
  add_terrain: addTerrain,
  setup_skybox: setupSkybox,
  add_lighting: addLighting
};
