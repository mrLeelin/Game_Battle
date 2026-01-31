/**
 * 枪豆人 - 肉鸽技能数据配置
 * 包含所有技能的定义和随机选择逻辑
 * 升级时随机抽取3个技能供玩家选择
 */

// ==================== 统一武器配置 ====================
// 所有玩家使用相同的基础武器
export const DEFAULT_WEAPON = {
    id: 'basic',
    name: '基础枪',
    damage: 1,
    fireRate: 200,      // 射击间隔（毫秒）
    bulletCount: 1,
    spread: 0,
    description: '基础武器'
};

// ==================== 技能配置 ====================
// 升级时随机抽取3个供玩家选择，技能可叠加
export const ALL_SKILLS = [
    // ==================== 基础技能 ====================
    {
        id: 'bounce',
        name: '弹跳',
        icon: '🔄',
        rarity: 'common',
        description: '子弹碰墙反弹',
        effectPerLevel: '+1次反弹',
        maxLevel: 5
    },
    {
        id: 'pierce',
        name: '穿透',
        icon: '➡️',
        rarity: 'common',
        description: '子弹穿透敌人',
        effectPerLevel: '+1个穿透',
        maxLevel: 5
    },
    {
        id: 'heal',
        name: '修复',
        icon: '💚',
        rarity: 'common',
        description: '立即恢复船只HP',
        effectPerLevel: '+3点HP',
        maxLevel: 10,
        immediate: true  // 立即生效，不是持续效果
    },
    {
        id: 'speed',
        name: '加速',
        icon: '💨',
        rarity: 'common',
        description: '后坐力移动增强',
        effectPerLevel: '+15%速度',
        maxLevel: 5
    },
    {
        id: 'shield',
        name: '护盾',
        icon: '🛡️',
        rarity: 'rare',
        description: '获得护盾抵挡伤害',
        effectPerLevel: '+1层护盾',
        maxLevel: 5
    },
    {
        id: 'double',
        name: '双发',
        icon: '✌️',
        rarity: 'rare',
        description: '额外发射子弹',
        effectPerLevel: '+1颗子弹',
        maxLevel: 3
    },
    {
        id: 'damage',
        name: '强化',
        icon: '💪',
        rarity: 'common',
        description: '提升子弹伤害',
        effectPerLevel: '+1伤害',
        maxLevel: 5
    },
    {
        id: 'reload',
        name: '快装',
        icon: '⚡',
        rarity: 'common',
        description: '提升射速',
        effectPerLevel: '+10%射速',
        maxLevel: 5
    },
    {
        id: 'lifesteal',
        name: '吸血',
        icon: '🩸',
        rarity: 'rare',
        description: '击杀敌人恢复HP',
        effectPerLevel: '+1HP/击杀',
        maxLevel: 3
    },
    {
        id: 'crit',
        name: '暴击',
        icon: '💥',
        rarity: 'rare',
        description: '有概率造成双倍伤害',
        effectPerLevel: '+10%暴击率',
        maxLevel: 5
    },
    {
        id: 'range',
        name: '射程',
        icon: '🎯',
        rarity: 'common',
        description: '子弹飞行距离延长',
        effectPerLevel: '+20%射程',
        maxLevel: 3
    },

    // ==================== 新增高级技能 ====================
    {
        id: 'scatter',
        name: '散射',
        icon: '🌟',
        rarity: 'rare',
        description: '发射扇形散射子弹',
        effectPerLevel: '+2颗分散子弹',
        maxLevel: 3
    },
    {
        id: 'chain',
        name: '闪电链',
        icon: '⚡',
        rarity: 'epic',
        description: '子弹命中后跳跃至附近敌人',
        effectPerLevel: '+1次跳跃',
        maxLevel: 3
    },
    {
        id: 'explosive',
        name: '爆炸',
        icon: '💣',
        rarity: 'epic',
        description: '子弹命中后产生范围爆炸',
        effectPerLevel: '+30%爆炸范围',
        maxLevel: 3
    },
    {
        id: 'homing',
        name: '追踪',
        icon: '🎯',
        rarity: 'rare',
        description: '子弹轻微追踪最近敌人',
        effectPerLevel: '+15%追踪强度',
        maxLevel: 3
    },
    {
        id: 'freeze',
        name: '冰冻',
        icon: '❄️',
        rarity: 'rare',
        description: '命中敌人使其减速',
        effectPerLevel: '+15%减速效果',
        maxLevel: 3
    },
    {
        id: 'poison',
        name: '毒素',
        icon: '☠️',
        rarity: 'rare',
        description: '命中敌人持续掉血',
        effectPerLevel: '+1秒持续时间',
        maxLevel: 3
    },
    {
        id: 'magnet',
        name: '磁铁',
        icon: '🧲',
        rarity: 'common',
        description: '增加经验球吸收范围',
        effectPerLevel: '+50%吸收范围',
        maxLevel: 3
    },
    {
        id: 'luck',
        name: '幸运',
        icon: '🍀',
        rarity: 'rare',
        description: '增加稀有技能出现概率',
        effectPerLevel: '+10%稀有率',
        maxLevel: 3
    },
    {
        id: 'multishot',
        name: '多重射击',
        icon: '🔫',
        rarity: 'epic',
        description: '同时向多个方向射击',
        effectPerLevel: '+1个射击方向',
        maxLevel: 2
    }
];

