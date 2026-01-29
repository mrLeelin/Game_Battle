/**
 * FPS 武器系统
 */
import * as THREE from 'three';
import { animate as anime } from 'animejs';

export class FPSWeapon {
    constructor(camera) {
        this.camera = camera;
        this.mesh = null;
        this.barrelTip = null;

        // 弹药
        this.currentAmmo = 30;
        this.maxAmmo = 30;
        this.totalAmmo = 90;
        this.isReloading = false;

        // 枪口闪光
        this.muzzleLight = null;

        this.create();
    }

    /**
     * 创建武器
     */
    create() {
        this.mesh = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x001122,
            roughness: 0.1,
            metalness: 1.0,
            transparent: true,
            opacity: 0.9
        });

        // 枪身
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.15, 0.6),
            bodyMat
        );
        this.mesh.add(body);

        // 能量轨道
        const glowMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
        const rail = new THREE.Mesh(
            new THREE.BoxGeometry(0.14, 0.01, 0.5),
            glowMat
        );
        rail.position.y = 0.04;
        this.mesh.add(rail);

        // 枪管
        const barrelTop = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.02, 0.4),
            bodyMat
        );
        barrelTop.position.set(0, 0.06, -0.4);
        this.mesh.add(barrelTop);

        const barrelBottom = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.02, 0.4),
            bodyMat
        );
        barrelBottom.position.set(0, -0.01, -0.4);
        this.mesh.add(barrelBottom);

        // 枪口
        const tipMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
        this.barrelTip = new THREE.Mesh(
            new THREE.SphereGeometry(0.04, 8, 8),
            tipMat
        );
        this.barrelTip.position.set(0, 0.03, -0.55);
        this.mesh.add(this.barrelTip);

        // 位置
        this.mesh.position.set(0.3, -0.3, -0.6);

        // 添加到相机
        this.camera.add(this.mesh);

        // 枪口闪光灯
        this.muzzleLight = new THREE.PointLight(0x00f2ff, 5, 10);
        this.muzzleLight.visible = false;
        this.camera.add(this.muzzleLight);
    }

    /**
     * 是否可以射击
     */
    canShoot() {
        return !this.isReloading && this.currentAmmo > 0;
    }

    /**
     * 射击
     */
    shoot() {
        if (!this.canShoot()) return false;

        this.currentAmmo--;
        this.updateAmmoUI();

        // 枪口闪光
        this.showMuzzleFlash();

        // 后坐力动画
        this.playRecoilAnimation();

        return true;
    }

    /**
     * 换弹
     */
    reload() {
        if (this.isReloading || this.currentAmmo === this.maxAmmo || this.totalAmmo === 0) {
            return;
        }

        this.isReloading = true;
        this.showReloadMessage(true);

        // 换弹动画
        anime(this.mesh.rotation, {
            x: [0, 0.5, 0],
            duration: 1500,
            ease: 'inOutQuad'
        });

        anime(this.mesh.position, {
            y: [-0.25, -0.5, -0.25],
            duration: 1500,
            ease: 'inOutQuad',
            onComplete: () => {
                const needed = this.maxAmmo - this.currentAmmo;
                const toAdd = Math.min(needed, this.totalAmmo);
                this.currentAmmo += toAdd;
                this.totalAmmo -= toAdd;
                this.isReloading = false;
                this.showReloadMessage(false);
                this.updateAmmoUI();
            }
        });
    }

    /**
     * 显示枪口闪光
     */
    showMuzzleFlash() {
        if (!this.muzzleLight) return;

        const worldPos = new THREE.Vector3();
        this.barrelTip.getWorldPosition(worldPos);
        this.muzzleLight.position.copy(this.barrelTip.position);
        this.muzzleLight.visible = true;

        setTimeout(() => {
            this.muzzleLight.visible = false;
        }, 50);
    }

    /**
     * 后坐力动画
     */
    playRecoilAnimation() {
        anime(this.mesh.position, {
            z: [-0.7, -0.6],
            duration: 50,
            ease: 'outQuad',
            alternate: true
        });
    }

    /**
     * 更新弹药 UI
     */
    updateAmmoUI() {
        const el = document.getElementById('ammo-count');
        if (el) {
            el.textContent = `${this.currentAmmo} / ${this.totalAmmo}`;
            el.style.color = this.currentAmmo <= 5 ? 'red' : 'white';
        }
    }

    /**
     * 显示换弹提示
     */
    showReloadMessage(show) {
        const el = document.getElementById('reload-msg');
        if (el) {
            el.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * 更新（武器摇摆）
     */
    update(delta, inputState) {
        const isMoving = inputState.forward || inputState.backward ||
                         inputState.left || inputState.right;

        const time = performance.now();
        const swaySpeed = isMoving ? 10 : 2;
        const swayAmount = isMoving ? 0.02 : 0.005;

        this.mesh.position.x = 0.25 + Math.sin(time * 0.001 * swaySpeed) * swayAmount;
        this.mesh.position.y = -0.25 + Math.cos(time * 0.001 * swaySpeed * 2) * swayAmount;
    }

    /**
     * 销毁
     */
    destroy() {
        if (this.mesh) {
            this.camera.remove(this.mesh);
        }
        if (this.muzzleLight) {
            this.camera.remove(this.muzzleLight);
        }
    }
}

export default FPSWeapon;
