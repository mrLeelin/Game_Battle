/**
 * 动画工具集
 *
 * 提供动画创建、播放、混合、状态机相关的工具
 */

import { createTool, ParamTypes, ToolCategories, generateId } from './tool-base.js';

/**
 * 创建动画片段
 */
const createAnimation = createTool(
  'create_animation',
  '创建动画片段',
  ToolCategories.ANIMATION,
  {
    name: { type: ParamTypes.STRING, required: true, description: '动画名称' },
    type: { type: ParamTypes.STRING, required: false, enum: ['position', 'rotation', 'scale', 'color', 'opacity'], description: '动画类型' },
    keyframes: { type: ParamTypes.ARRAY, required: false, description: '关键帧数组' },
    duration: { type: ParamTypes.NUMBER, required: false, description: '动画时长（秒）' },
    loop: { type: ParamTypes.BOOLEAN, required: false, description: '是否循环' }
  },
  async (params) => {
    const {
      name,
      type = 'position',
      keyframes = [],
      duration = 1,
      loop = true
    } = params;

    const animId = generateId('anim');

    const code = `
// 创建动画片段: ${name}
function createAnimation_${name}(targetObject) {
  const times = [${keyframes.map((kf, i) => (i / (keyframes.length - 1 || 1) * duration).toFixed(2)).join(', ') || '0, 0.5, 1'}];

  ${type === 'position' ? `
  const positionValues = [
    ${keyframes.length > 0
      ? keyframes.map(kf => `${kf.x || 0}, ${kf.y || 0}, ${kf.z || 0}`).join(',\n    ')
      : '0, 0, 0,\n    0, 1, 0,\n    0, 0, 0'
    }
  ];
  const positionTrack = new THREE.VectorKeyframeTrack(
    '.position',
    times,
    positionValues
  );
  ` : ''}

  ${type === 'rotation' ? `
  const rotationValues = [
    ${keyframes.length > 0
      ? keyframes.map(kf => `${kf.x || 0}, ${kf.y || 0}, ${kf.z || 0}, ${kf.w || 1}`).join(',\n    ')
      : '0, 0, 0, 1,\n    0, 0.707, 0, 0.707,\n    0, 0, 0, 1'
    }
  ];
  const rotationTrack = new THREE.QuaternionKeyframeTrack(
    '.quaternion',
    times,
    rotationValues
  );
  ` : ''}

  ${type === 'scale' ? `
  const scaleValues = [
    ${keyframes.length > 0
      ? keyframes.map(kf => `${kf.x || 1}, ${kf.y || 1}, ${kf.z || 1}`).join(',\n    ')
      : '1, 1, 1,\n    1.5, 1.5, 1.5,\n    1, 1, 1'
    }
  ];
  const scaleTrack = new THREE.VectorKeyframeTrack(
    '.scale',
    times,
    scaleValues
  );
  ` : ''}

  ${type === 'opacity' ? `
  const opacityValues = [${keyframes.length > 0
    ? keyframes.map(kf => kf.value || 1).join(', ')
    : '1, 0, 1'
  }];
  const opacityTrack = new THREE.NumberKeyframeTrack(
    '.material.opacity',
    times,
    opacityValues
  );
  ` : ''}

  ${type === 'color' ? `
  const colorValues = [
    ${keyframes.length > 0
      ? keyframes.map(kf => `${kf.r || 1}, ${kf.g || 1}, ${kf.b || 1}`).join(',\n    ')
      : '1, 0, 0,\n    0, 1, 0,\n    0, 0, 1'
    }
  ];
  const colorTrack = new THREE.ColorKeyframeTrack(
    '.material.color',
    times,
    colorValues
  );
  ` : ''}

  const tracks = [${type}Track];
  const clip = new THREE.AnimationClip('${name}', ${duration}, tracks);

  const mixer = new THREE.AnimationMixer(targetObject);
  const action = mixer.clipAction(clip);

  action.setLoop(${loop ? 'THREE.LoopRepeat' : 'THREE.LoopOnce'}, Infinity);
  ${!loop ? 'action.clampWhenFinished = true;' : ''}

  return { mixer, action, clip };
}

// 使用示例
// const { mixer, action } = createAnimation_${name}(myObject);
// action.play();
// 在 update 中: mixer.update(delta);
`;

    return {
      code: code.trim(),
      animationId: animId,
      description: `创建了 ${type} 类型的动画: ${name}`
    };
  }
);

