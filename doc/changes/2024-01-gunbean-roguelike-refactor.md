# GunBean 肉鸽模式重构

## 日期
2024-01

## 变更概述
将枪豆人游戏从商店轮次模式改为肉鸽无限生存模式。

## 核心变更

### 移除的功能
- 商店系统（武器购买）
- 轮次系统（30-90秒倒计时）
- 金币系统
- 武器选择（所有玩家统一武器）
- 时间倒计时

### 新增的功能
- **经验系统**：敌人死亡掉落经验球，玩家靠近自动吸收
- **升级系统**：经验值达到阈值后升级，公式为 `level * 50 + 50`
- **三选一技能**：升级时暂停游戏，显示3个技能供选择
- **技能系统**：20种技能，分为普通/稀有/史诗三档
- **难度递增**：每30秒增加难度等级

### 技能列表
| 技能ID | 名称 | 稀有度 | 效果 |
|--------|------|--------|------|
| bounce | 反弹 | 普通 | 子弹撞墙反弹 |
| pierce | 穿透 | 普通 | 子弹穿透敌人 |
| heal | 治疗 | 普通 | 立即恢复3点HP |
| speed | 加速 | 普通 | 子弹速度+15% |
| damage | 伤害 | 普通 | 伤害+1 |
| reload | 射速 | 普通 | 后坐力-15% |
| range | 射程 | 普通 | 子弹存活+20% |
| magnet | 磁铁 | 普通 | 吸收范围+50%，经验+10% |
| shield | 护盾 | 稀有 | 获得1层护盾 |
| double | 双发 | 稀有 | 多发射1颗子弹 |
| lifesteal | 吸血 | 稀有 | 击杀恢复HP |
| crit | 暴击 | 稀有 | 10%暴击率，双倍伤害 |
| scatter | 散射 | 稀有 | 扇形发射 |
| homing | 追踪 | 稀有 | 轻微追踪 |
| freeze | 冰冻 | 稀有 | 减速敌人 |
| poison | 毒素 | 稀有 | 持续伤害 |
| luck | 幸运 | 稀有 | 提升稀有技能概率 |
| chain | 闪电链 | 史诗 | 击杀连锁伤害 |
| explosive | 爆炸 | 史诗 | 击杀范围伤害 |
| multishot | 多重射击 | 史诗 | 多方向射击 |

## 修改的文件

### 新增文件
1. `server/games/gunbean/GunBeanSkillData.js`
   - 技能数据定义
   - 统一武器配置
   - 经验公式和技能选择算法

2. `client/games/gunbean/GunBeanSkillPicker.js`
   - 技能选择UI组件
   - 暂停提示组件

### 修改文件
1. `shared/Events.js`
   - 移除：GAME_COUNTDOWN, SCORE_UPDATE, COIN_UPDATE, ROUND_START, SHOP_* 事件
   - 新增：EXP_ORB_*, EXP_UPDATE, LEVEL_UP, SKILL_*, GAME_PAUSE, GAME_RESUME

2. `server/games/gunbean/GunBeanHandler.js`
   - 完全重写，实现肉鸽核心逻辑
   - 新增：经验球系统、技能选择、暂停恢复、难度递增

3. `client/games/gunbean/GunBeanGame.js`
   - 移除商店相关代码
   - 新增经验球处理、技能选择处理、游戏时间同步

4. `client/games/gunbean/GunBeanUI.js`
   - 移除倒计时、金币显示
   - 新增等级条、经验条、技能列表、游戏时间

5. `client/games/gunbean/GunBeanScene.js`
   - 新增经验球渲染和动画

## 游戏规则变更

### 之前
- 30秒轮次，逐渐增加到90秒
- 轮次结束进入商店
- 金币购买武器
- 有最大轮次限制

### 现在
- 无限生存
- 击杀敌人掉落经验球
- 吃经验升级，升级选技能
- 所有船只被摧毁则游戏结束
- 难度每30秒增加

## 技术细节

### 经验值公式
```javascript
expToNext = level * 50 + 50
// Lv1: 100, Lv2: 150, Lv3: 200 ...
```

### 技能稀有度权重
```javascript
// 基础权重
common: 60, rare: 30, epic: 10

// 幸运技能加成（每级）
common: -5, rare: +3, epic: +2
```

### 暂停机制
- 任意玩家升级时，游戏暂停
- 所有正在选技能的玩家选完后恢复
- 暂停期间物理和敌人移动停止
- 其他玩家看到"等待玩家选择技能"提示
