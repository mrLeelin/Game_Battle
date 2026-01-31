# 修复枪豆人肉鸽面板只有一个玩家显示的Bug

## 问题描述
多人游戏时，当多个玩家同时升级，只有第一个玩家会出现肉鸽技能选择面板，其他玩家看不到面板。

## 根本原因
服务端在发送 `SKILL_CHOICES` 事件时，数据结构不一致：
- 正常情况（直接socket发送）：**没有包含 `playerId` 字段**
- 异常情况（房间广播）：包含 `playerId` 字段

客户端的判断逻辑依赖 `playerId` 来过滤事件：
```javascript
if (data.playerId && data.playerId !== this.localPlayerId) {
    return; // 不是发给自己的，忽略
}
```

## 修复方案
在 `server/games/gunbean/GunBeanHandler.js` 的 `playerLevelUp` 方法中，为直接发送的 `SKILL_CHOICES` 事件添加 `playerId` 字段，保持数据结构一致。

## 修改内容
- 文件：`server/games/gunbean/GunBeanHandler.js`
- 行数：509-513

```diff
         const socket = this.io.sockets.sockets.get(gamePlayer.id);
         if (socket) {
             console.log(`[GunBeanHandler] 发送技能选择界面给玩家 ${gamePlayer.name}`);
             socket.emit(GUNBEAN_EVENTS.SKILL_CHOICES, {
+                playerId: gamePlayer.id,
                 level: gamePlayer.level,
                 choices: choicesData,
                 fusionOptions: fusionData
             });
```

## 测试验证
1. 多人游戏同时升级
2. 确认每个玩家都能看到自己的技能选择面板
3. 确认玩家之间不会互相干扰

## 日期
2025-01-31
