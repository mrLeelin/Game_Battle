/**
 * 优化工具集
 *
 * 提供性能分析、资源优化、内存管理相关的工具
 */

import { createTool, ParamTypes, ToolCategories, generateId } from './tool-base.js';

/**
 * 性能分析
 */
const analyzePerformance = createTool(
  'analyze_performance',
  '生成性能分析和优化报告',
  ToolCategories.OPTIMIZE,
  {
    target: { type: ParamTypes.STRING, required: false, enum: ['all', 'rendering', 'memory', 'network'], description: '分析目标' },
    duration: { type: ParamTypes.NUMBER, required: false, description: '分析时长（秒）' }
  },
  async (params) => {
    const {
      target = 'all',
      duration = 5
    } = params;

    const code = `
// 性能分析系统

/**
 * 性能分析器
 */
class PerformanceAnalyzer {
  constructor(renderer, scene) {
    this.renderer = renderer;
    this.scene = scene;

    // 性能指标
    this.metrics = {
      fps: [],
      frameTime: [],
      drawCalls: [],
      triangles: [],
      textures: [],
      programs: [],
      geometries: [],
      memory: []
    };

    // 分析配置
    this.isAnalyzing = false;
    this.analysisStartTime = 0;
    this.duration = ${duration} * 1000;

    // 帧计时
    this.lastTime = performance.now();
    this.frameCount = 0;
  }

  /**
   * 开始分析
   */
  start(duration = ${duration} * 1000) {
    this.duration = duration;
    this.isAnalyzing = true;
    this.analysisStartTime = performance.now();
    this.metrics = {
      fps: [],
      frameTime: [],
      drawCalls: [],
      triangles: [],
      textures: [],
      programs: [],
      geometries: [],
      memory: []
    };

    console.log('Performance analysis started...');
  }

  /**
   * 每帧更新
   */
  update() {
    if (!this.isAnalyzing) return;

    const now = performance.now();
    const elapsed = now - this.analysisStartTime;

    // 检查是否完成
    if (elapsed >= this.duration) {
      this.stop();
      return;
    }

    // 计算 FPS
    const frameTime = now - this.lastTime;
    this.lastTime = now;
    this.frameCount++;

    const fps = 1000 / frameTime;

    // 收集渲染器信息
    const info = this.renderer.info;

    this.metrics.fps.push(fps);
    this.metrics.frameTime.push(frameTime);
    this.metrics.drawCalls.push(info.render.calls);
    this.metrics.triangles.push(info.render.triangles);
    this.metrics.textures.push(info.memory.textures);
    this.metrics.programs.push(info.programs?.length || 0);
    this.metrics.geometries.push(info.memory.geometries);

    // 内存信息（如果可用）
    if (performance.memory) {
      this.metrics.memory.push({
        used: performance.memory.usedJSHeapSize / 1048576,
        total: performance.memory.totalJSHeapSize / 1048576
      });
    }
  }

  /**
   * 停止分析并生成报告
   */
  stop() {
    this.isAnalyzing = false;
    const report = this.generateReport();
    console.log('Performance analysis complete');
    console.log(report);
    return report;
  }

  /**
   * 生成分析报告
   */
  generateReport() {
    const avg = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const min = (arr) => arr.length > 0 ? Math.min(...arr) : 0;
    const max = (arr) => arr.length > 0 ? Math.max(...arr) : 0;

    const report = {
      summary: {
        duration: this.duration / 1000 + 's',
        frameCount: this.frameCount
      },
      fps: {
        average: avg(this.metrics.fps).toFixed(1),
        min: min(this.metrics.fps).toFixed(1),
        max: max(this.metrics.fps).toFixed(1),
        stability: (1 - (max(this.metrics.fps) - min(this.metrics.fps)) / avg(this.metrics.fps)).toFixed(2)
      },
      frameTime: {
        average: avg(this.metrics.frameTime).toFixed(2) + 'ms',
        min: min(this.metrics.frameTime).toFixed(2) + 'ms',
        max: max(this.metrics.frameTime).toFixed(2) + 'ms'
      },
      rendering: {
        drawCalls: {
          average: Math.round(avg(this.metrics.drawCalls)),
          max: max(this.metrics.drawCalls)
        },
        triangles: {
          average: Math.round(avg(this.metrics.triangles)),
          max: max(this.metrics.triangles)
        }
      },
      memory: {
        textures: Math.round(avg(this.metrics.textures)),
        geometries: Math.round(avg(this.metrics.geometries)),
        programs: Math.round(avg(this.metrics.programs))
      },
      recommendations: this.generateRecommendations()
    };

    if (this.metrics.memory.length > 0) {
      report.jsMemory = {
        used: avg(this.metrics.memory.map(m => m.used)).toFixed(1) + 'MB',
        total: avg(this.metrics.memory.map(m => m.total)).toFixed(1) + 'MB'
      };
    }

    return report;
  }

  /**
   * 生成优化建议
   */
  generateRecommendations() {
    const recommendations = [];
    const avgFps = this.metrics.fps.reduce((a, b) => a + b, 0) / this.metrics.fps.length;
    const avgDrawCalls = this.metrics.drawCalls.reduce((a, b) => a + b, 0) / this.metrics.drawCalls.length;
    const avgTriangles = this.metrics.triangles.reduce((a, b) => a + b, 0) / this.metrics.triangles.length;

    if (avgFps < 30) {
      recommendations.push({
        severity: 'high',
        issue: 'FPS 过低（低于 30）',
        suggestion: '考虑降低场景复杂度、启用 LOD、减少实时光照'
      });
    } else if (avgFps < 60) {
      recommendations.push({
        severity: 'medium',
        issue: 'FPS 未达到 60',
        suggestion: '优化着色器、减少后处理效果、使用对象池'
      });
    }

    if (avgDrawCalls > 500) {
      recommendations.push({
        severity: 'high',
        issue: 'Draw Calls 过多（' + Math.round(avgDrawCalls) + '）',
        suggestion: '使用静态批处理、合并网格、使用 InstancedMesh'
      });
    } else if (avgDrawCalls > 200) {
      recommendations.push({
        severity: 'medium',
        issue: 'Draw Calls 较高（' + Math.round(avgDrawCalls) + '）',
        suggestion: '考虑材质合并、使用纹理图集'
      });
    }

    if (avgTriangles > 1000000) {
      recommendations.push({
        severity: 'high',
        issue: '三角形数量过多（' + Math.round(avgTriangles / 1000) + 'K）',
        suggestion: '使用 LOD、减少模型面数、启用视锥剔除'
      });
    }

    if (this.metrics.memory.length > 0) {
      const avgMemory = this.metrics.memory.reduce((a, b) => a + b.used, 0) / this.metrics.memory.length;
      if (avgMemory > 500) {
        recommendations.push({
          severity: 'medium',
          issue: 'JavaScript 堆内存使用较高（' + avgMemory.toFixed(0) + 'MB）',
          suggestion: '检查内存泄漏、及时释放未使用的资源'
        });
      }
    }

    if (recommendations.length === 0) {
      recommendations.push({
        severity: 'info',
        issue: '性能良好',
        suggestion: '当前性能表现正常，无需特别优化'
      });
    }

    return recommendations;
  }
}

// 使用示例
/*
const analyzer = new PerformanceAnalyzer(renderer, scene);

// 开始分析（5秒）
analyzer.start(5000);

// 在渲染循环中调用
function animate() {
  requestAnimationFrame(animate);
  analyzer.update();
  renderer.render(scene, camera);
}

// 手动停止并获取报告
// const report = analyzer.stop();
*/

export { PerformanceAnalyzer };
`;

    return {
      code: code.trim(),
      description: `创建了性能分析器，分析时长 ${duration} 秒`
    };
  }
);

