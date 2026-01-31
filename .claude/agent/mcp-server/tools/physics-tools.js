/**
 * 物理工具集
 *
 * 提供物理引擎配置、碰撞检测、刚体设置相关的工具
 */

import { createTool, ParamTypes, ToolCategories, generateId } from './tool-base.js';

/**
 * 添加刚体
 */
const addRigidbody = createTool(
  'add_rigidbody',
  '添加刚体组件到物体',
  ToolCategories.PHYSICS,
  {
    objectName: { type: ParamTypes.STRING, required: true, description: '物体名称' },
    type: { type: ParamTypes.STRING, required: false, enum: ['dynamic', 'static', 'kinematic'], description: '刚体类型' },
    mass: { type: ParamTypes.NUMBER, required: false, description: '质量' },
    friction: { type: ParamTypes.NUMBER, required: false, description: '摩擦系数' },
    restitution: { type: ParamTypes.NUMBER, required: false, description: '弹性系数' },
    linearDamping: { type: ParamTypes.NUMBER, required: false, description: '线性阻尼' },
    angularDamping: { type: ParamTypes.NUMBER, required: false, description: '角阻尼' }
  },
  async (params) => {
    const {
      objectName,
      type = 'dynamic',
      mass = 1,
      friction = 0.5,
      restitution = 0.3,
      linearDamping = 0.01,
      angularDamping = 0.01
    } = params;

    const code = `
// 使用 Cannon.js 物理引擎添加刚体
// 需要安装: npm install cannon-es

import * as CANNON from 'cannon-es';

/**
 * 物理世界管理器
 */
class PhysicsWorld {
  constructor() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.allowSleep = true;

    this.bodies = new Map(); // 物理体映射
    this.meshes = new Map(); // Three.js 网格映射
  }

  /**
   * 添加刚体
   */
  addBody(mesh, options = {}) {
    const {
      type = '${type}',
      mass = ${mass},
      friction = ${friction},
      restitution = ${restitution},
      linearDamping = ${linearDamping},
      angularDamping = ${angularDamping},
      shape = 'box'
    } = options;

    // 根据物体类型设置质量
    let bodyMass = mass;
    if (type === 'static') bodyMass = 0;
    if (type === 'kinematic') bodyMass = 0;

    // 创建形状
    let cannonShape;
    if (shape === 'box') {
      const size = new THREE.Vector3();
      new THREE.Box3().setFromObject(mesh).getSize(size);
      cannonShape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
    } else if (shape === 'sphere') {
      const sphere = new THREE.Sphere();
      new THREE.Box3().setFromObject(mesh).getBoundingSphere(sphere);
      cannonShape = new CANNON.Sphere(sphere.radius);
    } else if (shape === 'cylinder') {
      const size = new THREE.Vector3();
      new THREE.Box3().setFromObject(mesh).getSize(size);
      cannonShape = new CANNON.Cylinder(size.x / 2, size.x / 2, size.y, 16);
    }

    // 创建刚体
    const body = new CANNON.Body({
      mass: bodyMass,
      shape: cannonShape,
      position: new CANNON.Vec3(mesh.position.x, mesh.position.y, mesh.position.z),
      quaternion: new CANNON.Quaternion(
        mesh.quaternion.x,
        mesh.quaternion.y,
        mesh.quaternion.z,
        mesh.quaternion.w
      ),
      material: new CANNON.Material({
        friction: friction,
        restitution: restitution
      }),
      linearDamping: linearDamping,
      angularDamping: angularDamping
    });

    // Kinematic 类型设置
    if (type === 'kinematic') {
      body.type = CANNON.Body.KINEMATIC;
    }

    this.world.addBody(body);
    this.bodies.set(mesh.uuid, body);
    this.meshes.set(body.id, mesh);

    return body;
  }

  /**
   * 移除刚体
   */
  removeBody(mesh) {
    const body = this.bodies.get(mesh.uuid);
    if (body) {
      this.world.removeBody(body);
      this.bodies.delete(mesh.uuid);
      this.meshes.delete(body.id);
    }
  }

  /**
   * 更新物理世界
   */
  update(delta) {
    this.world.step(1 / 60, delta, 3);

    // 同步 Three.js 网格位置
    for (const [uuid, body] of this.bodies) {
      const mesh = this.scene?.getObjectByProperty('uuid', uuid);
      if (mesh && body.type !== CANNON.Body.KINEMATIC) {
        mesh.position.copy(body.position);
        mesh.quaternion.copy(body.quaternion);
      }
    }
  }

  /**
   * 施加力
   */
  applyForce(mesh, force, point = null) {
    const body = this.bodies.get(mesh.uuid);
    if (body) {
      const forceVec = new CANNON.Vec3(force.x, force.y, force.z);
      if (point) {
        const pointVec = new CANNON.Vec3(point.x, point.y, point.z);
        body.applyForce(forceVec, pointVec);
      } else {
        body.applyForce(forceVec, body.position);
      }
    }
  }

  /**
   * 施加冲量
   */
  applyImpulse(mesh, impulse, point = null) {
    const body = this.bodies.get(mesh.uuid);
    if (body) {
      const impulseVec = new CANNON.Vec3(impulse.x, impulse.y, impulse.z);
      if (point) {
        const pointVec = new CANNON.Vec3(point.x, point.y, point.z);
        body.applyImpulse(impulseVec, pointVec);
      } else {
        body.applyImpulse(impulseVec, body.position);
      }
    }
  }

  /**
   * 设置速度
   */
  setVelocity(mesh, velocity) {
    const body = this.bodies.get(mesh.uuid);
    if (body) {
      body.velocity.set(velocity.x, velocity.y, velocity.z);
    }
  }
}

// 使用示例
/*
const physics = new PhysicsWorld();
physics.scene = this.scene;

// 添加动态刚体
const cube = this.scene.getObjectByName('${objectName}');
physics.addBody(cube, {
  type: '${type}',
  mass: ${mass},
  shape: 'box'
});

// 添加静态地面
const ground = this.scene.getObjectByName('ground');
physics.addBody(ground, { type: 'static' });

// 在 update 中
physics.update(delta);
*/
`;

    return {
      code: code.trim(),
      description: `添加了 ${type} 类型的刚体到 ${objectName}`
    };
  }
);

