# Ball Game GTA 风格相机控制

## 修改日期
2024年

## 修改文件
1. `client/games/ballgame/BallGameScene.js`
2. `client/games/ballgame/BallGameInput.js`
3. `client/games/ballgame/BallGame.js`

## 修改原因
将 Ball Game 改为 GTA 风格第三人称相机控制

---

## 核心变化

### 控制方式对比

| 控制 | 修改前 | 修改后（GTA 风格） |
|------|--------|-------------------|
| 鼠标移动 | 控制角色朝向 | 控制相机旋转（环绕角色） |
| WASD | 相对世界坐标移动 | 相对相机方向移动 |
| 角色朝向 | 跟随鼠标指向 | 自动转向移动方向 |
| 相机跟随 | 跟随角色朝向旋转 | 独立控制，玩家可自由旋转 |

---

## 主要代码改动

### BallGameScene.js

#### 新增方法

```javascript
// 旋转相机（由鼠标输入调用）
rotateCamera(deltaYaw, deltaPitch) {
    this.cameraYaw += deltaYaw;
    this.cameraPitch += deltaPitch;
    // 限制俯仰角度
    this.cameraPitch = Math.max(this.cameraPitchMin, Math.min(this.cameraPitchMax, this.cameraPitch));
}

// 获取相机前方向（用于 WASD 移动）
getCameraForward() {
    return {
        x: Math.sin(this.cameraYaw),
        z: Math.cos(this.cameraYaw)
    };
}

// 获取相机右方向（用于 WASD 移动）
getCameraRight() {
    return {
        x: Math.cos(this.cameraYaw),
        z: -Math.sin(this.cameraYaw)
    };
}
```

#### 相机参数

```javascript
this.cameraDistance = 5;       // 相机与玩家的距离
this.cameraYaw = 0;            // 水平旋转角度（鼠标左右控制）
this.cameraPitch = 0.4;        // 垂直俯仰角度（鼠标上下控制）
this.cameraPitchMin = 0.1;     // 最小俯仰
this.cameraPitchMax = 1.2;     // 最大俯仰
```

---

### BallGameInput.js

#### 鼠标控制相机

```javascript
onMouseMove(e) {
    // 获取鼠标移动增量
    const deltaX = e.movementX || 0;
    const deltaY = e.movementY || 0;

    // 旋转相机
    this.game.scene.rotateCamera(
        deltaX * this.mouseSensitivity,
        deltaY * this.mouseSensitivity
    );
}
```

#### WASD 相对相机移动

```javascript
// 获取相机方向
const forward = this.game.scene?.getCameraForward();
const right = this.game.scene?.getCameraRight();

// 计算世界空间移动方向（相对于相机）
const worldDirX = forward.x * (-inputZ) + right.x * inputX;
const worldDirZ = forward.z * (-inputZ) + right.z * inputX;
```

#### 角色自动转向

```javascript
// GTA 风格：角色自动转向移动方向
const moveRotation = Math.atan2(worldDirX, worldDirZ);
this.game.scene?.setPlayerRotation(this.game.localPlayerId, moveRotation);
```

---

## 可调参数

在 `BallGameScene.js` 中：
```javascript
this.cameraDistance = 5;       // 相机距离（越大越远）
this.cameraPitch = 0.4;        // 初始俯仰角度
this.cameraPitchMin = 0.1;     // 最小俯仰（防止看地下）
this.cameraPitchMax = 1.2;     // 最大俯仰（防止翻转）
this.cameraLerpSpeed = 0.15;   // 跟随速度
```

在 `BallGameInput.js` 中：
```javascript
this.mouseSensitivity = 0.003; // 鼠标灵敏度
```

---

## 操作说明

| 按键 | 功能 |
|------|------|
| 鼠标移动 | 旋转相机视角 |
| W | 向相机前方移动 |
| S | 向相机后方移动 |
| A | 向相机左方移动 |
| D | 向相机右方移动 |
| 空格 | 捡球/投掷球 |
| Shift | 跳跃 |
| 左键 | 攻击 |

---

## 回退方案

如需回退，恢复以下文件到修改前版本：
1. `BallGameScene.js` - setupCamera() 和 updateCamera() 方法
2. `BallGameInput.js` - 整个文件
3. `BallGame.js` - gameLoop() 中的相机调用
