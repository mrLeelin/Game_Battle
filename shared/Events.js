/**
 * Socket 事件名常量
 * 统一管理，避免拼写错误
 */

// ==================== 大厅事件 ====================
// 与游戏类型完全无关，处理登录和房间列表
export const LOBBY_EVENTS = {
    // 客户端 -> 服务端
    SET_USERNAME: 'lobby:setUsername',      // 设置用户名
    GET_ROOM_LIST: 'lobby:getRoomList',     // 请求房间列表
    CREATE_ROOM: 'lobby:createRoom',        // 创建房间
    JOIN_ROOM: 'lobby:joinRoom',            // 加入房间

    // 服务端 -> 客户端
    ROOM_LIST: 'lobby:roomList',            // 房间列表更新
    JOIN_SUCCESS: 'lobby:joinSuccess',      // 加入成功
    JOIN_FAILED: 'lobby:joinFailed',        // 加入失败（房间满/游戏中）
    ERROR: 'lobby:error'                    // 错误消息
};

// ==================== 房间事件 ====================
// 游戏开始前的房间管理
export const ROOM_EVENTS = {
    // 客户端 -> 服务端
    LEAVE_ROOM: 'room:leave',               // 离开房间
    TOGGLE_READY: 'room:toggleReady',       // 切换准备状态
    SET_GAME_TYPE: 'room:setGameType',      // 房主设置游戏类型
    START_GAME: 'room:startGame',           // 房主开始游戏
    CHAT: 'room:chat',                      // 房间聊天
    DANMAKU_SEND: 'room:danmakuSend',       // 发送弹幕

    // 服务端 -> 客户端
    STATE_UPDATE: 'room:stateUpdate',       // 房间状态更新（玩家列表、准备状态等）
    PLAYER_JOINED: 'room:playerJoined',     // 新玩家加入
    PLAYER_LEFT: 'room:playerLeft',         // 玩家离开
    HOST_CHANGED: 'room:hostChanged',       // 房主变更
    GAME_TYPE_CHANGED: 'room:gameTypeChanged', // 游戏类型变更
    GAME_STARTING: 'room:gameStarting',     // 游戏即将开始
    CHAT_MESSAGE: 'room:chatMessage',        // 聊天消息
    DANMAKU_BROADCAST: 'room:danmakuBroadcast' // 弹幕广播
};

// ==================== 游戏通用事件 ====================
// 所有游戏共享的基础事件
export const GAME_EVENTS = {
    // 生命周期
    INIT: 'game:init',                      // 游戏初始化
    START: 'game:start',                    // 游戏正式开始
    END: 'game:end',                        // 游戏结束
    RETURN_TO_ROOM: 'game:returnToRoom',    // 返回房间

    // 玩家同步
    PLAYER_MOVE: 'game:playerMove',         // 玩家移动
    PLAYER_ACTION: 'game:playerAction',     // 玩家动作（通用）
    PLAYER_STATE: 'game:playerState',       // 玩家状态同步

    // 游戏状态
    STATE_SYNC: 'game:stateSync',           // 完整状态同步
    EVENT: 'game:event',                    // 游戏内事件（通用）

    // 断线处理
    PLAYER_DISCONNECTED: 'game:playerDisconnected',
    PLAYER_RECONNECTED: 'game:playerReconnected'
};

// ==================== FPS 游戏专用事件 ====================
// 仅 FPS 游戏使用
export const FPS_EVENTS = {
    SHOOT: 'fps:shoot',                     // 射击
    HIT: 'fps:hit',                         // 命中
    KILL: 'fps:kill',                       // 击杀
    DEATH: 'fps:death',                     // 死亡
    RESPAWN: 'fps:respawn',                 // 重生
    RELOAD: 'fps:reload',                   // 换弹
    HEALTH_UPDATE: 'fps:healthUpdate',      // 血量更新
    SCORE_UPDATE: 'fps:scoreUpdate'         // 分数更新
};