/**
 * 添加碰撞体
 */
const addCollider = createTool(
  'add_collider',
  '添加碰撞体到物体',
  ToolCategories.PHYSICS,
  {
    objectName: { type: ParamTypes.STRING, required: true, description: '物体名称' },
    shape: { type: ParamTypes.STRING, required: false, enum: ['box', 'sphere', 'capsule', 'mesh', 'convex'], description: '碰撞体形状' },
    isTrigger: { type: ParamTypes.BOOLEAN, required: false, description: '是否为触发器' },
    offset: { type: ParamTypes.VECTOR3, required: false, description: '偏移' },
    size: { type: ParamTypes.VECTOR3, required: false, description: '尺寸（box）' },
    radius: { type: ParamTypes.NUMBER, required: false, description: '半径（sphere/capsule）' }
  },
  async (params) => {
    const {
      objectName,
      shape = 'box',
      isTrigger = false,
      offset = { x: 0, y: 0, z: 0 },
      size = { x: 1, y: 1, z: 1 },
      radius = 0.5
    } = params;

    const code = `
// 碰撞体系统（不使用物理引擎的轻量级碰撞检测）

/**
 * 碰撞体组件
 */
class Collider {
  constructor(mesh, options = {}) {
    this.mesh = mesh;
    this.shape = '${shape}';
    this.isTrigger = ${isTrigger};
    this.offset = new THREE.Vector3(${offset.x}, ${offset.y}, ${offset.z});

    // 碰撞事件回调
    this.onCollisionEnter = null;
    this.onCollisionStay = null;
    this.onCollisionExit = null;
    this.onTriggerEnter = null;
    this.onTriggerStay = null;
    this.onTriggerExit = null;

    // 当前碰撞列表
    this.currentCollisions = new Set();

    this.createBoundingVolume(options);
  }

  createBoundingVolume(options) {
    switch (this.shape) {
      case 'box':
        this.boundingBox = new THREE.Box3();
        this.size = new THREE.Vector3(
          options.size?.x || ${size.x},
          options.size?.y || ${size.y},
          options.size?.z || ${size.z}
        );
        break;

      case 'sphere':
        this.boundingSphere = new THREE.Sphere();
        this.radius = options.radius || ${radius};
        break;

      case 'capsule':
        // 用两个球和一个圆柱近似
        this.radius = options.radius || ${radius};
        this.height = options.height || 2;
        break;
    }

    this.updateBounds();
  }

  updateBounds() {
    const worldPos = this.mesh.getWorldPosition(new THREE.Vector3());
    worldPos.add(this.offset);

    switch (this.shape) {
      case 'box':
        this.boundingBox.setFromCenterAndSize(worldPos, this.size);
        break;

      case 'sphere':
        this.boundingSphere.center.copy(worldPos);
        this.boundingSphere.radius = this.radius;
        break;
    }
  }

  /**
   * 检测与另一个碰撞体的碰撞
   */
  intersects(other) {
    this.updateBounds();
    other.updateBounds();

    if (this.shape === 'box' && other.shape === 'box') {
      return this.boundingBox.intersectsBox(other.boundingBox);
    }

    if (this.shape === 'sphere' && other.shape === 'sphere') {
      return this.boundingSphere.intersectsSphere(other.boundingSphere);
    }

    if (this.shape === 'box' && other.shape === 'sphere') {
      return this.boundingBox.intersectsSphere(other.boundingSphere);
    }

    if (this.shape === 'sphere' && other.shape === 'box') {
      return other.boundingBox.intersectsSphere(this.boundingSphere);
    }

    return false;
  }
}

/**
 * 碰撞管理器
 */
class CollisionManager {
  constructor() {
    this.colliders = [];
    this.layers = new Map(); // 碰撞层
  }

  /**
   * 添加碰撞体
   */
  add(collider, layer = 'default') {
    this.colliders.push(collider);
    if (!this.layers.has(layer)) {
      this.layers.set(layer, []);
    }
    this.layers.get(layer).push(collider);
  }

  /**
   * 移除碰撞体
   */
  remove(collider) {
    const index = this.colliders.indexOf(collider);
    if (index > -1) {
      this.colliders.splice(index, 1);
    }

    for (const [layer, colliders] of this.layers) {
      const layerIndex = colliders.indexOf(collider);
      if (layerIndex > -1) {
        colliders.splice(layerIndex, 1);
      }
    }
  }

  /**
   * 检测所有碰撞
   */
  update() {
    for (let i = 0; i < this.colliders.length; i++) {
      for (let j = i + 1; j < this.colliders.length; j++) {
        const a = this.colliders[i];
        const b = this.colliders[j];

        const isColliding = a.intersects(b);
        const wasColliding = a.currentCollisions.has(b);

        if (isColliding && !wasColliding) {
          // 碰撞开始
          a.currentCollisions.add(b);
          b.currentCollisions.add(a);

          if (a.isTrigger || b.isTrigger) {
            a.onTriggerEnter?.(b);
            b.onTriggerEnter?.(a);
          } else {
            a.onCollisionEnter?.(b);
            b.onCollisionEnter?.(a);
          }
        } else if (isColliding && wasColliding) {
          // 碰撞持续
          if (a.isTrigger || b.isTrigger) {
            a.onTriggerStay?.(b);
            b.onTriggerStay?.(a);
          } else {
            a.onCollisionStay?.(b);
            b.onCollisionStay?.(a);
          }
        } else if (!isColliding && wasColliding) {
          // 碰撞结束
          a.currentCollisions.delete(b);
          b.currentCollisions.delete(a);

          if (a.isTrigger || b.isTrigger) {
            a.onTriggerExit?.(b);
            b.onTriggerExit?.(a);
          } else {
            a.onCollisionExit?.(b);
            b.onCollisionExit?.(a);
          }
        }
      }
    }
  }

  /**
   * 射线检测
   */
  raycast(origin, direction, maxDistance = Infinity, layer = null) {
    const ray = new THREE.Ray(origin, direction.normalize());
    const results = [];

    const targets = layer ? (this.layers.get(layer) || []) : this.colliders;

    for (const collider of targets) {
      collider.updateBounds();

      let intersection = null;

      if (collider.shape === 'box') {
        intersection = ray.intersectBox(collider.boundingBox, new THREE.Vector3());
      } else if (collider.shape === 'sphere') {
        intersection = ray.intersectSphere(collider.boundingSphere, new THREE.Vector3());
      }

      if (intersection) {
        const distance = origin.distanceTo(intersection);
        if (distance <= maxDistance) {
          results.push({
            collider,
            point: intersection,
            distance
          });
        }
      }
    }

    // 按距离排序
    results.sort((a, b) => a.distance - b.distance);
    return results;
  }
}

// 使用示例
/*
const collisionManager = new CollisionManager();

const mesh = this.scene.getObjectByName('${objectName}');
const collider = new Collider(mesh, {
  shape: '${shape}',
  isTrigger: ${isTrigger}
});

collider.onCollisionEnter = (other) => {
  console.log('Collision with:', other.mesh.name);
};

collisionManager.add(collider);

// 在 update 中
collisionManager.update();
*/
`;

    return {
      code: code.trim(),
      description: `添加了 ${shape} 形状的${isTrigger ? '触发器' : '碰撞体'}到 ${objectName}`
    };
  }
);

