# Ball Game 第三人称后背相机改动

## 修改日期
2024年

## 修改文件
1. `client/games/ballgame/BallGameScene.js`
2. `client/games/ballgame/BallGame.js`

## 修改原因
将 Ball Game 从俯视角改为第三人称后背视角相机

---

## 代码对比

### BallGameScene.js - setupCamera() 方法

#### 修改前
```javascript
/**
 * 设置摄像机 - 70度俯视
 */
setupCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);

    // 摄像机参数（用于跟随）
    this.cameraDistance = 12;  // 更近的距离
    this.cameraAngle = 60 * Math.PI / 180; // 60度俯视角

    // 初始位置
    this.camera.position.set(0, this.cameraDistance * Math.sin(this.cameraAngle), this.cameraDistance * Math.cos(this.cameraAngle));
    this.camera.lookAt(0, 0, 0);
}
```

#### 修改后
```javascript
/**
 * 设置摄像机 - 第三人称后背视角
 */
setupCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);

    // 第三人称后背相机参数
    this.cameraDistance = 6;      // 相机与玩家的水平距离
    this.cameraHeight = 3;        // 相机高度（相对玩家）
    this.cameraLookAtHeight = 1.2; // 看向的高度（玩家头部）
    this.cameraLerpSpeed = 0.08;  // 平滑跟随速度

    // 当前相机状态（用于平滑插值）
    this.currentCameraPos = new THREE.Vector3(0, this.cameraHeight, this.cameraDistance);
    this.currentLookAt = new THREE.Vector3(0, this.cameraLookAtHeight, 0);

    // 初始位置
    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(this.currentLookAt);
}
```

---

### BallGameScene.js - updateCamera() 方法

#### 修改前
```javascript
/**
 * 更新摄像机跟随目标
 */
updateCamera(targetX, targetZ) {
    if (!this.camera) return;

    // 计算摄像机目标位置
    const offsetY = this.cameraDistance * Math.sin(this.cameraAngle);
    const offsetZ = this.cameraDistance * Math.cos(this.cameraAngle);

    // 平滑跟随（只移动位置，不旋转）
    const lerpSpeed = 0.1;
    const targetCamX = targetX;
    const targetCamY = offsetY;
    const targetCamZ = targetZ + offsetZ;

    this.camera.position.x += (targetCamX - this.camera.position.x) * lerpSpeed;
    this.camera.position.y += (targetCamY - this.camera.position.y) * lerpSpeed;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * lerpSpeed;
}
```

#### 修改后
```javascript
/**
 * 更新摄像机 - 第三人称后背跟随
 * @param {number} targetX - 玩家X位置
 * @param {number} targetZ - 玩家Z位置
 * @param {number} playerRotation - 玩家朝向（弧度）
 */
updateCamera(targetX, targetZ, playerRotation = 0) {
    if (!this.camera) return;

    // 计算相机应该在玩家后方的位置
    const behindAngle = playerRotation + Math.PI; // 后方角度

    // 计算目标相机位置（在玩家后方）
    const targetCamX = targetX + Math.sin(behindAngle) * this.cameraDistance;
    const targetCamY = this.cameraHeight;
    const targetCamZ = targetZ + Math.cos(behindAngle) * this.cameraDistance;

    // 计算目标看向位置（玩家头部）
    const targetLookX = targetX;
    const targetLookY = this.cameraLookAtHeight;
    const targetLookZ = targetZ;

    // 平滑插值 - 相机位置
    this.currentCameraPos.x += (targetCamX - this.currentCameraPos.x) * this.cameraLerpSpeed;
    this.currentCameraPos.y += (targetCamY - this.currentCameraPos.y) * this.cameraLerpSpeed;
    this.currentCameraPos.z += (targetCamZ - this.currentCameraPos.z) * this.cameraLerpSpeed;

    // 平滑插值 - 看向位置
    this.currentLookAt.x += (targetLookX - this.currentLookAt.x) * this.cameraLerpSpeed * 2;
    this.currentLookAt.y += (targetLookY - this.currentLookAt.y) * this.cameraLerpSpeed * 2;
    this.currentLookAt.z += (targetLookZ - this.currentLookAt.z) * this.cameraLerpSpeed * 2;

    // 应用到相机
    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(this.currentLookAt);
}
```

---

### BallGame.js - gameLoop() 中的相机调用

#### 修改前
```javascript
// 更新摄像机跟随本地玩家
const localPlayer = this.players.get(this.localPlayerId);
if (localPlayer) {
    this.scene.updateCamera(localPlayer.x, localPlayer.z);
}
```

#### 修改后
```javascript
// 更新摄像机跟随本地玩家（第三人称后背视角）
const localPlayer = this.players.get(this.localPlayerId);
if (localPlayer) {
    // 获取本地玩家的mesh来读取实际朝向
    const playerMesh = this.scene.playerMeshes?.get(this.localPlayerId);
    const playerRotation = playerMesh ? playerMesh.rotation.y : this.playerRotation;
    this.scene.updateCamera(localPlayer.x, localPlayer.z, playerRotation);
}
```

---

## 功能对比

| 功能 | 修改前 | 修改后 |
|------|--------|--------|
| 视角类型 | 60度俯视角 | 第三人称后背 |
| 相机位置 | 固定在玩家上方 | 在玩家后方，随朝向旋转 |
| 相机距离 | 12 单位 | 6 单位（更近） |
| 相机高度 | 根据俯视角计算 | 固定 3 单位 |
| 跟随方式 | 只跟随位置 | 跟随位置 + 朝向 |
| 平滑插值 | 位置插值 | 位置 + 看向点双重插值 |

---

## 相机参数说明

可以调整以下参数来改变视角效果：

```javascript
this.cameraDistance = 6;      // 相机与玩家的水平距离（越大越远）
this.cameraHeight = 3;        // 相机高度（越大越高）
this.cameraLookAtHeight = 1.2; // 看向的高度（玩家头部位置）
this.cameraLerpSpeed = 0.08;  // 平滑跟随速度（越大越灵敏）
```

---

## 回退方案

如需回退到俯视角，恢复以下代码：

1. `BallGameScene.js` 中的 `setupCamera()` 方法
2. `BallGameScene.js` 中的 `updateCamera()` 方法
3. `BallGame.js` 中的相机调用（移除 playerRotation 参数）
