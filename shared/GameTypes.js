/**
 * 游戏类型注册表
 * 添加新游戏只需在此注册，并创建对应的游戏模块
 */

export const GAME_TYPES = {
    GUNBEAN: {
        id: 'gunbean',
        name: '4猴一舟',
        description: '2D海上射击，靠后坐力移动小船，合作生存',
        icon: '🚤',
        minPlayers: 1,
        maxPlayers: 4,
        gameDuration: 120,
        clientModule: './games/gunbean/GunBeanGame.js',
        serverHandler: './games/gunbean/GunBeanHandler.js'
    }
};

/**
 * 获取游戏列表（用于 UI 展示）
 * @returns {Array} 游戏配置数组
 */
export function getGameList() {
    return Object.values(GAME_TYPES);
}

/**
 * 根据 ID 获取游戏配置
 * @param {string} gameId - 游戏ID
 * @returns {Object|undefined} 游戏配置
 */
export function getGameConfig(gameId) {
    return Object.values(GAME_TYPES).find(g => g.id === gameId);
}

/**
 * 检查游戏是否存在
 * @param {string} gameId - 游戏ID
 * @returns {boolean}
 */
export function isValidGameType(gameId) {
    return Object.values(GAME_TYPES).some(g => g.id === gameId);
}
