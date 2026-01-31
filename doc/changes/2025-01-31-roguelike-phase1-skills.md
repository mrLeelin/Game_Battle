# 枪豆人 Roguelike 第一阶段技能实现

## 日期
2025-01-31

## 概述
实现 Roguelike 技能系统第一阶段的4个基础技能：经验加成、子弹加速、减伤、再生。

## 修改文件

### 1. server/games/gunbean/GunBeanSkillData.js

**新增技能配置**（4个）：

| ID | 名称 | 图标 | 稀有度 | 描述 | 每级效果 | 最大等级 |
|----|------|------|--------|------|----------|----------|
| expBonus | 经验加成 | 📈 | Common | 获得的经验值增加 | +15%经验 | 5 |
| bulletSpeed | 子弹加速 | 🚀 | Common | 子弹飞行速度提升 | +20%弹速 | 3 |
| damageReduction | 减伤 | 🧱 | Common | 受到的伤害降低 | -10%伤害 | 5 |
| regen | 再生 | 💗 | Common | 每隔一段时间恢复HP | +0.5HP/10秒 | 3 |

### 2. server/games/gunbean/GunBeanHandler.js

**修改内容**：

#### 2.1 游戏状态新增字段
- `lastRegenTime`: 上次再生时间，用于再生技能的定时触发

#### 2.2 collectExpOrb 方法
- 修改经验计算逻辑，使用 `expBonus` 技能替代原来的 `magnet` 技能加成
- 每级 `expBonus` 增加 15% 经验获取

#### 2.3 handleShoot 方法
- 新增 `bulletSpeedLevel` 和 `bulletSpeedMultiplier` 变量
- 子弹速度计算：`CONFIG.BULLET_SPEED * bulletSpeedMultiplier`
- 每级 `bulletSpeed` 增加 20% 弹速

#### 2.4 enemyHitBoat 方法
- 新增减伤计算逻辑
- 取船上所有存活玩家的最高减伤等级
- 每级 `damageReduction` 减少 10% 伤害
- 最低伤害为 1

#### 2.5 updatePhysics 方法
- 新增再生技能效果处理
- 每 10 秒触发一次再生检查
- 取船上所有存活玩家的再生等级总和
- 每级每 10 秒恢复 0.5 HP（向上取整）

## 代码 Diff

### GunBeanSkillData.js
```diff
     {
         id: 'magnet',
         name: '磁铁',
         icon: '🧲',
         rarity: 'common',
         description: '增加经验球吸收范围',
         effectPerLevel: '+50%吸收范围',
         maxLevel: 3
     },
+    {
+        id: 'expBonus',
+        name: '经验加成',
+        icon: '📈',
+        rarity: 'common',
+        description: '获得的经验值增加',
+        effectPerLevel: '+15%经验',
+        maxLevel: 5
+    },
+    {
+        id: 'bulletSpeed',
+        name: '子弹加速',
+        icon: '🚀',
+        rarity: 'common',
+        description: '子弹飞行速度提升',
+        effectPerLevel: '+20%弹速',
+        maxLevel: 3
+    },
+    {
+        id: 'damageReduction',
+        name: '减伤',
+        icon: '🧱',
+        rarity: 'common',
+        description: '受到的伤害降低',
+        effectPerLevel: '-10%伤害',
+        maxLevel: 5
+    },
+    {
+        id: 'regen',
+        name: '再生',
+        icon: '💗',
+        rarity: 'common',
+        description: '每隔一段时间恢复HP',
+        effectPerLevel: '+0.5HP/10秒',
+        maxLevel: 3
+    },
```

### GunBeanHandler.js
```diff
 // 游戏状态新增字段
+            lastRegenTime: 0,        // 上次再生时间（用于再生技能）

 // collectExpOrb 方法
-        const magnetLevel = gamePlayer.skills['magnet'] || 0;
-        const expMultiplier = 1 + magnetLevel * 0.1;
+        const expBonusLevel = gamePlayer.skills['expBonus'] || 0;
+        const expMultiplier = 1 + expBonusLevel * 0.15;

 // handleShoot 方法
+        const bulletSpeedLevel = gamePlayer.skills['bulletSpeed'] || 0;
+        const bulletSpeedMultiplier = 1 + bulletSpeedLevel * 0.2;
+        const finalBulletSpeed = CONFIG.BULLET_SPEED * bulletSpeedMultiplier;
-                    vx: bulletDirX * CONFIG.BULLET_SPEED,
-                    vy: bulletDirY * CONFIG.BULLET_SPEED,
+                    vx: bulletDirX * finalBulletSpeed,
+                    vy: bulletDirY * finalBulletSpeed,

 // enemyHitBoat 方法
+        let maxDamageReductionLevel = 0;
+        boat.playerIds.forEach(pid => {
+            const p = game.players.get(pid);
+            if (p && !p.isDead) {
+                const level = p.skills['damageReduction'] || 0;
+                if (level > maxDamageReductionLevel) {
+                    maxDamageReductionLevel = level;
+                }
+            }
+        });
+        const damageReduction = maxDamageReductionLevel * 0.1;
+        const actualDamage = Math.max(1, Math.round(CONFIG.ENEMY_DAMAGE * (1 - damageReduction)));
-            boat.hp -= CONFIG.ENEMY_DAMAGE;
+            boat.hp -= actualDamage;

 // updatePhysics 方法末尾新增
+        // 再生技能效果
+        if (now - game.lastRegenTime >= 10000) {
+            game.lastRegenTime = now;
+            game.boats.forEach(boat => {
+                if (boat.hp <= 0 || boat.hp >= boat.maxHp) return;
+                let totalRegenLevel = 0;
+                boat.playerIds.forEach(pid => {
+                    const p = game.players.get(pid);
+                    if (p && !p.isDead) {
+                        totalRegenLevel += p.skills['regen'] || 0;
+                    }
+                });
+                if (totalRegenLevel > 0) {
+                    const regenAmount = Math.ceil(totalRegenLevel * 0.5);
+                    boat.hp = Math.min(boat.hp + regenAmount, boat.maxHp);
+                }
+            });
+        }
```

## 功能对比

| 功能 | 修改前 | 修改后 |
|------|--------|--------|
| 技能总数 | 21个 | 25个 |
| 经验加成 | 无（磁铁技能仅增加吸收范围） | 新增 expBonus 技能，每级+15%经验 |
| 子弹速度 | 固定 800 像素/秒 | 可通过 bulletSpeed 技能提升，每级+20% |
| 受伤减免 | 无 | 新增 damageReduction 技能，每级-10%伤害 |
| HP恢复 | 仅通过修复技能立即恢复 | 新增 regen 技能，每10秒自动恢复 |

## 回退方案

如需回退，恢复以下文件到修改前状态：
1. `server/games/gunbean/GunBeanSkillData.js` - 删除4个新增技能配置
2. `server/games/gunbean/GunBeanHandler.js` - 恢复原有逻辑

## 测试建议

1. 启动游戏，升级时检查是否能看到4个新技能
2. 选择经验加成技能，验证经验获取是否增加
3. 选择子弹加速技能，验证子弹飞行速度是否提升
4. 选择减伤技能，验证敌人碰撞时伤害是否降低
5. 选择再生技能，等待10秒验证HP是否自动恢复
