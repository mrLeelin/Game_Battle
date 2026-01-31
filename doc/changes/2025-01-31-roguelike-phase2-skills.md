# 枪豆人 Roguelike 第二阶段技能实现

## 日期
2025-01-31

## 概述
实现 Roguelike 技能系统第二阶段的4个中等难度技能：火焰弹、护盾冲撞、连击、时间减缓。

## 修改文件

### 1. server/games/gunbean/GunBeanSkillData.js

**新增技能配置**（4个）：

| ID | 名称 | 图标 | 稀有度 | 描述 | 每级效果 | 最大等级 |
|----|------|------|--------|------|----------|----------|
| fireBullet | 火焰弹 | 🔥 | Rare | 命中敌人造成燃烧伤害 | +1秒燃烧 | 3 |
| shieldRam | 护盾冲撞 | 💢 | Rare | 船只撞击敌人时造成伤害 | +2点撞击伤害 | 3 |
| combo | 连击 | 🔗 | Rare | 连续命中增加伤害 | +5%伤害/连击 | 5 |
| timeSlow | 时间减缓 | ⏳ | Epic | 周围敌人移动速度降低 | +10%减速范围 | 3 |

### 2. server/games/gunbean/GunBeanHandler.js

**修改内容**：

#### 2.1 玩家数据新增字段
- `comboCount`: 当前连击数
- `lastHitTime`: 上次命中时间

#### 2.2 hitEnemy 方法
- 新增连击系统：2秒内连续命中算连击
- 每级每次连击增加5%伤害
- 新增火焰弹效果：命中敌人造成燃烧状态

#### 2.3 handleShoot 方法
- 新增 `fireLevel` 变量读取火焰弹技能等级
- 子弹对象新增 `fire` 属性

#### 2.4 updatePhysics 方法
- 新增燃烧伤害处理（每秒1点伤害）
- 新增燃烧状态过期清除
- 新增时间减缓效果（基础范围150，每级+10%，范围内敌人减速30%）
- 新增护盾冲撞效果（船只与敌人碰撞时，每级造成2点伤害）

## 代码 Diff

### GunBeanSkillData.js
```diff
+    // ==================== 第二阶段技能 ====================
+    {
+        id: 'fireBullet',
+        name: '火焰弹',
+        icon: '🔥',
+        rarity: 'rare',
+        description: '命中敌人造成燃烧伤害',
+        effectPerLevel: '+1秒燃烧',
+        maxLevel: 3
+    },
+    {
+        id: 'shieldRam',
+        name: '护盾冲撞',
+        icon: '💢',
+        rarity: 'rare',
+        description: '船只撞击敌人时造成伤害',
+        effectPerLevel: '+2点撞击伤害',
+        maxLevel: 3
+    },
+    {
+        id: 'combo',
+        name: '连击',
+        icon: '🔗',
+        rarity: 'rare',
+        description: '连续命中增加伤害',
+        effectPerLevel: '+5%伤害/连击',
+        maxLevel: 5
+    },
+    {
+        id: 'timeSlow',
+        name: '时间减缓',
+        icon: '⏳',
+        rarity: 'epic',
+        description: '周围敌人移动速度降低',
+        effectPerLevel: '+10%减速范围',
+        maxLevel: 3
+    }
```

