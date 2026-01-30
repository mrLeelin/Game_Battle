/**
 * 抢球大战 - 场景管理
 * 70度俯视角，2.5D风格
 */
import * as THREE from 'three';
import { TEAMS } from './BallGame.js';

// 场地配置
const FIELD = {
    WIDTH: 30,          // 场地宽度
    HEIGHT: 30,         // 场地长度
    GOAL_SIZE: 4,       // 球门大小
    GOAL_DEPTH: 2       // 球门深度
};

export class BallGameScene {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;

        // 游戏对象容器
        this.playerMeshes = new Map();
        this.ballMeshes = new Map();
        this.goalMeshes = [];

        // 飞行中的球
        this.flyingBalls = [];
    }

    /**
     * 初始化场景
     */
    async init() {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        // 创建摄像机 - 70度俯视角
        this.setupCamera();

        // 创建渲染器
        this.setupRenderer();

        // 创建场地
        this.createField();

        // 创建球门
        this.createGoals();

        // 创建灯光
        this.createLights();

        // 窗口大小变化
        window.addEventListener('resize', () => this.onResize());
    }

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

    /**
     * 设置渲染器
     */
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // 确保 canvas 在最上层
        this.renderer.domElement.style.position = 'fixed';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.zIndex = '50';

        document.body.appendChild(this.renderer.domElement);
    }

    /**
     * 创建场地
     */
    createField() {
        // 地面 - 绿色草地
        const groundGeometry = new THREE.PlaneGeometry(FIELD.WIDTH, FIELD.HEIGHT);
        const groundMaterial = new THREE.MeshLambertMaterial({
            color: 0x2d5a27,
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // 场地线条
        this.createFieldLines();

        // 边界墙
        this.createWalls();
    }

    /**
     * 创建场地线条
     */
    createFieldLines() {
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true });

        // 中线
        const midLineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-FIELD.WIDTH / 2, 0.01, 0),
            new THREE.Vector3(FIELD.WIDTH / 2, 0.01, 0)
        ]);
        this.scene.add(new THREE.Line(midLineGeometry, lineMaterial));

        // 中圈
        const circleGeometry = new THREE.RingGeometry(4, 4.1, 32);
        const circleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, opacity: 0.5, transparent: true });
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);
        circle.rotation.x = -Math.PI / 2;
        circle.position.y = 0.01;
        this.scene.add(circle);

        // 边界线
        const borderPoints = [
            new THREE.Vector3(-FIELD.WIDTH / 2, 0.01, -FIELD.HEIGHT / 2),
            new THREE.Vector3(FIELD.WIDTH / 2, 0.01, -FIELD.HEIGHT / 2),
            new THREE.Vector3(FIELD.WIDTH / 2, 0.01, FIELD.HEIGHT / 2),
            new THREE.Vector3(-FIELD.WIDTH / 2, 0.01, FIELD.HEIGHT / 2),
            new THREE.Vector3(-FIELD.WIDTH / 2, 0.01, -FIELD.HEIGHT / 2)
        ];
        const borderGeometry = new THREE.BufferGeometry().setFromPoints(borderPoints);
        this.scene.add(new THREE.Line(borderGeometry, lineMaterial));
    }

    /**
     * 创建边界墙
     */
    createWalls() {
        const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x333344, transparent: true, opacity: 0.6 });
        const wallHeight = 1;
        const wallThickness = 0.3;
        const goalSize = FIELD.GOAL_SIZE;

        // 四面墙（留出球门位置）
        const walls = [
            // 上边 (分两段，中间留球门)
            { pos: [-(FIELD.WIDTH / 4 + goalSize / 4), wallHeight / 2, -FIELD.HEIGHT / 2], size: [FIELD.WIDTH / 2 - goalSize / 2, wallHeight, wallThickness] },
            { pos: [(FIELD.WIDTH / 4 + goalSize / 4), wallHeight / 2, -FIELD.HEIGHT / 2], size: [FIELD.WIDTH / 2 - goalSize / 2, wallHeight, wallThickness] },
            // 下边
            { pos: [-(FIELD.WIDTH / 4 + goalSize / 4), wallHeight / 2, FIELD.HEIGHT / 2], size: [FIELD.WIDTH / 2 - goalSize / 2, wallHeight, wallThickness] },
            { pos: [(FIELD.WIDTH / 4 + goalSize / 4), wallHeight / 2, FIELD.HEIGHT / 2], size: [FIELD.WIDTH / 2 - goalSize / 2, wallHeight, wallThickness] },
            // 左边
            { pos: [-FIELD.WIDTH / 2, wallHeight / 2, -(FIELD.HEIGHT / 4 + goalSize / 4)], size: [wallThickness, wallHeight, FIELD.HEIGHT / 2 - goalSize / 2] },
            { pos: [-FIELD.WIDTH / 2, wallHeight / 2, (FIELD.HEIGHT / 4 + goalSize / 4)], size: [wallThickness, wallHeight, FIELD.HEIGHT / 2 - goalSize / 2] },
            // 右边
            { pos: [FIELD.WIDTH / 2, wallHeight / 2, -(FIELD.HEIGHT / 4 + goalSize / 4)], size: [wallThickness, wallHeight, FIELD.HEIGHT / 2 - goalSize / 2] },
            { pos: [FIELD.WIDTH / 2, wallHeight / 2, (FIELD.HEIGHT / 4 + goalSize / 4)], size: [wallThickness, wallHeight, FIELD.HEIGHT / 2 - goalSize / 2] }
        ];

        walls.forEach(w => {
            const geometry = new THREE.BoxGeometry(...w.size);
            const mesh = new THREE.Mesh(geometry, wallMaterial);
            mesh.position.set(...w.pos);
            mesh.castShadow = true;
            this.scene.add(mesh);
        });
    }

    /**
     * 创建四个球门
     */
    createGoals() {
        const goalDepth = FIELD.GOAL_DEPTH;
        const goalPositions = [
            { x: 0, z: -FIELD.HEIGHT / 2 - goalDepth / 2, team: TEAMS.RED, rotation: 0 },           // 上 - 红队
            { x: FIELD.WIDTH / 2 + goalDepth / 2, z: 0, team: TEAMS.BLUE, rotation: Math.PI / 2 },  // 右 - 蓝队
            { x: 0, z: FIELD.HEIGHT / 2 + goalDepth / 2, team: TEAMS.GREEN, rotation: Math.PI },    // 下 - 绿队
            { x: -FIELD.WIDTH / 2 - goalDepth / 2, z: 0, team: TEAMS.YELLOW, rotation: -Math.PI / 2 } // 左 - 黄队
        ];

        goalPositions.forEach(pos => {
            const goal = this.createGoal(pos.team.color);
            goal.position.set(pos.x, 0, pos.z);
            goal.rotation.y = pos.rotation;
            goal.userData.teamId = pos.team.id;
            this.scene.add(goal);
            this.goalMeshes.push(goal);
        });
    }

    /**
     * 创建单个球门
     */
    createGoal(color) {
        const group = new THREE.Group();
        const goalSize = FIELD.GOAL_SIZE;
        const goalDepth = FIELD.GOAL_DEPTH;

        // 球门框架
        const frameMaterial = new THREE.MeshLambertMaterial({ color: color });
        const frameThickness = 0.2;

        // 左柱
        const leftPost = new THREE.Mesh(
            new THREE.BoxGeometry(frameThickness, 2, frameThickness),
            frameMaterial
        );
        leftPost.position.set(-goalSize / 2, 1, 0);
        group.add(leftPost);

        // 右柱
        const rightPost = new THREE.Mesh(
            new THREE.BoxGeometry(frameThickness, 2, frameThickness),
            frameMaterial
        );
        rightPost.position.set(goalSize / 2, 1, 0);
        group.add(rightPost);

        // 横梁
        const crossbar = new THREE.Mesh(
            new THREE.BoxGeometry(goalSize + frameThickness, frameThickness, frameThickness),
            frameMaterial
        );
        crossbar.position.set(0, 2, 0);
        group.add(crossbar);

        // 球门底部区域（发光）
        const floorGeometry = new THREE.PlaneGeometry(goalSize, goalDepth);
        const floorMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0.02;
        group.add(floor);

        return group;
    }

    /**
     * 创建灯光
     */
    createLights() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // 主光源（模拟太阳）
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        this.scene.add(directionalLight);
    }

    /**
     * 创建玩家（完整角色模型）
     */
    createPlayer(playerData) {
        const teamColors = [0xff4444, 0x4444ff, 0x44ff44, 0xffff44];
        const color = teamColors[playerData.teamId] || 0xffffff;

        const group = new THREE.Group();
        group.userData.playerId = playerData.id;
        group.userData.teamId = playerData.teamId;
        group.userData.animState = {
            walking: false,
            jumping: false,
            walkPhase: 0,
            jumpHeight: 0,
            targetX: playerData.x || 0,
            targetZ: playerData.z || 0
        };

        // === 身体部分 ===
        const bodyMaterial = new THREE.MeshLambertMaterial({ color });
        const skinMaterial = new THREE.MeshLambertMaterial({ color: 0xffdbac });
        const shoeMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

        // 躯干 (圆柱)
        const torso = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.3, 0.6, 8),
            bodyMaterial
        );
        torso.position.y = 0.7;
        torso.castShadow = true;
        group.add(torso);
        group.userData.torso = torso;

        // 头 (球体)
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 12, 12),
            skinMaterial
        );
        head.position.y = 1.15;
        head.castShadow = true;
        group.add(head);

        // 眼睛
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), eyeMaterial);
        leftEye.position.set(-0.07, 1.18, 0.15);
        group.add(leftEye);
        const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), eyeMaterial);
        rightEye.position.set(0.07, 1.18, 0.15);
        group.add(rightEye);

        // === 手臂 ===
        // 左手臂
        const leftArm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.06, 0.4, 6),
            skinMaterial
        );
        leftArm.position.set(-0.35, 0.75, 0);
        leftArm.rotation.z = 0.3;
        leftArm.castShadow = true;
        group.add(leftArm);
        group.userData.leftArm = leftArm;

        // 右手臂
        const rightArm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.06, 0.4, 6),
            skinMaterial
        );
        rightArm.position.set(0.35, 0.75, 0);
        rightArm.rotation.z = -0.3;
        rightArm.castShadow = true;
        group.add(rightArm);
        group.userData.rightArm = rightArm;

        // === 腿 ===
        // 左腿容器（用于动画旋转）
        const leftLegPivot = new THREE.Group();
        leftLegPivot.position.set(-0.12, 0.4, 0);
        group.add(leftLegPivot);
        group.userData.leftLegPivot = leftLegPivot;

        // 左大腿
        const leftUpperLeg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.07, 0.25, 6),
            bodyMaterial
        );
        leftUpperLeg.position.y = -0.12;
        leftLegPivot.add(leftUpperLeg);

        // 左小腿
        const leftLowerLeg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.05, 0.25, 6),
            skinMaterial
        );
        leftLowerLeg.position.y = -0.28;
        leftLegPivot.add(leftLowerLeg);

        // 左脚
        const leftFoot = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.06, 0.18),
            shoeMaterial
        );
        leftFoot.position.set(0, -0.4, 0.04);
        leftLegPivot.add(leftFoot);

        // 右腿容器
        const rightLegPivot = new THREE.Group();
        rightLegPivot.position.set(0.12, 0.4, 0);
        group.add(rightLegPivot);
        group.userData.rightLegPivot = rightLegPivot;

        // 右大腿
        const rightUpperLeg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.07, 0.25, 6),
            bodyMaterial
        );
        rightUpperLeg.position.y = -0.12;
        rightLegPivot.add(rightUpperLeg);

        // 右小腿
        const rightLowerLeg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.05, 0.25, 6),
            skinMaterial
        );
        rightLowerLeg.position.y = -0.28;
        rightLegPivot.add(rightLowerLeg);

        // 右脚
        const rightFoot = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.06, 0.18),
            shoeMaterial
        );
        rightFoot.position.set(0, -0.4, 0.04);
        rightLegPivot.add(rightFoot);

        // 设置初始位置
        group.position.set(playerData.x || 0, 0, playerData.z || 0);

        // 头顶球挂载点
        const ballHolder = new THREE.Group();
        ballHolder.position.set(0, 1.5, 0);  // 头顶上方
        ballHolder.visible = false;
        group.add(ballHolder);
        group.userData.ballHolder = ballHolder;

        // 创建头顶的球（初始隐藏）
        const holdBall = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 16, 16),
            new THREE.MeshLambertMaterial({ color: 0xffffff })
        );
        holdBall.castShadow = true;
        ballHolder.add(holdBall);

        // 创建名字标签
        const nameSprite = this.createNameSprite(playerData.name || `玩家${playerData.id.slice(-4)}`, color);
        nameSprite.position.set(0, 1.8, 0);  // 头顶上方
        group.add(nameSprite);
        group.userData.nameSprite = nameSprite;

        this.scene.add(group);
        this.playerMeshes.set(playerData.id, group);

        return group;
    }

    /**
     * 更新玩家动画
     */
    updatePlayerAnimations(deltaTime) {
        this.playerMeshes.forEach((player) => {
            const anim = player.userData.animState;
            if (!anim) return;

            const leftLeg = player.userData.leftLegPivot;
            const rightLeg = player.userData.rightLegPivot;
            const leftArm = player.userData.leftArm;
            const rightArm = player.userData.rightArm;

            // 计算移动速度
            const dx = anim.targetX - player.position.x;
            const dz = anim.targetZ - player.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            // 判断是否在移动
            anim.walking = dist > 0.05;

            if (anim.walking) {
                // 平滑移动
                const moveSpeed = 0.15;
                player.position.x += dx * moveSpeed;
                player.position.z += dz * moveSpeed;

                // 面向移动方向
                if (dist > 0.1) {
                    const targetRotation = Math.atan2(dx, dz);
                    player.rotation.y = targetRotation;
                }

                // 走路动画
                anim.walkPhase += deltaTime * 12;
                const legSwing = Math.sin(anim.walkPhase) * 0.5;
                const armSwing = Math.sin(anim.walkPhase) * 0.3;

                if (leftLeg) leftLeg.rotation.x = legSwing;
                if (rightLeg) rightLeg.rotation.x = -legSwing;
                if (leftArm) leftArm.rotation.x = -armSwing;
                if (rightArm) rightArm.rotation.x = armSwing;
            } else {
                // 静止时恢复姿势
                if (leftLeg) leftLeg.rotation.x *= 0.8;
                if (rightLeg) rightLeg.rotation.x *= 0.8;
                if (leftArm) leftArm.rotation.x *= 0.8;
                if (rightArm) rightArm.rotation.x *= 0.8;
            }

            // 跳跃动画
            if (anim.jumping) {
                anim.jumpHeight += anim.jumpVelocity * deltaTime;
                anim.jumpVelocity -= 15 * deltaTime; // 重力

                if (anim.jumpHeight <= 0) {
                    anim.jumpHeight = 0;
                    anim.jumping = false;
                }

                player.position.y = anim.jumpHeight;
            }
        });
    }

    /**
     * 设置玩家目标位置
     */
    setPlayerTarget(playerId, x, z) {
        const player = this.playerMeshes.get(playerId);
        if (player && player.userData.animState) {
            player.userData.animState.targetX = x;
            player.userData.animState.targetZ = z;
        }
    }

    /**
     * 让玩家跳跃
     */
    makePlayerJump(playerId) {
        const player = this.playerMeshes.get(playerId);
        if (player && player.userData.animState && !player.userData.animState.jumping) {
            player.userData.animState.jumping = true;
            player.userData.animState.jumpVelocity = 5;
        }
    }

    /**
     * 玩家举起球
     */
    playerHoldBall(playerId, ballId) {
        const player = this.playerMeshes.get(playerId);
        if (player && player.userData.ballHolder) {
            player.userData.ballHolder.visible = true;
            player.userData.holdingBallId = ballId;
        }
    }

    /**
     * 玩家放下球
     */
    playerDropBall(playerId) {
        const player = this.playerMeshes.get(playerId);
        if (player && player.userData.ballHolder) {
            player.userData.ballHolder.visible = false;
            player.userData.holdingBallId = null;
        }
    }

    /**
     * 投掷球动画
     */
    throwBall(fromX, fromZ, toX, toZ, ballId, onComplete) {
        // 创建飞行中的球
        const geometry = new THREE.SphereGeometry(0.3, 16, 16);
        const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const ball = new THREE.Mesh(geometry, material);
        ball.position.set(fromX, 1.5, fromZ);
        ball.castShadow = true;
        this.scene.add(ball);

        // 飞行参数
        const flyData = {
            ball,
            startX: fromX,
            startZ: fromZ,
            endX: toX,
            endZ: toZ,
            progress: 0,
            duration: 0.5, // 0.5秒飞行时间
            ballId,
            onComplete
        };

        this.flyingBalls.push(flyData);
    }

    /**
     * 更新飞行中的球
     */
    updateFlyingBalls(deltaTime) {
        for (let i = this.flyingBalls.length - 1; i >= 0; i--) {
            const fly = this.flyingBalls[i];
            fly.progress += deltaTime / fly.duration;

            if (fly.progress >= 1) {
                // 飞行完成
                this.scene.remove(fly.ball);
                fly.ball.geometry.dispose();
                fly.ball.material.dispose();
                this.flyingBalls.splice(i, 1);

                if (fly.onComplete) {
                    fly.onComplete();
                }
            } else {
                // 更新位置（抛物线）
                const t = fly.progress;
                const x = fly.startX + (fly.endX - fly.startX) * t;
                const z = fly.startZ + (fly.endZ - fly.startZ) * t;
                // 抛物线高度：最高点在中间
                const y = 1.5 + Math.sin(t * Math.PI) * 3;

                fly.ball.position.set(x, y, z);
                fly.ball.rotation.x += deltaTime * 10;
                fly.ball.rotation.z += deltaTime * 8;
            }
        }
    }

    /**
     * 检测玩家碰撞（预测性检测）
     * @param {string} localPlayerId - 本地玩家ID
     * @param {number} predictX - 预测的X位置
     * @param {number} predictZ - 预测的Z位置
     * @returns {object|null} 返回安全位置或null
     */
    checkPlayerCollisions(localPlayerId, predictX, predictZ) {
        const localPlayer = this.playerMeshes.get(localPlayerId);
        if (!localPlayer) return null;

        const collisionRadius = 0.8;  // 碰撞半径
        let safeX = predictX;
        let safeZ = predictZ;
        let hasCollision = false;

        this.playerMeshes.forEach((otherPlayer, otherId) => {
            if (otherId === localPlayerId) return;

            const otherX = otherPlayer.position.x;
            const otherZ = otherPlayer.position.z;

            // 计算预测位置与其他玩家的距离
            const dx = predictX - otherX;
            const dz = predictZ - otherZ;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < collisionRadius) {
                hasCollision = true;

                if (dist > 0.01) {
                    // 计算安全位置（推到碰撞边界外）
                    const overlap = collisionRadius - dist;
                    const pushX = (dx / dist) * overlap;
                    const pushZ = (dz / dist) * overlap;

                    safeX += pushX;
                    safeZ += pushZ;
                } else {
                    // 距离太近，随机推开
                    safeX += (Math.random() - 0.5) * 0.5;
                    safeZ += (Math.random() - 0.5) * 0.5;
                }
            }
        });

        if (hasCollision) {
            return { x: safeX, z: safeZ };
        }
        return null;
    }

    /**
     * 创建名字标签精灵
     */
    createNameSprite(name, teamColor) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;

        // 文字设置
        context.font = 'bold 36px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        // 黑色描边
        context.strokeStyle = '#000000';
        context.lineWidth = 4;
        context.strokeText(name, 128, 32);

        // 根据队伍颜色设置文字颜色
        const colorHex = '#' + teamColor.toString(16).padStart(6, '0');
        context.fillStyle = colorHex;
        context.fillText(name, 128, 32);

        // 创建纹理
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        // 创建精灵材质
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false  // 始终显示在最前面
        });

        // 创建精灵
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(2, 0.5, 1);  // 放大一点

        return sprite;
    }

    /**
     * 创建球
     */
    createBall(ballData) {
        const geometry = new THREE.SphereGeometry(0.3, 16, 16);
        const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const ball = new THREE.Mesh(geometry, material);
        ball.position.set(ballData.x || 0, 0.3, ballData.z || 0);
        ball.castShadow = true;
        ball.userData.ballId = ballData.id;

        this.scene.add(ball);
        this.ballMeshes.set(ballData.id, ball);

        return ball;
    }

    /**
     * 渲染
     */
    render() {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * 窗口大小变化
     */
    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    /**
     * 销毁
     */
    destroy() {
        window.removeEventListener('resize', () => this.onResize());

        if (this.renderer) {
            this.renderer.dispose();
            document.body.removeChild(this.renderer.domElement);
        }

        this.scene = null;
        this.camera = null;
        this.renderer = null;
    }
}

// 导出场地配置
export { FIELD };
