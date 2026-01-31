/**
 * 全局常量定义
 * 客户端和服务端共享
 */

// 房间配置
export const ROOM = {
    MAX_PLAYERS: 4,
    MIN_PLAYERS: 1,
    STATUS: {
        WAITING: 'waiting',   // 匹配中 - 可加入
        RUNNING: 'running'    // 游戏中 - 不可加入
    }
};

// 玩家状态
export const PLAYER = {
    STATUS: {
        NOT_READY: 'not_ready',
        READY: 'ready'
    }
};

// 网络配置
export const NETWORK = {
    SERVER_PORT: 3000,
    CLIENT_PORT: 8080,
    TICK_RATE: 60  // 服务端更新频率
};
