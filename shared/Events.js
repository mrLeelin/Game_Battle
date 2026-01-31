/**
 * Socket 事件名常量
 * 统一管理，避免拼写错误
 */

// ==================== 大厅事件 ====================
// 与游戏类型完全无关，处理登录和房间列表
export const LOBBY_EVENTS = {
    // 客户端 -> 服务端
    SET_USERNAME: 'lobby:setUsername',      // 设置用户名
    SET_AVATAR: 'lobby:setAvatar',          // 设置头像
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

// ==================== 抢球大战专用事件 ====================
// 仅 BallGame 使用
export const BALLGAME_EVENTS = {
    // 客户端 -> 服务端
    PICKUP_BALL: 'ball:pickup',             // 捡起球
    DROP_BALL: 'ball:drop',                 // 放下球
    THROW_BALL: 'ball:throw',               // 投掷球
    SCORE_BALL: 'ball:score',               // 进球得分
    PLAYER_ATTACK: 'ball:playerAttack',     // 玩家攻击（方向）
    PLAYER_ROTATE: 'ball:playerRotate',     // 玩家朝向（鼠标方向）

    // 服务端 -> 客户端
    BALL_SPAWNED: 'ball:spawned',           // 球生成
    BALL_PICKED: 'ball:picked',             // 球被捡起
    BALL_DROPPED: 'ball:dropped',           // 球被放下
    BALL_THROWN: 'ball:thrown',             // 球被投掷
    BALL_SCORED: 'ball:scored',             // 进球通知
    BALL_STOLEN: 'ball:stolen',             // 球被偷走
    TEAM_SCORES: 'ball:teamScores',         // 队伍分数更新
    GAME_COUNTDOWN: 'ball:countdown',       // 倒计时更新
    GAME_RESULT: 'ball:result',             // 游戏结果

    // 道具相关
    ITEM_SPAWNED: 'ball:itemSpawned',       // 道具生成
    ITEM_PICKED: 'ball:itemPicked',         // 道具被捡起
    ITEM_USED: 'ball:itemUsed',             // 道具被使用

    // 攻击与眩晕
    ATTACK_PERFORMED: 'ball:attackPerformed', // 攻击动作广播
    PLAYER_HIT: 'ball:playerHit',           // 玩家被击中
    PLAYER_STUNNED: 'ball:playerStunned',   // 玩家被眩晕
    PLAYER_UNSTUN: 'ball:playerUnstun'      // 玩家眩晕结束
};

// ==================== 枪豆人专用事件 ====================
// 仅 GunBean 使用（肉鸽模式）
export const GUNBEAN_EVENTS = {
    // 客户端 -> 服务端
    SHOOT: 'gunbean:shoot',                 // 射击（方向）
    REVIVE: 'gunbean:revive',               // 复活队友
    PLAYER_ROTATE: 'gunbean:playerRotate',  // 玩家转向（瞄准方向）
    SKILL_SELECT: 'gunbean:skillSelect',    // 选择技能（升级时三选一）
    RELOAD: 'gunbean:reload',               // 手动换弹

    // 服务端 -> 客户端
    PLAYER_UPDATE: 'gunbean:playerUpdate',  // 玩家状态更新（位置、速度）
    BULLET_FIRED: 'gunbean:bulletFired',    // 子弹发射
    BULLET_HIT: 'gunbean:bulletHit',        // 子弹命中
    PLAYER_DIED: 'gunbean:playerDied',      // 玩家死亡
    PLAYER_REVIVED: 'gunbean:playerRevived',// 玩家复活
    ENEMY_SPAWNED: 'gunbean:enemySpawned',  // 敌人生成
    ENEMY_DIED: 'gunbean:enemyDied',        // 敌人死亡
    ENEMY_UPDATE: 'gunbean:enemyUpdate',    // 敌人状态更新
    GAME_RESULT: 'gunbean:result',          // 游戏结果
    BOAT_DESTROYED: 'gunbean:boatDestroyed',// 船只被摧毁
    BOAT_DAMAGED: 'gunbean:boatDamaged',    // 船只受伤（敌人碰撞）

    // 弹药系统事件
    RELOAD_START: 'gunbean:reloadStart',       // 开始换弹
    RELOAD_COMPLETE: 'gunbean:reloadComplete', // 换弹完成
    AMMO_UPDATE: 'gunbean:ammoUpdate',         // 弹药更新

    // 经验系统事件
    EXP_ORB_SPAWNED: 'gunbean:expOrbSpawned',   // 经验球生成
    EXP_ORB_COLLECTED: 'gunbean:expOrbCollected', // 经验球被收集
    EXP_UPDATE: 'gunbean:expUpdate',           // 经验值更新
    LEVEL_UP: 'gunbean:levelUp',               // 升级
    SKILL_CHOICES: 'gunbean:skillChoices',     // 发送三选一技能选项
    SKILL_SELECTED: 'gunbean:skillSelected',   // 技能选择结果
    GAME_PAUSE: 'gunbean:gamePause',           // 游戏暂停（有人升级选技能）
    GAME_RESUME: 'gunbean:gameResume'          // 游戏恢复
};