### GunBeanHandler.js
```diff
 // 玩家数据新增字段
+                // 连击系统
+                comboCount: 0,          // 当前连击数
+                lastHitTime: 0          // 上次命中时间

 // hitEnemy 方法 - 连击系统
+            // ========== 连击系统 ==========
+            const comboLevel = killer.skills['combo'] || 0;
+            if (comboLevel > 0) {
+                if (now - killer.lastHitTime < 2000) {
+                    killer.comboCount++;
+                } else {
+                    killer.comboCount = 1;
+                }
+                killer.lastHitTime = now;
+                const comboBonus = 1 + (killer.comboCount - 1) * comboLevel * 0.05;
+                damage = Math.ceil(damage * comboBonus);
+            }

 // hitEnemy 方法 - 火焰弹效果
+        // ========== 火焰弹效果 ==========
+        if (bullet.fire > 0) {
+            enemy.burning = true;
+            enemy.burnDamage = 1;
+            enemy.burningUntil = Date.now() + bullet.fire * 1000;
+            enemy.burnOwner = bullet.ownerId;
+            enemy.lastBurnTick = Date.now();
+        }

 // handleShoot 方法
+        const fireLevel = gamePlayer.skills['fireBullet'] || 0;
+                    fire: fireLevel,  // 火焰弹

 // updatePhysics 方法 - 时间减缓
+            // ========== 时间减缓效果 ==========
+            game.boats.forEach(boat => {
+                if (boat.hp <= 0) return;
+                let maxTimeSlowLevel = 0;
+                boat.playerIds.forEach(pid => {
+                    const p = game.players.get(pid);
+                    if (p && !p.isDead) {
+                        const level = p.skills['timeSlow'] || 0;
+                        if (level > maxTimeSlowLevel) {
+                            maxTimeSlowLevel = level;
+                        }
+                    }
+                });
+                if (maxTimeSlowLevel > 0) {
+                    const slowRange = 150 * (1 + maxTimeSlowLevel * 0.1);
+                    const dx = boat.x - enemy.x;
+                    const dy = boat.y - enemy.y;
+                    const dist = Math.sqrt(dx * dx + dy * dy);
+                    if (dist < slowRange) {
+                        speedMult *= 0.7;
+                        enemy.timeSlowed = true;
+                    }
+                }
+            });

 // updatePhysics 方法 - 护盾冲撞
+                    // ========== 护盾冲撞效果 ==========
+                    let totalShieldRamLevel = 0;
+                    nearestBoat.playerIds.forEach(pid => {
+                        const p = game.players.get(pid);
+                        if (p && !p.isDead) {
+                            totalShieldRamLevel += p.skills['shieldRam'] || 0;
+                        }
+                    });
+                    if (totalShieldRamLevel > 0) {
+                        const ramDamage = totalShieldRamLevel * 2;
+                        enemy.hp -= ramDamage;
+                        if (enemy.hp <= 0) {
+                            // 找击杀者并击杀敌人
+                            this.killEnemy(game, enemy, killerId);
+                            return;
+                        }
+                    }

 // updatePhysics 方法 - 燃烧伤害
+            // ========== 燃烧伤害 ==========
+            if (enemy.burning && now - enemy.lastBurnTick > 1000) {
+                enemy.hp -= enemy.burnDamage || 1;
+                enemy.lastBurnTick = now;
+                if (enemy.hp <= 0) {
+                    this.killEnemy(game, enemy, enemy.burnOwner);
+                }
+            }
+            if (enemy.burningUntil && now > enemy.burningUntil) {
+                enemy.burning = false;
+            }
```

## 功能对比

| 功能 | 修改前 | 修改后 |
|------|--------|--------|
| 技能总数 | 25个 | 29个 |
| 持续伤害类型 | 毒素 | 毒素 + 燃烧 |
| 船只碰撞 | 仅受伤 | 可通过护盾冲撞反击 |
| 伤害加成 | 暴击 | 暴击 + 连击 |
| 敌人减速 | 冰冻（命中触发） | 冰冻 + 时间减缓（范围光环） |

## 技能机制说明

### 火焰弹 🔥
- 命中敌人后造成燃烧状态
- 每秒造成1点燃烧伤害
- 持续时间 = 技能等级 × 1秒
- 与毒素可叠加

### 护盾冲撞 💢
- 船只与敌人碰撞时触发
- 伤害 = 船上所有存活玩家的技能等级总和 × 2
- 如果撞死敌人，船只不受伤害
- 适合近战玩法

### 连击 🔗
- 2秒内连续命中算连击
- 伤害加成 = (连击数 - 1) × 技能等级 × 5%
- 超过2秒未命中，连击数重置为1
- 与暴击可叠加

### 时间减缓 ⏳
- 以船只为中心的减速光环
- 基础范围150像素，每级增加10%
- 范围内敌人减速30%
- 与冰冻效果可叠加

## 回退方案

如需回退，恢复以下文件到修改前状态：
1. `server/games/gunbean/GunBeanSkillData.js` - 删除4个新增技能配置
2. `server/games/gunbean/GunBeanHandler.js` - 恢复原有逻辑

## 测试建议

1. 启动游戏，升级时检查是否能看到4个新技能
2. 选择火焰弹技能，验证敌人是否持续燃烧掉血
3. 选择护盾冲撞技能，验证船只撞击敌人时是否造成伤害
4. 选择连击技能，快速连续命中敌人验证伤害是否递增
5. 选择时间减缓技能，验证船只周围敌人是否减速
