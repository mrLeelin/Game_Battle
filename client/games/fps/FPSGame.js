/**
 * FPS 游戏 - 赛博朋克风格第一人称射击
 */
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { GameBase } from '../GameBase.js';
import { FPS_EVENTS } from '../../../shared/Events.js';
import { FPSWorld } from './FPSWorld.js';
import { FPSPlayer } from './FPSPlayer.js';
import { FPSWeapon } from './FPSWeapon.js';
import { FPSHUD } from './FPSHUD.js';

export class FPSGame extends GameBase {
    constructor(options = {}) {
        super(options);

        this.controls = null;
        this.world = null;
        this.localPlayer = null;
        this.weapon = null;
        this.hud = null;

        // 输入状态
        this.inputState = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false
        };

        // 物理
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.canJump = true;
    }

    /**
     * 初始化游戏
     */
    async init() {
        console.log('[FPSGame] 初始化...');

        // 初始化场景管理器
        this.sceneManager.init({
            enableShadows: true,
            enableBloom: true,
            backgroundColor: 0x000510
        });

        // 创建世界
        this.world = new FPSWorld(this.sceneManager);
        await this.world.build();

        // 创建武器
        this.weapon = new FPSWeapon(this.sceneManager.camera);

        // 初始化控制器
        this.setupControls();

        // 初始化 HUD
        this.hud = new FPSHUD();
        this.hud.show();

        // 绑定输入
        this.bindInputEvents();

        // 绑定网络事件
        this.bindNetworkEvents();
        this.bindFPSNetworkEvents();

        console.log('[FPSGame] 初始化完成');
    }

    /**
     * 设置控制器
     */
    setupControls() {
        this.controls = new PointerLockControls(
            this.sceneManager.camera,
            document.body
        );

        // 点击锁定鼠标
        document.addEventListener('click', () => {
            if (this.isRunning && !this.controls.isLocked) {
                this.controls.lock();
            }
        });

        this.controls.addEventListener('lock', () => {
            this.hud.hideInstructions();
        });

        this.controls.addEventListener('unlock', () => {
            if (this.isRunning) {
                this.hud.showInstructions();
            }
        });
    }

    /**
     * 绑定输入事件
     */
    bindInputEvents() {
        this.onKeyDown = this.handleKeyDown.bind(this);
        this.onKeyUp = this.handleKeyUp.bind(this);
        this.onMouseDown = this.handleMouseDown.bind(this);

        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
        document.addEventListener('mousedown', this.onMouseDown);
    }

    /**
     * 解绑输入事件
     */
    unbindInputEvents() {
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        document.removeEventListener('mousedown', this.onMouseDown);
    }

    /**
     * 键盘按下处理
     */
    handleKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.inputState.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.inputState.backward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.inputState.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.inputState.right = true;
                break;
            case 'Space':
                if (this.canJump) {
                    this.velocity.y = 350;
                    this.canJump = false;
                }
                break;
            case 'KeyR':
                this.weapon?.reload();
                this.network.emit(FPS_EVENTS.RELOAD);
                break;
        }
    }

    /**
     * 键盘抬起处理
     */
    handleKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.inputState.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.inputState.backward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.inputState.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.inputState.right = false;
                break;
        }
    }

    /**
     * 鼠标按下处理
     */
    handleMouseDown(event) {
        if (event.button === 0 && this.controls?.isLocked) {
            this.shoot();
        }
    }

    /**
     * 射击
     */
    shoot() {
        if (!this.weapon?.canShoot()) return;

        this.weapon.shoot();
        this.network.emit(FPS_EVENTS.SHOOT);

        // 命中检测
        const hit = this.performHitDetection();
        if (hit) {
            this.network.emit(FPS_EVENTS.HIT, { targetId: hit.playerId });
            this.hud.showHitIndicator();
        }
    }

    /**
     * 命中检测
     */
    performHitDetection() {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.sceneManager.camera);

        const enemies = Array.from(this.players.values()).map(p => p.mesh);
        const intersects = raycaster.intersectObjects(enemies, true);

        if (intersects.length > 0) {
            // 找到被命中的玩家
            let hitObject = intersects[0].object;
            while (hitObject.parent && hitObject.parent.type !== 'Scene') {
                hitObject = hitObject.parent;
            }

            for (const [id, player] of this.players) {
                if (player.mesh === hitObject) {
                    return { playerId: id, distance: intersects[0].distance };
                }
            }
        }

        return null;
    }

    /**
     * 游戏主循环
     */
    update(delta) {
        if (!this.controls?.isLocked) return;

        // 物理更新
        this.updatePhysics(delta);

        // 武器更新
        this.weapon?.update(delta, this.inputState);

        // 发送位置
        this.sendPlayerState();
    }

    /**
     * 物理更新
     */
    updatePhysics(delta) {
        const camera = this.sceneManager.camera;

        // 阻尼
        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;
        this.velocity.y -= 9.8 * 100.0 * delta;  // 重力

        // 输入方向
        this.direction.z = Number(this.inputState.forward) - Number(this.inputState.backward);
        this.direction.x = Number(this.inputState.right) - Number(this.inputState.left);
        this.direction.normalize();

        // 应用速度
        const speed = 400.0;
        if (this.inputState.forward || this.inputState.backward) {
            this.velocity.z -= this.direction.z * speed * delta;
        }
        if (this.inputState.left || this.inputState.right) {
            this.velocity.x -= this.direction.x * speed * delta;
        }

        // 移动
        this.controls.moveRight(-this.velocity.x * delta);
        this.controls.moveForward(-this.velocity.z * delta);
        camera.position.y += this.velocity.y * delta;

        // 地面检测
        if (camera.position.y < 1.6) {
            this.velocity.y = 0;
            camera.position.y = 1.6;
            this.canJump = true;
        }
    }

    /**
     * 发送玩家状态
     */
    sendPlayerState() {
        const camera = this.sceneManager.camera;
        const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');

        this.network.emit(FPS_EVENTS.PLAYER_MOVE, {
            x: camera.position.x,
            y: camera.position.y - 1.6,
            z: camera.position.z,
            rotation: euler.y,
            pitch: euler.x
        });
    }

    /**
     * 绑定 FPS 专用网络事件
     */
    bindFPSNetworkEvents() {
        // 血量更新
        this.network.on(FPS_EVENTS.HEALTH_UPDATE, (hp) => {
            this.hud.updateHealth(hp);
        });

        // 重生
        this.network.on(FPS_EVENTS.RESPAWN, (data) => {
            this.sceneManager.camera.position.set(data.x, 1.6, data.z);
            this.velocity.set(0, 0, 0);
            this.hud.updateHealth(100);
        });

        // 其他玩家射击
        this.network.on(FPS_EVENTS.SHOOT, (data) => {
            const player = this.players.get(data.id);
            if (player) {
                player.showMuzzleFlash();
            }
        });

        // 玩家死亡
        this.network.on(FPS_EVENTS.DEATH, (data) => {
            console.log(`玩家 ${data.victimId} 被 ${data.killerId} 击杀`);
        });
    }

    /**
     * 解绑 FPS 网络事件
     */
    unbindFPSNetworkEvents() {
        this.network.off(FPS_EVENTS.HEALTH_UPDATE);
        this.network.off(FPS_EVENTS.RESPAWN);
        this.network.off(FPS_EVENTS.SHOOT);
        this.network.off(FPS_EVENTS.DEATH);
    }

    /**
     * 玩家移动处理
     */
    onPlayerMove(data) {
        let player = this.players.get(data.id);

        if (!player) {
            // 创建新玩家
            player = new FPSPlayer(data.id);
            this.sceneManager.add(player.mesh);
            this.players.set(data.id, player);
        }

        player.updatePosition(data);
    }

    /**
     * 销毁游戏
     */
    destroy() {
        console.log('[FPSGame] 销毁...');

        this.stop();

        // 解绑事件
        this.unbindInputEvents();
        this.unbindNetworkEvents();
        this.unbindFPSNetworkEvents();

        // 解锁鼠标
        if (this.controls?.isLocked) {
            this.controls.unlock();
        }

        // 销毁组件
        this.weapon?.destroy();
        this.hud?.hide();
        this.world = null;

        // 清空玩家
        this.players.clear();

        // 清空场景
        this.sceneManager.clearScene();

        console.log('[FPSGame] 销毁完成');
    }
}

export default FPSGame;