/**
 * 动画混合
 */
const blendAnimations = createTool(
  'blend_animations',
  '配置动画混合（Blend Tree）',
  ToolCategories.ANIMATION,
  {
    animations: { type: ParamTypes.ARRAY, required: true, description: '动画列表' },
    blendType: { type: ParamTypes.STRING, required: false, enum: ['crossfade', 'additive', 'weighted'], description: '混合类型' },
    transitionDuration: { type: ParamTypes.NUMBER, required: false, description: '过渡时长' }
  },
  async (params) => {
    const {
      animations = ['idle', 'walk', 'run'],
      blendType = 'crossfade',
      transitionDuration = 0.3
    } = params;

    const code = `
// 动画混合系统
class AnimationBlender {
  constructor(mixer, animations) {
    this.mixer = mixer;
    this.actions = new Map();
    this.currentAction = null;
    this.transitionDuration = ${transitionDuration};

    // 加载所有动画
    for (const clip of animations) {
      const action = mixer.clipAction(clip);
      this.actions.set(clip.name, action);
    }
  }

  /**
   * 播放动画（${blendType} 混合）
   */
  play(name, options = {}) {
    const newAction = this.actions.get(name);
    if (!newAction) {
      console.warn('Animation not found:', name);
      return;
    }

    const { duration = this.transitionDuration, weight = 1 } = options;

    ${blendType === 'crossfade' ? `
    // 交叉淡入淡出
    if (this.currentAction && this.currentAction !== newAction) {
      newAction.reset();
      newAction.setEffectiveWeight(1);
      newAction.setEffectiveTimeScale(1);
      this.currentAction.crossFadeTo(newAction, duration, true);
    }

    newAction.play();
    this.currentAction = newAction;
    ` : ''}

    ${blendType === 'additive' ? `
    // 叠加混合
    newAction.reset();
    newAction.setEffectiveWeight(weight);
    newAction.blendMode = THREE.AdditiveAnimationBlendMode;
    newAction.play();

    if (!this.currentAction) {
      this.currentAction = newAction;
    }
    ` : ''}

    ${blendType === 'weighted' ? `
    // 权重混合
    for (const [actionName, action] of this.actions) {
      if (actionName === name) {
        action.setEffectiveWeight(weight);
        action.play();
      } else {
        action.setEffectiveWeight(0);
      }
    }
    this.currentAction = newAction;
    ` : ''}
  }

  /**
   * 设置动画权重（用于多动画混合）
   */
  setWeight(name, weight) {
    const action = this.actions.get(name);
    if (action) {
      action.setEffectiveWeight(weight);
    }
  }

  /**
   * 设置动画速度
   */
  setSpeed(name, speed) {
    const action = this.actions.get(name);
    if (action) {
      action.setEffectiveTimeScale(speed);
    }
  }

  /**
   * 停止所有动画
   */
  stopAll() {
    for (const action of this.actions.values()) {
      action.stop();
    }
    this.currentAction = null;
  }

  /**
   * 更新
   */
  update(delta) {
    this.mixer.update(delta);
  }
}

// 使用示例
// const blender = new AnimationBlender(mixer, animations);
// blender.play('walk');
// blender.play('run', { duration: 0.5 });
`;

    return {
      code: code.trim(),
      description: `配置了 ${blendType} 类型的动画混合，包含 ${animations.length} 个动画`
    };
  }
);

/**
 * 动画状态机
 */
