/**
 * FPS 玩家 - 其他玩家的可视化
 */
import * as THREE from 'three';

export class FPSPlayer {
    constructor(id) {
        this.id = id;
        this.mesh = this.createMesh();
        this.gun = null;
    }

    /**
     * 创建玩家模型
     */
    createMesh() {
        const group = new THREE.Group();

        // 身体 - 暗铬
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x000000,
            roughness: 0,
            metalness: 1,
            emissive: 0x001122
        });
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 1.8, 0.8),
            bodyMat
        );
        body.position.y = 0.9;
        group.add(body);

        // 内核发光
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
        const core = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 1.4, 0.4),
            coreMat
        );
        core.position.y = 0.9;
        group.add(core);

        // 头盔/面罩
        const visorMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
        const visor = new THREE.Mesh(
            new THREE.BoxGeometry(0.7, 0.1, 0.82),
            visorMat
        );
        visor.position.set(0, 1.65, 0);
        group.add(visor);

        // 武器
        this.gun = this.createGun();
        this.gun.position.set(0.4, 1.4, -0.4);
        group.add(this.gun);

        return group;
    }

    /**
     * 创建武器模型
     */
    createGun() {
        const group = new THREE.Group();

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
        group.add(body);

        // 能量轨道
        const glowMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
        const rail = new THREE.Mesh(
            new THREE.BoxGeometry(0.14, 0.01, 0.5),
            glowMat
        );
        rail.position.y = 0.04;
        group.add(rail);

        // 枪管
        const barrelTop = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.02, 0.4),
            bodyMat
        );
        barrelTop.position.set(0, 0.06, -0.4);
        group.add(barrelTop);

        const barrelBottom = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.02, 0.4),
            bodyMat
        );
        barrelBottom.position.set(0, -0.01, -0.4);
        group.add(barrelBottom);

        // 枪口
        const tipMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
        const tip = new THREE.Mesh(
            new THREE.SphereGeometry(0.04, 8, 8),
            tipMat
        );
        tip.position.set(0, 0.03, -0.55);
        group.add(tip);

        return group;
    }

    /**
     * 更新位置
     * @param {Object} data - { x, y, z, rotation, pitch }
     */
    updatePosition(data) {
        this.mesh.position.set(data.x, data.y, data.z);
        this.mesh.rotation.y = data.rotation || 0;

        // 枪的俯仰
        if (this.gun && data.pitch !== undefined) {
            this.gun.rotation.x = data.pitch;
        }
    }

    /**
     * 显示枪口火焰效果
     */
    showMuzzleFlash() {
        // TODO: 添加粒子效果
    }

    /**
     * 销毁
     */
    destroy() {
        if (this.mesh.geometry) this.mesh.geometry.dispose();
        if (this.mesh.material) this.mesh.material.dispose();
    }
}

export default FPSPlayer;