/**
 * 压缩纹理
 */
const compressTextures = createTool(
  'compress_textures',
  '生成纹理压缩和优化代码',
  ToolCategories.OPTIMIZE,
  {
    format: { type: ParamTypes.STRING, required: false, enum: ['ktx2', 'basis', 'webp', 'auto'], description: '压缩格式' },
    maxSize: { type: ParamTypes.NUMBER, required: false, description: '最大尺寸' },
    mipmap: { type: ParamTypes.BOOLEAN, required: false, description: '生成 Mipmap' }
  },
  async (params) => {
    const {
      format = 'ktx2',
      maxSize = 2048,
      mipmap = true
    } = params;

    const code = `
// 纹理优化系统

import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';
import { BasisTextureLoader } from 'three/examples/jsm/loaders/BasisTextureLoader';

/**
 * 纹理优化器
 */
class TextureOptimizer {
  constructor(renderer) {
    this.renderer = renderer;
    this.maxSize = ${maxSize};
    this.generateMipmaps = ${mipmap};

    // 初始化加载器
    this.ktx2Loader = new KTX2Loader();
    this.ktx2Loader.setTranscoderPath('/basis/');
    this.ktx2Loader.detectSupport(renderer);

    // 纹理缓存
    this.textureCache = new Map();
  }

  /**
   * 加载优化的纹理
   */
  async loadOptimized(url, options = {}) {
    // 检查缓存
    if (this.textureCache.has(url)) {
      return this.textureCache.get(url);
    }

    const ext = url.split('.').pop().toLowerCase();

    let texture;

    switch (ext) {
      case 'ktx2':
        texture = await this.loadKTX2(url);
        break;
      case 'basis':
        texture = await this.loadBasis(url);
        break;
      default:
        texture = await this.loadStandard(url);
    }

    // 应用优化设置
    this.optimizeTexture(texture, options);

    // 缓存
    this.textureCache.set(url, texture);

    return texture;
  }

  /**
   * 加载 KTX2 纹理
   */
  loadKTX2(url) {
    return new Promise((resolve, reject) => {
      this.ktx2Loader.load(url, resolve, undefined, reject);
    });
  }

  /**
   * 加载标准纹理并优化
   */
  loadStandard(url) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(url, (texture) => {
        // 如果纹理过大，缩放
        if (texture.image.width > this.maxSize || texture.image.height > this.maxSize) {
          texture = this.resizeTexture(texture);
        }
        resolve(texture);
      }, undefined, reject);
    });
  }

  /**
   * 优化纹理设置
   */
  optimizeTexture(texture, options = {}) {
    // Mipmap
    texture.generateMipmaps = options.generateMipmaps ?? this.generateMipmaps;

    // 过滤模式
    if (texture.generateMipmaps) {
      texture.minFilter = THREE.LinearMipmapLinearFilter;
    } else {
      texture.minFilter = THREE.LinearFilter;
    }
    texture.magFilter = THREE.LinearFilter;

    // 各向异性过滤
    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
    texture.anisotropy = options.anisotropy ?? Math.min(4, maxAnisotropy);

    // 包裹模式
    texture.wrapS = options.wrapS ?? THREE.RepeatWrapping;
    texture.wrapT = options.wrapT ?? THREE.RepeatWrapping;

    // 色彩空间
    if (options.sRGB !== false) {
      texture.colorSpace = THREE.SRGBColorSpace;
    }

    texture.needsUpdate = true;
    return texture;
  }

  /**
   * 缩放过大的纹理
   */
  resizeTexture(texture) {
    const image = texture.image;
    const maxSize = this.maxSize;

    let width = image.width;
    let height = image.height;

    if (width > maxSize || height > maxSize) {
      const ratio = Math.min(maxSize / width, maxSize / height);
      width = Math.floor(width * ratio);
      height = Math.floor(height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0, width, height);

      const resizedTexture = new THREE.CanvasTexture(canvas);
      texture.dispose();

      console.log(\`Texture resized: \${image.width}x\${image.height} -> \${width}x\${height}\`);

      return resizedTexture;
    }

    return texture;
  }

  /**
   * 创建纹理图集
   */
  createTextureAtlas(textures, atlasSize = 2048) {
    const canvas = document.createElement('canvas');
    canvas.width = atlasSize;
    canvas.height = atlasSize;
    const ctx = canvas.getContext('2d');

    const count = textures.length;
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const cellWidth = atlasSize / cols;
    const cellHeight = atlasSize / rows;

    const uvMappings = [];

    textures.forEach((texture, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = col * cellWidth;
      const y = row * cellHeight;

      if (texture.image) {
        ctx.drawImage(texture.image, x, y, cellWidth, cellHeight);
      }

      uvMappings.push({
        index,
        uMin: col / cols,
        uMax: (col + 1) / cols,
        vMin: 1 - (row + 1) / rows,
        vMax: 1 - row / rows
      });
    });

    const atlasTexture = new THREE.CanvasTexture(canvas);
    atlasTexture.generateMipmaps = true;
    atlasTexture.minFilter = THREE.LinearMipmapLinearFilter;

    return {
      texture: atlasTexture,
      uvMappings
    };
  }

  /**
   * 释放缓存的纹理
   */
  dispose() {
    for (const texture of this.textureCache.values()) {
      texture.dispose();
    }
    this.textureCache.clear();
    this.ktx2Loader.dispose();
  }
}

// 使用示例
/*
const optimizer = new TextureOptimizer(renderer);

// 加载优化的纹理
const texture = await optimizer.loadOptimized('assets/textures/diffuse.ktx2');

// 加载并自动调整大小
const largeTexture = await optimizer.loadOptimized('assets/textures/large.jpg');

// 创建纹理图集
const { texture: atlas, uvMappings } = optimizer.createTextureAtlas([
  texture1, texture2, texture3
]);
*/

export { TextureOptimizer };
`;

    return {
      code: code.trim(),
      description: `创建了纹理优化器，格式 ${format}，最大尺寸 ${maxSize}`
    };
  }
);