const setupAnimator = createTool(
  'setup_animator',
  '配置动画状态机',
  ToolCategories.ANIMATION,
  {
    states: { type: ParamTypes.ARRAY, required: true, description: '状态列表' },
    transitions: { type: ParamTypes.ARRAY, required: false, description: '状态转换规则' },
    defaultState: { type: ParamTypes.STRING, required: false, description: '默认状态' }
  },
  async (params) => {
    const {
      states = ['idle', 'walk', 'run', 'jump', 'attack'],
      transitions = [
        { from: 'idle', to: 'walk', condition: 'speed > 0.1' },
        { from: 'walk', to: 'run', condition: 'speed > 0.5' },
        { from: 'walk', to: 'idle', condition: 'speed <= 0.1' },
        { from: 'run', to: 'walk', condition: 'speed <= 0.5' },
        { from: '*', to: 'jump', condition: 'isJumping' },
        { from: 'jump', to: 'idle', condition: '!isJumping && speed <= 0.1' }
      ],
      defaultState = 'idle'
    } = params;

    const code = `
// 动画状态机
class AnimatorStateMachine {
  constructor(mixer, animations) {
    this.mixer = mixer;
    this.actions = new Map();
    this.currentState = '${defaultState}';
    this.parameters = {
      speed: 0,
      isJumping: false,
      isAttacking: false,
      isGrounded: true
    };

    // 状态定义
    this.states = new Set([${states.map(s => `'${s}'`).join(', ')}]);

    // 转换规则
    this.transitions = [
      ${transitions.map(t => `{ from: '${t.from}', to: '${t.to}', condition: (params) => ${t.condition.replace(/(\w+)/g, 'params.$1')} }`).join(',\n      ')}
    ];

    // 初始化动画动作
    for (const clip of animations) {
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopRepeat, Infinity);
      this.actions.set(clip.name, action);
    }

    // 播放默认状态
    this.playState(this.currentState);
  }

  /**
   * 设置参数
   */
  setParameter(name, value) {
    this.parameters[name] = value;
  }

  /**
   * 获取参数
   */
  getParameter(name) {
    return this.parameters[name];
  }

  /**
   * 播放状态动画
   */
  playState(stateName, transitionDuration = 0.2) {
    if (!this.states.has(stateName)) {
      console.warn('State not found:', stateName);
      return;
    }

    const newAction = this.actions.get(stateName);
    if (!newAction) {
      console.warn('Animation not found for state:', stateName);
      return;
    }

    const currentAction = this.actions.get(this.currentState);

    if (currentAction && currentAction !== newAction) {
      newAction.reset();
      newAction.setEffectiveWeight(1);
      currentAction.crossFadeTo(newAction, transitionDuration, true);
    }

    newAction.play();
    this.currentState = stateName;
  }

  /**
   * 检查并执行转换
   */
  checkTransitions() {
    for (const transition of this.transitions) {
      // 检查来源状态
      if (transition.from !== '*' && transition.from !== this.currentState) {
        continue;
      }

      // 检查条件
      if (transition.condition(this.parameters)) {
        if (transition.to !== this.currentState) {
          this.playState(transition.to);
          break;
        }
      }
    }
  }

  /**
   * 强制切换状态
   */
  forceState(stateName) {
    this.playState(stateName, 0.1);
  }

  /**
   * 更新（每帧调用）
   */
  update(delta) {
    this.checkTransitions();
    this.mixer.update(delta);
  }

  /**
   * 获取当前状态
   */
  getCurrentState() {
    return this.currentState;
  }
}

// 使用示例
/*
const animator = new AnimatorStateMachine(mixer, animations);

// 在游戏循环中
animator.setParameter('speed', player.velocity.length());
animator.setParameter('isJumping', !player.isGrounded);
animator.update(delta);

// 触发攻击
function attack() {
  animator.setParameter('isAttacking', true);
  animator.forceState('attack');
  setTimeout(() => animator.setParameter('isAttacking', false), 500);
}
*/
`;

    return {
      code: code.trim(),
      description: `创建了包含 ${states.length} 个状态和 ${transitions.length} 个转换的动画状态机`
    };
  }
);

// ============================================================
// 导出工具集
// ============================================================

export const animationTools = {
  create_animation: createAnimation,
  blend_animations: blendAnimations,
  setup_animator: setupAnimator
};
