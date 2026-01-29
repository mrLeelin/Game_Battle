/**
 * FPS 世界 - 场景构建
 */
import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

export class FPSWorld {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.scene = sceneManager.scene;
    }

    /**
     * 构建世界
     */
    async build() {
        this.createLighting();
        this.createSky();
        this.createFloor();
        this.createCity();

        console.log('[FPSWorld] 世界构建完成');
    }

    /**
     * 创建光照
     */
    createLighting() {
        // 半球光 - 环境光
        const hemiLight = new THREE.HemisphereLight(0x0000ff, 0x000000, 0.2);
        hemiLight.position.set(0, 20, 0);
        this.scene.add(hemiLight);

        // 平行光 - 月光/城市光
        const sunLight = new THREE.DirectionalLight(0x4444ff, 0.5);
        sunLight.position.set(50, 20, 100);
        sunLight.castShadow = true;

        // 阴影设置
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        sunLight.shadow.bias = -0.0005;

        this.scene.add(sunLight);
    }

    /**
     * 创建天空
     */
    createSky() {
        const sky = new Sky();
        sky.scale.setScalar(450000);
        this.scene.add(sky);

        const skyUniforms = sky.material.uniforms;
        skyUniforms['turbidity'].value = 10.0;
        skyUniforms['rayleigh'].value = 3.0;
        skyUniforms['mieCoefficient'].value = 0.005;
        skyUniforms['mieDirectionalG'].value = 0.7;

        // 太阳位置（夜晚）
        const sunVec = new THREE.Vector3(0, -0.05, -1).normalize();
        skyUniforms['sunPosition'].value.copy(sunVec);
    }

    /**
     * 创建地板
     */
    createFloor() {
        const floorGroup = new THREE.Group();
        const floorSize = 1000;

        // 地板平面
        const floorPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(floorSize, floorSize),
            new THREE.MeshStandardMaterial({
                color: 0x00050a,
                roughness: 0.1,
                metalness: 0.9
            })
        );
        floorPlane.rotation.x = -Math.PI / 2;
        floorPlane.receiveShadow = true;
        floorGroup.add(floorPlane);

        // 主网格
        const gridPrimary = new THREE.GridHelper(floorSize, 100, 0x00f2ff, 0x002233);
        gridPrimary.position.y = 0.02;
        gridPrimary.material.transparent = true;
        gridPrimary.material.opacity = 0.5;
        floorGroup.add(gridPrimary);

        // 次网格
        const gridSecondary = new THREE.GridHelper(floorSize, 20, 0x00f2ff, 0x004466);
        gridSecondary.position.y = 0.03;
        gridSecondary.material.transparent = true;
        gridSecondary.material.opacity = 0.2;
        floorGroup.add(gridSecondary);

        this.scene.add(floorGroup);
    }

    /**
     * 创建城市
     */
    createCity() {
        const cityGroup = new THREE.Group();

        const buildingMat = new THREE.MeshStandardMaterial({
            color: 0x050a10,
            roughness: 0.2,
            metalness: 0.8
        });

        // 生成建筑
        for (let i = 0; i < 150; i++) {
            const h = 10 + Math.pow(Math.random(), 2) * 80;
            const w = 5 + Math.random() * 10;
            const d = 5 + Math.random() * 10;

            const x = (Math.random() - 0.5) * 600;
            const z = (Math.random() - 0.5) * 600;

            // 避开中心区域
            if (Math.abs(x) < 20 && Math.abs(z) < 20) continue;

            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(w, h, d),
                buildingMat
            );
            mesh.position.set(x, h / 2, z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            cityGroup.add(mesh);

            // 添加窗户
            this.addWindows(cityGroup, x, z, w, d, h);

            // 添加霓虹边缘
            if (Math.random() > 0.7) {
                this.addNeonEdge(cityGroup, x, z, w, d, h);
            }
        }

        this.scene.add(cityGroup);
    }

    /**
     * 添加窗户
     */
    addWindows(group, x, z, w, d, h) {
        const windowCount = Math.floor(h / 4);

        for (let j = 0; j < windowCount; j++) {
            if (Math.random() > 0.4) {
                const side = Math.floor(Math.random() * 4);
                const winW = w * 0.6;
                const winH = 0.5;

                const winMat = new THREE.MeshBasicMaterial({
                    color: Math.random() > 0.5 ? 0x00f2ff : 0xff00ff
                });
                const window = new THREE.Mesh(
                    new THREE.PlaneGeometry(winW, winH),
                    winMat
                );

                const py = Math.random() * h;

                switch (side) {
                    case 0:
                        window.position.set(x + w / 2 + 0.05, py, z);
                        window.rotation.y = Math.PI / 2;
                        break;
                    case 1:
                        window.position.set(x - w / 2 - 0.05, py, z);
                        window.rotation.y = -Math.PI / 2;
                        break;
                    case 2:
                        window.position.set(x, py, z + d / 2 + 0.05);
                        break;
                    case 3:
                        window.position.set(x, py, z - d / 2 - 0.05);
                        window.rotation.y = Math.PI;
                        break;
                }

                group.add(window);
            }
        }
    }

    /**
     * 添加霓虹边缘
     */
    addNeonEdge(group, x, z, w, d, h) {
        const edgeG = new THREE.BoxGeometry(0.2, h + 0.2, 0.2);
        const edgeM = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
        const edge = new THREE.Mesh(edgeG, edgeM);
        edge.position.set(x + w / 2, h / 2, z + d / 2);
        group.add(edge);
    }
}

export default FPSWorld;