/**
 * 配置物理世界
 */
const setupPhysicsWorld = createTool(
  'setup_physics_world',
  '配置物理世界参数',
  ToolCategories.PHYSICS,
  {
    gravity: { type: ParamTypes.VECTOR3, required: false, description: '重力' },
    iterations: { type: ParamTypes.NUMBER, required: false, description: '求解器迭代次数' },
    allowSleep: { type: ParamTypes.BOOLEAN, required: false, description: '允许休眠' }
  },
  async (params) => {
    const {
      gravity = { x: 0, y: -9.82, z: 0 },
      iterations = 10,
      allowSleep = true
    } = params;

    const code = `
// 完整的物理世界配置
import * as CANNON from 'cannon-es';

class PhysicsConfig {
  static create(options = {}) {
    const world = new CANNON.World();

    // 重力
    world.gravity.set(
      options.gravity?.x ?? ${gravity.x},
      options.gravity?.y ?? ${gravity.y},
      options.gravity?.z ?? ${gravity.z}
    );

    // 广相碰撞检测算法
    world.broadphase = new CANNON.SAPBroadphase(world);

    // 求解器
    world.solver.iterations = options.iterations ?? ${iterations};

    // 休眠
    world.allowSleep = options.allowSleep ?? ${allowSleep};

    // 默认材质和接触材质
    const defaultMaterial = new CANNON.Material('default');
    const defaultContactMaterial = new CANNON.ContactMaterial(
      defaultMaterial,
      defaultMaterial,
      {
        friction: 0.3,
        restitution: 0.3
      }
    );
    world.addContactMaterial(defaultContactMaterial);
    world.defaultContactMaterial = defaultContactMaterial;

    return world;
  }

  /**
   * 创建常用预设
   */
  static presets = {
    // 地球重力
    earth: {
      gravity: { x: 0, y: -9.82, z: 0 },
      iterations: 10,
      allowSleep: true
    },

    // 月球重力
    moon: {
      gravity: { x: 0, y: -1.62, z: 0 },
      iterations: 10,
      allowSleep: true
    },

    // 太空（无重力）
    space: {
      gravity: { x: 0, y: 0, z: 0 },
      iterations: 5,
      allowSleep: false
    },

    // 水下
    underwater: {
      gravity: { x: 0, y: -2.0, z: 0 },
      iterations: 10,
      allowSleep: false
    },

    // 高精度（适合小物体）
    precision: {
      gravity: { x: 0, y: -9.82, z: 0 },
      iterations: 20,
      allowSleep: false
    }
  };
}

// 使用示例
// const world = PhysicsConfig.create(PhysicsConfig.presets.earth);
`;

    return {
      code: code.trim(),
      description: `配置了物理世界，重力 (${gravity.x}, ${gravity.y}, ${gravity.z})`
    };
  }
);

// ============================================================
// 导出工具集
// ============================================================

export const physicsTools = {
  add_rigidbody: addRigidbody,
  add_collider: addCollider,
  setup_physics_world: setupPhysicsWorld
};