// 稀有度权重（用于随机选择）
const RARITY_WEIGHTS = {
    common: 60,
    rare: 30,
    epic: 10
};

// ==================== 工具函数 ====================

/**
 * 从数组中随机选择n个不重复的元素
 * @param {Array} array 源数组
 * @param {number} n 选择数量
 * @returns {Array} 随机选择的元素
 */
function getRandomItems(array, n) {
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(n, array.length));
}

/**
 * 根据稀有度权重随机选择技能
 * @param {number} count 选择数量
 * @param {Object} playerSkills 玩家当前技能（用于排除已满级技能）
 * @param {number} luckLevel 幸运等级（增加稀有概率）
 * @returns {Array} 随机选择的技能
 */
export function generateSkillChoices(count = 3, playerSkills = {}, luckLevel = 0) {
    // 过滤掉已达到最大等级的技能
    const availableSkills = ALL_SKILLS.filter(skill => {
        const currentLevel = playerSkills[skill.id] || 0;
        return currentLevel < skill.maxLevel;
    });

    if (availableSkills.length === 0) {
        return [];
    }

    // 计算调整后的权重（幸运增加稀有概率）
    const luckBonus = luckLevel * 10; // 每级幸运增加10%稀有概率
    const adjustedWeights = {
        common: Math.max(10, RARITY_WEIGHTS.common - luckBonus),
        rare: RARITY_WEIGHTS.rare + luckBonus * 0.6,
        epic: RARITY_WEIGHTS.epic + luckBonus * 0.4
    };

    // 根据权重随机选择
    const weightedSkills = [];
    availableSkills.forEach(skill => {
        const weight = adjustedWeights[skill.rarity] || adjustedWeights.common;
        for (let i = 0; i < weight; i++) {
            weightedSkills.push(skill);
        }
    });

    // 随机选择不重复的技能
    const selected = [];
    const usedIds = new Set();

    while (selected.length < count && weightedSkills.length > 0) {
        const index = Math.floor(Math.random() * weightedSkills.length);
        const skill = weightedSkills[index];

        if (!usedIds.has(skill.id)) {
            selected.push(skill);
            usedIds.add(skill.id);
        }

        // 移除所有该技能的实例
        for (let i = weightedSkills.length - 1; i >= 0; i--) {
            if (weightedSkills[i].id === skill.id) {
                weightedSkills.splice(i, 1);
            }
        }
    }

    return selected;
}

/**
 * 获取技能配置
 * @param {string} skillId 技能ID
 * @returns {Object|null}
 */
export function getSkillById(skillId) {
    return ALL_SKILLS.find(s => s.id === skillId) || null;
}

/**
 * 计算升级所需经验
 * 公式：level * 50 + 50
 * @param {number} level 当前等级
 * @returns {number} 升级所需经验
 */
export function getExpForLevel(level) {
    return level * 50 + 50;
}

/**
 * 经验球配置
 */
export const EXP_ORB_CONFIG = {
    BASE_EXP: 10,           // 基础经验值
    ATTRACT_RANGE: 100,     // 吸附范围（像素）
    ATTRACT_SPEED: 300,     // 吸附速度（像素/秒）
    LIFETIME: 30000,        // 存活时间（毫秒）
    RADIUS: 8               // 碰撞半径
};
