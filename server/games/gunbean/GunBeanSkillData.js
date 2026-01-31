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
    damage: 3,
    fireRate: 200,      // 射击间隔（毫秒）
    bulletCount: 1,
    spread: 0,
    description: '基础武器'
};

// ==================== 技能配置 ====================
// 升级时随机抽取3个供玩家选择，技能可叠加
export const ALL_SKILLS = [
    {
        id: 'bounce',
        name: '弹射',
        icon: '🔄',
        rarity: 'common',
        description: '子弹碰墙反弹',
        effectPerLevel: '+1次反弹',
        maxLevel: 5
    },
    {
        id: 'scatter',
        name: '散射',
        icon: '🌟',
        rarity: 'common',
        description: '发射扇形散射子弹',
        effectPerLevel: '+2颗分散子弹',
        maxLevel: 5
    },
    {
        id: 'splitBullet',
        name: '分裂弹',
        icon: '💠',
        rarity: 'common',
        description: '子弹命中后分裂成小子弹',
        effectPerLevel: '+2颗分裂弹',
        maxLevel: 5
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
        description: '减少换弹时间',
        effectPerLevel: '-12%换弹时间',
        maxLevel: 5
    },
    {
        id: 'heal',
        name: '回复',
        icon: '❤️',
        rarity: 'common',
        description: '立即恢复生命值',
        effectPerLevel: '+3生命值',
        maxLevel: 5,
        immediate: true
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
    ATTRACT_RANGE: 300,     // 吸附范围（像素）- 扩大3倍
    ATTRACT_SPEED: 800,     // 吸附速度（像素/秒）- 提升匹配船速
    LIFETIME: 30000,        // 存活时间（毫秒）
    RADIUS: 8               // 碰撞半径
};
