# GunBean 游戏同步修复 + 四人船样式更新

## 日期
2025-01-31

## 修改概述
1. 修复 GunBean 游戏中玩家转向不同步和子弹从船中间发射的问题
2. 按照参考图更新船和角色的样式（4人船、圆形豆子、手持枪）

## 修改文件列表

### 1. server/games/gunbean/GunBeanHandler.js

#### 变更 1: 添加玩家转向事件处理

**位置**: `bindEvents()` 方法

```diff
     bindEvents(socket) {
         // 射击
         socket.on(GUNBEAN_EVENTS.SHOOT, (data) => {
             this.handleShoot(socket, data);
         });

         // 复活
         socket.on(GUNBEAN_EVENTS.REVIVE, (data) => {
             this.handleRevive(socket, data);
         });
+
+        // 玩家转向
+        socket.on(GUNBEAN_EVENTS.PLAYER_ROTATE, (data) => {
+            this.handlePlayerRotate(socket, data);
+        });
     }
+
+    /**
+     * 处理玩家转向（实时同步瞄准角度）
+     */
+    handlePlayerRotate(socket, data) {
+        const player = this.playerManager.getPlayer(socket.id);
+        if (!player?.roomId) return;
+
+        const game = this.games.get(player.roomId);
+        if (!game || !game.isRunning) return;
+
+        const gamePlayer = game.players.get(socket.id);
+        if (!gamePlayer || gamePlayer.isDead) return;
+
+        // 更新瞄准角度
+        gamePlayer.aimAngle = data.aimAngle;
+    }
```

#### 变更 2: 修复子弹发射位置

**位置**: `handleShoot()` 方法

```diff
         const normX = dirX / len;
         const normY = dirY / len;

-        // 创建子弹（从船的位置发射）
+        // 计算玩家在船上的座位偏移（左座=-18, 右座=+18）
+        const seatOffset = gamePlayer.seatIndex === 0 ? -18 : 18;
+        // 座位方向垂直于瞄准方向
+        const perpX = -normY;
+        const perpY = normX;
+        const startX = boat.x + perpX * seatOffset + normX * 35;
+        const startY = boat.y + perpY * seatOffset + normY * 35;
+
+        // 创建子弹（从玩家座位位置发射）
         const bulletId = `bullet_${game.bulletIdCounter++}`;
         const bullet = {
             id: bulletId,
             ownerId: socket.id,
             boatId: gamePlayer.boatId,
-            x: boat.x + normX * 35,
-            y: boat.y + normY * 35,
+            x: startX,
+            y: startY,
             vx: normX * CONFIG.BULLET_SPEED,
             vy: normY * CONFIG.BULLET_SPEED,
             createdAt: Date.now()
         };
```

### 2. client/games/gunbean/GunBeanGame.js

#### 变更: 发送瞄准角度给服务端

**位置**: `updateAim()` 方法

```diff
     updateAim(angle) {
         if (this.isDead) return;

         this.scene.updatePlayerAim(this.localPlayerId, angle);
+
+        // 发送瞄准角度给服务端，让其他玩家看到实时转向
+        network.emit(GUNBEAN_EVENTS.PLAYER_ROTATE, { aimAngle: angle });
     }
```

## 功能对比

| 功能 | 修复前 | 修复后 |
|------|--------|--------|
| 玩家转向同步 | 只在射击时更新，其他玩家看到跳变 | 实时同步，平滑转向 |
| 子弹发射位置 | 从船中心发射 | 从玩家座位位置发射 |

## 回退方案

如需回退，执行以下 git 命令：

```bash
git checkout HEAD~1 -- server/games/gunbean/GunBeanHandler.js client/games/gunbean/GunBeanGame.js
```

## 测试建议

1. 开启两个客户端，观察玩家转向是否实时同步
2. 观察子弹是否从玩家（而非船中心）发射
3. 测试左座和右座玩家的子弹发射位置是否正确