/**
 * 批处理网格
 */
const batchMeshes = createTool(
  'batch_meshes',
  '合并网格减少 Draw Calls',
  ToolCategories.OPTIMIZE,
  {
    batchType: { type: ParamTypes.STRING, required: false, enum: ['static', 'instanced', 'merged'], description: '批处理类型' },
    maxBatchSize: { type: ParamTypes.NUMBER, required: false, description: '每批最大网格数' }
  },
  async (params) => {
    const {
      batchType = 'static',
      maxBatchSize = 100
    } = params;

    const code = `
// 网格批处理系统

import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';

/**
 * 网格批处理器
 */
class MeshBatcher {
  constructor(scene) {
    this.scene = scene;
    this.batches = new Map();
    this.maxBatchSize = ${maxBatchSize};
  }

  /**
   * 静态批处理
   * 合并使用相同材质的静态网格
   */
  createStaticBatch(meshes, batchName = 'staticBatch') {
    if (meshes.length === 0) return null;

    // 按材质分组
    const materialGroups = new Map();

    for (const mesh of meshes) {
      const materialId = mesh.material.uuid;
      if (!materialGroups.has(materialId)) {
        materialGroups.set(materialId, {
          material: mesh.material,
          meshes: []
        });
      }
      materialGroups.get(materialId).meshes.push(mesh);
    }

    const batchedMeshes = [];

    for (const [materialId, group] of materialGroups) {
      const geometries = [];

      for (const mesh of group.meshes) {
        // 克隆几何体并应用世界变换
        const geometry = mesh.geometry.clone();
        mesh.updateMatrixWorld();
        geometry.applyMatrix4(mesh.matrixWorld);
        geometries.push(geometry);

        // 移除原始网格
        mesh.parent?.remove(mesh);
        mesh.geometry.dispose();
      }

      // 合并几何体
      const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries, false);

      // 创建批处理网格
      const batchedMesh = new THREE.Mesh(mergedGeometry, group.material);
      batchedMesh.name = \`\${batchName}_\${materialId.substring(0, 8)}\`;
      batchedMesh.castShadow = true;
      batchedMesh.receiveShadow = true;

      this.scene.add(batchedMesh);
      batchedMeshes.push(batchedMesh);

      // 清理临时几何体
      geometries.forEach(g => g.dispose());
    }

    this.batches.set(batchName, batchedMeshes);
    console.log(\`Static batch created: \${meshes.length} meshes -> \${batchedMeshes.length} batches\`);

    return batchedMeshes;
  }

  /**
   * 实例化批处理
   * 用于大量相同几何体的物体
   */
  createInstancedBatch(geometry, material, transforms, batchName = 'instancedBatch') {
    const count = Math.min(transforms.length, this.maxBatchSize);

    const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    instancedMesh.name = batchName;
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;

    const matrix = new THREE.Matrix4();

    for (let i = 0; i < count; i++) {
      const transform = transforms[i];

      matrix.compose(
        new THREE.Vector3(transform.position?.x || 0, transform.position?.y || 0, transform.position?.z || 0),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(
          transform.rotation?.x || 0,
          transform.rotation?.y || 0,
          transform.rotation?.z || 0
        )),
        new THREE.Vector3(transform.scale?.x || 1, transform.scale?.y || 1, transform.scale?.z || 1)
      );

      instancedMesh.setMatrixAt(i, matrix);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;

    this.scene.add(instancedMesh);
    this.batches.set(batchName, [instancedMesh]);

    console.log(\`Instanced batch created: \${count} instances\`);

    return instancedMesh;
  }

  /**
   * 更新实例变换
   */
  updateInstanceTransform(batchName, index, transform) {
    const batch = this.batches.get(batchName)?.[0];
    if (!batch || !batch.isInstancedMesh) return;

    const matrix = new THREE.Matrix4();
    matrix.compose(
      new THREE.Vector3(transform.position?.x || 0, transform.position?.y || 0, transform.position?.z || 0),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(
        transform.rotation?.x || 0,
        transform.rotation?.y || 0,
        transform.rotation?.z || 0
      )),
      new THREE.Vector3(transform.scale?.x || 1, transform.scale?.y || 1, transform.scale?.z || 1)
    );

    batch.setMatrixAt(index, matrix);
    batch.instanceMatrix.needsUpdate = true;
  }

  /**
   * 自动批处理场景中的静态物体
   */
  autoBatchScene(filter = (mesh) => mesh.userData.static === true) {
    const staticMeshes = [];

    this.scene.traverse((obj) => {
      if (obj.isMesh && filter(obj)) {
        staticMeshes.push(obj);
      }
    });

    if (staticMeshes.length > 0) {
      return this.createStaticBatch(staticMeshes, 'autoBatch');
    }

    return null;
  }

  /**
   * 移除批处理
   */
  removeBatch(batchName) {
    const batch = this.batches.get(batchName);
    if (batch) {
      for (const mesh of batch) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
      }
      this.batches.delete(batchName);
    }
  }

  /**
   * 获取批处理统计
   */
  getStats() {
    let totalBatches = 0;
    let totalInstances = 0;

    for (const batch of this.batches.values()) {
      totalBatches += batch.length;
      for (const mesh of batch) {
        if (mesh.isInstancedMesh) {
          totalInstances += mesh.count;
        }
      }
    }

    return {
      batchCount: totalBatches,
      instanceCount: totalInstances
    };
  }

  /**
   * 释放所有批处理
   */
  dispose() {
    for (const batchName of this.batches.keys()) {
      this.removeBatch(batchName);
    }
  }
}

// 使用示例
/*
const batcher = new MeshBatcher(scene);

// 标记静态物体
staticMeshes.forEach(mesh => mesh.userData.static = true);

// 自动批处理
batcher.autoBatchScene();

// 实例化批处理（用于树、草等）
const treeTransforms = [
  { position: { x: 0, y: 0, z: 0 }, rotation: { y: 0 }, scale: { x: 1, y: 1, z: 1 } },
  { position: { x: 10, y: 0, z: 5 }, rotation: { y: 1.5 }, scale: { x: 0.8, y: 0.8, z: 0.8 } },
  // ...更多
];
batcher.createInstancedBatch(treeGeometry, treeMaterial, treeTransforms, 'trees');

// 获取统计
console.log(batcher.getStats());
*/

export { MeshBatcher };
`;

    return {
      code: code.trim(),
      description: `创建了 ${batchType} 类型的网格批处理器`
    };
  }
);

// ============================================================
// 导出工具集
// ============================================================

export const optimizeTools = {
  analyze_performance: analyzePerformance,
  compress_textures: compressTextures,
  batch_meshes: batchMeshes
};
