/**
 * 枪豆人 - 商店数据配置
 * 包含所有枪械和技能的定义，以及随机选择逻辑
 */

// ==================== 枪械配置 ====================
// 每轮随机抽取5个展示在商店中
export const ALL_WEAPONS = [
    {
        id: 'pistol',
        name: '手枪',
        price: 0,
        damage: 1,
        fireRate: 200,
        bulletCount: 1,
        spread: 0,
        description: '基础武器'
    },
    {
        id: 'shotgun',
        name: '霰弹枪',
        price: 50,
        damage: 1,
        fireRate: 600,
        bulletCount: 3,
        spread: 0.3,
        description: '3发散射'
    },
    {
        id: 'machinegun',
        name: '机枪',
        price: 80,
        damage: 1,
        fireRate: 80,
        bulletCount: 1,
        spread: 0.1,
        description: '极高射速'
    },
    {
        id: 'sniper',
        name: '狙击枪',
        price: 100,
        damage: 5,
        fireRate: 1200,
        bulletCount: 1,
        spread: 0,
        description: '高伤害单发'
    },
    {
        id: 'smg',
        name: '冲锋枪',
        price: 60,
        damage: 1,
        fireRate: 120,
        bulletCount: 1,
        spread: 0.05,
        description: '快速连射'
    },
    {
        id: 'revolver',
        name: '左轮',
        price: 70,
        damage: 3,
        fireRate: 400,
        bulletCount: 1,
        spread: 0,
        description: '中等伤害'
    },
    {
        id: 'launcher',
        name: '榴弹炮',
        price: 150,
        damage: 8,
        fireRate: 1500,
        bulletCount: 1,
        spread: 0,
        description: '超高伤害'
    },
    {
        id: 'laser',
        name: '激光枪',
        price: 120,
        damage: 1,
        fireRate: 50,
        bulletCount: 1,
        spread: 0,
        description: '极速射击'
    },
    {
        id: 'dualgun',
        name: '双持手枪',
        price: 90,
        damage: 1,
        fireRate: 150,
        bulletCount: 2,
        spread: 0.15,
        description: '双发齐射'
    },
    {
        id: 'cannon',
        name: '加农炮',
        price: 180,
        damage: 10,
        fireRate: 2000,
        bulletCount: 1,
        spread: 0,
        description: '毁灭打击'
    }
];

// ==================== 技能配置 ====================
// 每轮随机抽取6个展示在商店中，技能可叠加
export const ALL_SKILLS = [
    {
        id: 'bounce',
        name: '弹跳',
        price: 60,
        description: '子弹碰墙反弹',
        effectPerLevel: '+1次反弹',
        maxLevel: 5
    },
    {
        id: 'pierce',
        name: '穿透',
        price: 70,
        description: '子弹穿透敌人',
        effectPerLevel: '+1个穿透',
        maxLevel: 5
    },
    {
        id: 'heal',
        name: '修复',
        price: 40,
        description: '恢复船只HP',
        effectPerLevel: '+3点HP',
        maxLevel: 10,
        immediate: true
    },
    {
        id: 'speed',
        name: '加速',
        price: 50,
        description: '后坐力移动增强',
        effectPerLevel: '+15%速度',
        maxLevel: 5
    },
    {
        id: 'shield',
        name: '护盾',
        price: 80,
        description: '免疫伤害',
        effectPerLevel: '+1次护盾',
        maxLevel: 5
    },
    {
        id: 'double',
        name: '双发',
        price: 100,
        description: '额外发射子弹',
        effectPerLevel: '+1颗子弹',
        maxLevel: 3
    },
    {
        id: 'damage',
        name: '强化',
        price: 90,
        description: '提升伤害',
        effectPerLevel: '+1伤害',
        maxLevel: 5
    },
    {
        id: 'reload',
        name: '快装',
        price: 45,
        description: '提升射速',
        effectPerLevel: '+10%射速',
        maxLevel: 5
    },
    {
        id: 'lifesteal',
        name: '吸血',
        price: 110,
        description: '击杀恢复HP',
        effectPerLevel: '+1HP/击杀',
        maxLevel: 3
    },
    {
        id: 'crit',
        name: '暴击',
        price: 85,
        description: '暴击率提升',
        effectPerLevel: '+10%暴击',
        maxLevel: 5
    },
    {
        id: 'range',
        name: '射程',
        price: 55,
        description: '子弹存活时间延长',
        effectPerLevel: '+20%射程',
        maxLevel: 3
    },
    {
        id: 'recoil',
        name: '稳定',
        price: 65,
        description: '减少后坐力影响',
        effectPerLevel: '-15%后坐',
        maxLevel: 3
    }
];

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
 * 生成本轮商店数据
 * 手枪始终在第一位（免费默认武器）
 * @returns {{ weapons: Array, skills: Array }}
 */
export function generateShopData() {
    // 武器：手枪必选 + 随机4个其他武器
    const pistol = ALL_WEAPONS.find(w => w.id === 'pistol');
    const otherWeapons = ALL_WEAPONS.filter(w => w.id !== 'pistol');
    const randomWeapons = getRandomItems(otherWeapons, 4);
    const weapons = [pistol, ...randomWeapons];

    // 技能：随机6个
    const skills = getRandomItems(ALL_SKILLS, 6);

    return { weapons, skills };
}

/**
 * 获取武器配置
 * @param {string} weaponId 武器ID
 * @returns {Object|null}
 */
export function getWeaponById(weaponId) {
    return ALL_WEAPONS.find(w => w.id === weaponId) || null;
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
 * 默认武器
 */
export const DEFAULT_WEAPON = ALL_WEAPONS.find(w => w.id === 'pistol');
