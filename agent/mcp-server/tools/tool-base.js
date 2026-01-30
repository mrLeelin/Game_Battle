/**
 * 工具基类 - 提供通用工具结构
 */

/**
 * 创建工具的辅助函数
 * @param {string} name - 工具名称
 * @param {string} description - 工具描述
 * @param {string} category - 工具分类
 * @param {object} parameters - 参数定义
 * @param {Function} executeFn - 执行函数
 * @returns {object} - 工具对象
 */
export function createTool(name, description, category, parameters, executeFn) {
  return {
    name,
    description,
    category,
    parameters,
    execute: executeFn
  };
}

/**
 * 参数类型定义
 */
export const ParamTypes = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  ARRAY: 'array',
  OBJECT: 'object',
  VECTOR3: 'vector3',
  COLOR: 'color',
  FILE_PATH: 'filepath'
};

/**
 * 工具分类
 */
export const ToolCategories = {
  SCENE: 'scene',
  MODEL: 'model',
  ANIMATION: 'animation',
  PHYSICS: 'physics',
  NETWORK: 'network',
  MATERIAL: 'material',
  OPTIMIZE: 'optimize',
  DEBUG: 'debug'
};

/**
 * 验证参数
 * @param {object} params - 用户提供的参数
 * @param {object} schema - 参数模式定义
 * @returns {object} - { valid: boolean, errors: string[] }
 */
export function validateParams(params, schema) {
  const errors = [];

  for (const [key, def] of Object.entries(schema)) {
    const value = params[key];

    // 检查必需参数
    if (def.required && (value === undefined || value === null)) {
      errors.push(`Missing required parameter: ${key}`);
      continue;
    }

    // 如果参数存在，检查类型
    if (value !== undefined && value !== null) {
      if (!validateType(value, def.type)) {
        errors.push(`Invalid type for ${key}: expected ${def.type}, got ${typeof value}`);
      }

      // 检查范围
      if (def.min !== undefined && value < def.min) {
        errors.push(`${key} must be at least ${def.min}`);
      }
      if (def.max !== undefined && value > def.max) {
        errors.push(`${key} must be at most ${def.max}`);
      }

      // 检查枚举值
      if (def.enum && !def.enum.includes(value)) {
        errors.push(`${key} must be one of: ${def.enum.join(', ')}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 类型验证
 */
function validateType(value, type) {
  switch (type) {
    case ParamTypes.STRING:
      return typeof value === 'string';
    case ParamTypes.NUMBER:
      return typeof value === 'number' && !isNaN(value);
    case ParamTypes.BOOLEAN:
      return typeof value === 'boolean';
    case ParamTypes.ARRAY:
      return Array.isArray(value);
    case ParamTypes.OBJECT:
      return typeof value === 'object' && !Array.isArray(value);
    case ParamTypes.VECTOR3:
      return typeof value === 'object' &&
             typeof value.x === 'number' &&
             typeof value.y === 'number' &&
             typeof value.z === 'number';
    case ParamTypes.COLOR:
      return typeof value === 'string' || typeof value === 'number';
    case ParamTypes.FILE_PATH:
      return typeof value === 'string';
    default:
      return true;
  }
}

/**
 * 代码模板引擎
 * @param {string} template - 模板字符串
 * @param {object} data - 数据对象
 * @returns {string} - 渲染后的代码
 */
export function renderTemplate(template, data) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data.hasOwnProperty(key) ? data[key] : match;
  });
}

/**
 * 格式化代码
 * @param {string} code - 代码字符串
 * @returns {string} - 格式化后的代码
 */
export function formatCode(code) {
  // 简单的代码格式化
  let indentLevel = 0;
  const lines = code.split('\n');
  const formattedLines = [];

  for (let line of lines) {
    const trimmed = line.trim();

    // 减少缩进（在处理当前行之前）
    if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    // 添加缩进
    if (trimmed) {
      formattedLines.push('  '.repeat(indentLevel) + trimmed);
    } else {
      formattedLines.push('');
    }

    // 增加缩进（在处理当前行之后）
    if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
      indentLevel++;
    }
  }

  return formattedLines.join('\n');
}

/**
 * 生成唯一 ID
 */
export function generateId(prefix = '') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}
