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
        description: '减少换弹时间',
        effectPerLevel: '-12%换弹时间',
        maxLevel: 5
    },
    {
        id: 'ammoCapacity',
        name: '扩容',
        icon: '📦',
        rarity: 'common',
        description: '增加弹匣容量',
        effectPerLevel: '+2发子弹',
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
        id: 'expBonus',
        name: '经验加成',
        icon: '📈',
        rarity: 'common',
        description: '获得的经验值增加',
        effectPerLevel: '+15%经验',
        maxLevel: 5
    },
    {
        id: 'bulletSpeed',
        name: '子弹加速',
        icon: '🚀',
        rarity: 'common',
        description: '子弹飞行速度提升',
        effectPerLevel: '+20%弹速',
        maxLevel: 3
    },
    {
        id: 'damageReduction',
        name: '减伤',
        icon: '🧱',
        rarity: 'common',
        description: '受到的伤害降低',
        effectPerLevel: '-10%伤害',
        maxLevel: 5
    },
    {
        id: 'regen',
        name: '再生',
        icon: '💗',
        rarity: 'common',
        description: '每隔一段时间恢复HP',
        effectPerLevel: '+0.5HP/10秒',
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
    },

    // ==================== 第二阶段技能 ====================
    {
        id: 'fireBullet',
        name: '火焰弹',
        icon: '🔥',
        rarity: 'rare',
        description: '命中敌人造成燃烧伤害',
        effectPerLevel: '+1秒燃烧',
        maxLevel: 3
    },
    {
        id: 'shieldRam',
        name: '护盾冲撞',
        icon: '💢',
        rarity: 'rare',
        description: '船只撞击敌人时造成伤害',
        effectPerLevel: '+2点撞击伤害',
        maxLevel: 3
    },
    {
        id: 'combo',
        name: '连击',
        icon: '🔗',
        rarity: 'rare',
        description: '连续命中增加伤害',
        effectPerLevel: '+5%伤害/连击',
        maxLevel: 5
    },
    {
        id: 'timeSlow',
        name: '时间减缓',
        icon: '⏳',
        rarity: 'epic',
        description: '周围敌人移动速度降低',
        effectPerLevel: '+10%减速范围',
        maxLevel: 3
    },

    // ==================== 第三阶段技能 ====================
    {
        id: 'splitBullet',
        name: '分裂弹',
        icon: '💠',
        rarity: 'rare',
        description: '子弹命中后分裂成小子弹',
        effectPerLevel: '+2颗分裂弹',
        maxLevel: 3
    },
    {
        id: 'boomerang',
        name: '回旋镖',
        icon: '🪃',
        rarity: 'rare',
        description: '子弹飞出后返回',
        effectPerLevel: '+1次返回',
        maxLevel: 2
    },
    {
        id: 'orbitalBullet',
        name: '弹幕',
        icon: '🌀',
        rarity: 'rare',
        description: '射击时额外发射环绕子弹',
        effectPerLevel: '+1颗环绕弹',
        maxLevel: 3
    },
    {
        id: 'empPulse',
        name: '电磁脉冲',
        icon: '📡',
        rarity: 'epic',
        description: '定期释放脉冲眩晕周围敌人',
        effectPerLevel: '+0.5秒眩晕',
        maxLevel: 3
    },

    // ==================== 第四阶段技能 ====================
    {
        id: 'laserGun',
        name: '激光炮',
        icon: '🔦',
        rarity: 'epic',
        description: '每隔一段时间发射激光，有巨大后坐力',
        effectPerLevel: '-5秒冷却时间',
        maxLevel: 3
    },
    {
        id: 'blackHole',
        name: '黑洞',
        icon: '🕳️',
        rarity: 'epic',
        description: '击杀敌人生成黑洞吸引周围敌人',
        effectPerLevel: '+20%吸引范围',
        maxLevel: 2
    },
    {
        id: 'ghostShip',
        name: '幽灵船',
        icon: '👻',
        rarity: 'epic',
        description: '受伤后短暂无敌',
        effectPerLevel: '+0.3秒无敌时间',
        maxLevel: 3
    },
    {
        id: 'revenge',
        name: '复仇',
        icon: '😈',
        rarity: 'epic',
        description: '受伤时对周围敌人造成伤害',
        effectPerLevel: '+50%反伤范围',
        maxLevel: 3
    }
];

