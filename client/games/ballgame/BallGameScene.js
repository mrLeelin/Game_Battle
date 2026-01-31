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
     * 创建玩家（完整角色模型 - 优化版）
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
            targetZ: playerData.z || 0,
            idleTime: 0
        };

        // === 材质 ===
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: color });
        const skinMaterial = new THREE.MeshLambertMaterial({ color: 0xffdbac }); // 肤色
        const pantsMaterial = new THREE.MeshLambertMaterial({ color: 0xdddddd }); // 白色裤子
        const shoeMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 }); // 深色鞋子

        // === 身体容器 (用于整体缩放/旋转) ===
        const bodyGroup = new THREE.Group();
        group.add(bodyGroup);
        group.userData.bodyGroup = bodyGroup;

        // 1. 躯干 (上身)
        const torsoGeo = new THREE.BoxGeometry(0.4, 0.45, 0.25);
        const torso = new THREE.Mesh(torsoGeo, bodyMaterial);
        torso.position.y = 0.95;
        torso.castShadow = true;
        bodyGroup.add(torso);

        // 2. 腰部/骨盆
        const pelvisGeo = new THREE.BoxGeometry(0.38, 0.15, 0.24);
        const pelvis = new THREE.Mesh(pelvisGeo, pantsMaterial);
        pelvis.position.y = 0.65;
        pelvis.castShadow = true;
        bodyGroup.add(pelvis);

        // 3. 头部
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 1.2, 0);
        bodyGroup.add(headGroup);
        group.userData.headGroup = headGroup;

        // 头主体
        const headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35); 
        const head = new THREE.Mesh(headGeo, skinMaterial);
        head.castShadow = true;
        headGroup.add(head);

        // 眼睛
        const eyeGeo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.08, 0.05, 0.18);
        headGroup.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.08, 0.05, 0.18);
        headGroup.add(rightEye);

        // 4. 手臂 (带关节)
        // 左臂容器 (肩膀)
        const leftShoulder = new THREE.Group();
        leftShoulder.position.set(-0.28, 1.1, 0);
        bodyGroup.add(leftShoulder);
        group.userData.leftShoulder = leftShoulder;

        // 左大臂
        const armUpperGeo = new THREE.BoxGeometry(0.12, 0.35, 0.12);
        const leftUpperArm = new THREE.Mesh(armUpperGeo, bodyMaterial);
        leftUpperArm.position.y = -0.15; // 向下延伸
        leftShoulder.add(leftUpperArm);

        // 左肘关节
        const leftElbow = new THREE.Group();
        leftElbow.position.set(0, -0.35, 0);
        leftShoulder.add(leftElbow);
        group.userData.leftElbow = leftElbow;

        // 左小臂
        const armLowerGeo = new THREE.BoxGeometry(0.1, 0.3, 0.1);
        const leftLowerArm = new THREE.Mesh(armLowerGeo, skinMaterial);
        leftLowerArm.position.y = -0.15;
        leftElbow.add(leftLowerArm);

        // 手
        const handGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
        const leftHand = new THREE.Mesh(handGeo, skinMaterial);
        leftHand.position.y = -0.32;
        leftElbow.add(leftHand);


        // 右臂容器 (肩膀)
        const rightShoulder = new THREE.Group();
        rightShoulder.position.set(0.28, 1.1, 0);
        bodyGroup.add(rightShoulder);
        group.userData.rightShoulder = rightShoulder;

        // 右大臂
        const rightUpperArm = new THREE.Mesh(armUpperGeo, bodyMaterial);
        rightUpperArm.position.y = -0.15;
        rightShoulder.add(rightUpperArm);

        // 右肘关节
        const rightElbow = new THREE.Group();
        rightElbow.position.set(0, -0.35, 0);
        rightShoulder.add(rightElbow);
        group.userData.rightElbow = rightElbow;

        // 右小臂
        const rightLowerArm = new THREE.Mesh(armLowerGeo, skinMaterial);
        rightLowerArm.position.y = -0.15;
        rightElbow.add(rightLowerArm);

        // 右手
        const rightHand = new THREE.Mesh(handGeo, skinMaterial);
        rightHand.position.y = -0.32;
        rightElbow.add(rightHand);


        // 5. 腿部 (带关节)
        // 左腿容器 (髋关节)
        const leftHip = new THREE.Group();
        leftHip.position.set(-0.1, 0.6, 0);
        bodyGroup.add(leftHip);
        group.userData.leftHip = leftHip;

        // 左大腿
        const legUpperGeo = new THREE.BoxGeometry(0.14, 0.35, 0.14);
        const leftUpperLeg = new THREE.Mesh(legUpperGeo, pantsMaterial);
        leftUpperLeg.position.y = -0.15;
        leftHip.add(leftUpperLeg);

        // 左膝盖
        const leftKnee = new THREE.Group();
        leftKnee.position.set(0, -0.32, 0);
        leftHip.add(leftKnee);
        group.userData.leftKnee = leftKnee;

        // 左小腿
        const legLowerGeo = new THREE.BoxGeometry(0.12, 0.3, 0.12);
        const leftLowerLeg = new THREE.Mesh(legLowerGeo, skinMaterial); // 或者裤子材质
        leftLowerLeg.position.y = -0.15;
        leftKnee.add(leftLowerLeg);

        // 左脚
        const footGeo = new THREE.BoxGeometry(0.13, 0.1, 0.22);
        const leftFoot = new THREE.Mesh(footGeo, shoeMaterial);
        leftFoot.position.set(0, -0.32, 0.05); // 稍微向前
        leftKnee.add(leftFoot);


        // 右腿容器 (髋关节)
        const rightHip = new THREE.Group();
        rightHip.position.set(0.1, 0.6, 0);
        bodyGroup.add(rightHip);
        group.userData.rightHip = rightHip;

        // 右大腿
        const rightUpperLeg = new THREE.Mesh(legUpperGeo, pantsMaterial);
        rightUpperLeg.position.y = -0.15;
        rightHip.add(rightUpperLeg);

        // 右膝盖
        const rightKnee = new THREE.Group();
        rightKnee.position.set(0, -0.32, 0);
        rightHip.add(rightKnee);
        group.userData.rightKnee = rightKnee;

        // 右小腿
        const rightLowerLeg = new THREE.Mesh(legLowerGeo, skinMaterial);
        rightLowerLeg.position.y = -0.15;
        rightKnee.add(rightLowerLeg);

        // 右脚
        const rightFoot = new THREE.Mesh(footGeo, shoeMaterial);
        rightFoot.position.set(0, -0.32, 0.05);
        rightKnee.add(rightFoot);


        // 设置初始位置
        group.position.set(playerData.x || 0, 0, playerData.z || 0);

        // 头顶球挂载点
        const ballHolder = new THREE.Group();
        ballHolder.position.set(0, 0.5, 0); // 相对头部
        headGroup.add(ballHolder);
        ballHolder.visible = false;
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
        nameSprite.position.set(0, 1.0, 0);  // 相对头部
        headGroup.add(nameSprite);
        group.userData.nameSprite = nameSprite;

        this.scene.add(group);
        this.playerMeshes.set(playerData.id, group);

        return group;
    }

    /**
     * 更新玩家动画（优化版）
     */
    updatePlayerAnimations(deltaTime) {
        this.playerMeshes.forEach((player) => {
            const anim = player.userData.animState;
            if (!anim) return;

            // 获取关节
            const { 
                bodyGroup, headGroup,
                leftShoulder, rightShoulder, leftElbow, rightElbow,
                leftHip, rightHip, leftKnee, rightKnee 
            } = player.userData;

            // 状态判断
            const isHolding = !!player.userData.holdingBallId;

            // 计算移动
            const dx = anim.targetX - player.position.x;
            const dz = anim.targetZ - player.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            anim.walking = dist > 0.05;
            anim.idleTime += deltaTime;

            // 1. 移动逻辑
            if (anim.walking) {
                // 重置待机时间
                anim.idleTime = 0;
                
                // 平滑移动
                const moveSpeed = 0.15;
                player.position.x += dx * moveSpeed;
                player.position.z += dz * moveSpeed;

                // 面向移动方向 (平滑旋转)
                if (dist > 0.1) {
                    const targetRotation = Math.atan2(dx, dz);
                    let rotDiff = targetRotation - player.rotation.y;
                    
                    // 处理角度跳变 (-PI 到 PI)
                    while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
                    while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
                    
                    player.rotation.y += rotDiff * 0.2;
                }

                // === 跑步动画 ===
                anim.walkPhase += deltaTime * 15; // 跑步频率

                // 身体倾斜
                if (bodyGroup) bodyGroup.rotation.x = 0.2; // 向前倾

                // 腿部摆动
                const legAmp = 1.0; // 腿摆动幅度
                const kneeAmp = 1.2; // 膝盖弯曲幅度

                const leftCycle = Math.sin(anim.walkPhase);
                const rightCycle = Math.sin(anim.walkPhase + Math.PI);

                if (leftHip) leftHip.rotation.x = leftCycle * legAmp;
                if (rightHip) rightHip.rotation.x = rightCycle * legAmp;

                // 膝盖弯曲 (只在腿向后摆时弯曲)
                if (leftKnee) leftKnee.rotation.x = Math.max(0, leftCycle) * kneeAmp;
                if (rightKnee) rightKnee.rotation.x = Math.max(0, rightCycle) * kneeAmp;

                // 手臂摆动 (如果不持球)
                if (!isHolding) {
                    const armAmp = 0.8;
                    
                    if (leftShoulder) {
                        leftShoulder.rotation.x = rightCycle * armAmp;
                        leftShoulder.rotation.z = 0.1; 
                    }
                    if (rightShoulder) {
                        rightShoulder.rotation.x = leftCycle * armAmp;
                        rightShoulder.rotation.z = -0.1;
                    }
                    // 手肘自然弯曲
                    if (leftElbow) leftElbow.rotation.x = -Math.abs(rightCycle * 0.5) - 0.2;
                    if (rightElbow) rightElbow.rotation.x = -Math.abs(leftCycle * 0.5) - 0.2;
                }

                // 跑步时的上下颠簸
                if (bodyGroup) bodyGroup.position.y = Math.abs(Math.sin(anim.walkPhase * 2)) * 0.05;

            } else {
                // === 待机动画 ===
                const breathSpeed = 2;
                const breathAmp = 0.03;
                const breath = Math.sin(anim.idleTime * breathSpeed);

                // 身体呼吸起伏
                if (bodyGroup) {
                    bodyGroup.rotation.x *= 0.8; // 恢复直立
                    bodyGroup.position.y = breath * breathAmp; // 上下浮动
                }

                // 恢复下肢位置
                const recoverSpeed = 0.1;
                if (leftHip) leftHip.rotation.x *= (1 - recoverSpeed);
                if (rightHip) rightHip.rotation.x *= (1 - recoverSpeed);
                if (leftKnee) leftKnee.rotation.x *= (1 - recoverSpeed);
                if (rightKnee) rightKnee.rotation.x *= (1 - recoverSpeed);

                // 手臂摆动 (如果不持球)
                if (!isHolding) {
                    if (leftShoulder) {
                        leftShoulder.rotation.x = Math.sin(anim.idleTime * 1.5) * 0.05; 
                        leftShoulder.rotation.z = 0.05;
                    }
                    if (rightShoulder) {
                        rightShoulder.rotation.x = Math.sin(anim.idleTime * 1.5 + Math.PI) * 0.05;
                        rightShoulder.rotation.z = -0.05;
                    }
                    if (leftElbow) leftElbow.rotation.x = -0.1;
                    if (rightElbow) rightElbow.rotation.x = -0.1;
                }
            }

            // === 持球动作 (覆盖手臂动画) ===
            if (isHolding) {
                // 双手举过头顶
                const armLiftAngle = -2.8; // 向上举起
                const armSpread = 0.1; // 稍微向内收，托住球
                
                if (leftShoulder) {
                    leftShoulder.rotation.x = armLiftAngle;
                    leftShoulder.rotation.z = -armSpread; 
                }
                if (rightShoulder) {
                    rightShoulder.rotation.x = armLiftAngle;
                    rightShoulder.rotation.z = armSpread;
                }
                
                // 手肘微曲
                if (leftElbow) leftElbow.rotation.x = -0.3;
                if (rightElbow) rightElbow.rotation.x = -0.3;
            }

            // === 跳跃动画 ===
            if (anim.jumping) {
                anim.jumpHeight += anim.jumpVelocity * deltaTime;
                anim.jumpVelocity -= 15 * deltaTime; // 重力

                if (anim.jumpHeight <= 0) {
                    anim.jumpHeight = 0;
                    anim.jumping = false;
                }

                player.position.y = anim.jumpHeight;
                
                // 跳跃姿态
                if (anim.jumpHeight > 0.1) {
                    // 屈腿
                    if (leftHip) leftHip.rotation.x = -0.5;
                    if (rightHip) rightHip.rotation.x = -0.5;
                    if (leftKnee) leftKnee.rotation.x = 1.5;
                    if (rightKnee) rightKnee.rotation.x = 1.5;
                    
                    // 如果不持球，空中举手
                    if (!isHolding) {
                        if (leftShoulder) leftShoulder.rotation.x = -2.5;
                        if (rightShoulder) rightShoulder.rotation.x = -2.5;
                    }
                }
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
        ball.position.set(fromX, 1.7, fromZ);
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
                const y = 1.7 + Math.sin(t * Math.PI) * 3;

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
