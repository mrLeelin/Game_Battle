# 房间配置简化与游戏重命名

## 修改内容

### 1. 房间最大人数改为 4 人
**文件：** `shared/Constants.js`
- `MAX_PLAYERS: 8` → `MAX_PLAYERS: 4`
- `MIN_PLAYERS: 2` → `MIN_PLAYERS: 1`（允许单人游戏）

### 2. 只保留枪豆人游戏
**文件：** `shared/GameTypes.js`
- 删除 FPS、RACING、PUZZLE、BALLGAME 游戏类型
- 只保留 GUNBEAN（枪豆人）

**文件：** `client/main.js`
- 简化 `loadGameModule` 方法，只保留 gunbean 的加载逻辑

**文件：** `server/games/GameRouter.js`
- 删除 FPS 和 BallGame 处理器导入
- 只保留 GunBean 处理器

### 3. 枪豆人改名为"4猴一舟"
**文件：** `shared/GameTypes.js`
- `name: '枪豆人'` → `name: '4猴一舟'`

## 功能对比

| 项目 | 修改前 | 修改后 |
|------|--------|--------|
| 房间最大人数 | 8人 | 4人 |
| 房间最小人数 | 2人 | 1人 |
| 可选游戏 | 5种（FPS、赛车、解谜、抢球、枪豆人） | 1种（4猴一舟） |
| 游戏名称 | 枪豆人 | 4猴一舟 |

## 日期
2025-01-31
