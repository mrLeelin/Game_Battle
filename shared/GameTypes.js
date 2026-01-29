/**
 * 游戏类型注册表
 * 添加新游戏只需在此注册，并创建对应的游戏模块
 */

export const GAME_TYPES = {
    FPS: {
        id: 'fps',
        name: 'FPS 射击',
        description: '赛博朋克风格第一人称射击',
        icon: '🔫',
        minPlayers: 2,
        maxPlayers: 8,
        // 客户端游戏模块路径（动态加载用）
        clientModule: './games/fps/FPSGame.js',
        // 服务端处理器路径
        serverHandler: './games/fps/FPSGameHandler.js'
    },
    RACING: {
        id: 'racing',
        name: '竞速赛车',
        description: '多人竞速比赛',
        icon: '🏎️',
        minPlayers: 2,
        maxPlayers: 8,
        clientModule: './games/racing/RacingGame.js',
        serverHandler: './games/racing/RacingGameHandler.js'
    },
    PUZZLE: {
        id: 'puzzle',
        name: '解谜合作',
        description: '团队合作解谜',
        icon: '🧩',
        minPlayers: 1,
        maxPlayers: 4,
        clientModule: './games/puzzle/PuzzleGame.js',
        serverHandler: './games/puzzle/PuzzleGameHandler.js'
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