// ==================== 传说技能配置 ====================
// 通过融合两个3级技能获得
export const LEGENDARY_SKILLS = [
    {
        id: 'destructionStrike',
        name: '毁灭打击',
        icon: '💀',
        rarity: 'legendary',
        description: '暴击造成3倍伤害，暴击率+20%',
        effectPerLevel: '+0.5倍暴击伤害，+10%暴击率',
        maxLevel: 3,
        // 融合配方
        recipe: ['damage', 'crit']
    },
    {
        id: 'bulletStorm',
        name: '弹幕风暴',
        icon: '🌪️',
        rarity: 'legendary',
        description: '同时发射8颗子弹，覆盖180°扇形',
        effectPerLevel: '+4颗子弹，+60°覆盖',
        maxLevel: 3,
        recipe: ['double', 'scatter']
    },
    {
        id: 'timeFreeze',
        name: '时间冻结',
        icon: '⏸️',
        rarity: 'legendary',
        description: '每15秒冻结所有敌人2秒',
        effectPerLevel: '+1秒冻结，-3秒冷却',
        maxLevel: 3,
        recipe: ['freeze', 'timeSlow']
    },
    {
        id: 'lifeShield',
        name: '生命护盾',
        icon: '💎',
        rarity: 'legendary',
        description: '护盾吸收的伤害转化为HP，护盾上限+5',
        effectPerLevel: '+3护盾上限，+50%转化效率',
        maxLevel: 3,
        recipe: ['shield', 'lifesteal']
    },
    {
        id: 'gravityField',
        name: '引力场',
        icon: '🌀',
        rarity: 'legendary',
        description: '持续吸引经验球和敌人，吸引范围覆盖全屏',
        effectPerLevel: '+50%吸引速度',
        maxLevel: 3,
        recipe: ['magnet', 'blackHole']
    }
];

// ==================== 融合配方表 ====================
// 快速查找融合配方
export const FUSION_RECIPES = {};
LEGENDARY_SKILLS.forEach(skill => {
    const key1 = `${skill.recipe[0]}_${skill.recipe[1]}`;
    const key2 = `${skill.recipe[1]}_${skill.recipe[0]}`;
    FUSION_RECIPES[key1] = skill;
    FUSION_RECIPES[key2] = skill;
});

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
    // 先在普通技能中查找
    const normalSkill = ALL_SKILLS.find(s => s.id === skillId);
    if (normalSkill) return normalSkill;

    // 再在传说技能中查找
    const legendarySkill = LEGENDARY_SKILLS.find(s => s.id === skillId);
    if (legendarySkill) return legendarySkill;

    return null;
}

/**
 * 检查可用的融合选项
 * @param {Object} playerSkills 玩家当前技能
 * @returns {Array} 可融合的传说技能列表
 */
export function checkFusionOptions(playerSkills) {
    const fusionOptions = [];

    LEGENDARY_SKILLS.forEach(legendarySkill => {
        // 检查是否已经拥有该传说技能
        if (playerSkills[legendarySkill.id]) {
            // 如果已拥有但未满级，可以继续升级
            if (playerSkills[legendarySkill.id] < legendarySkill.maxLevel) {
                fusionOptions.push({
                    ...legendarySkill,
                    canFuse: false,  // 不是融合，是升级
                    isUpgrade: true,
                    currentLevel: playerSkills[legendarySkill.id]
                });
            }
            return;
        }

        // 检查融合条件：两个原料技能都达到3级
        const [skillA, skillB] = legendarySkill.recipe;
        const levelA = playerSkills[skillA] || 0;
        const levelB = playerSkills[skillB] || 0;

        if (levelA >= 3 && levelB >= 3) {
            fusionOptions.push({
                ...legendarySkill,
                canFuse: true,
                isUpgrade: false,
                currentLevel: 0,
                ingredients: [
                    { id: skillA, name: getSkillById(skillA)?.name || skillA },
                    { id: skillB, name: getSkillById(skillB)?.name || skillB }
                ]
            });
        }
    });

    return fusionOptions;
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
