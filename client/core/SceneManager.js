/**
 * 场景管理器 - Three.js 场景封装
 * 管理渲染器、相机、后处理等
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

class SceneManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
        this.isInitialized = false;
    }

    /**
     * 初始化渲染系统
     * @param {Object} options - 配置选项
     */
    init(options = {}) {
        if (this.isInitialized) {
            console.warn('[SceneManager] 已初始化');
            return;
        }

        const {
            antialias = true,
            enableShadows = true,
            enableBloom = true,
            backgroundColor = 0x000510
        } = options;

        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(backgroundColor);
        this.scene.fog = new THREE.FogExp2(backgroundColor, 0.015);

        // 创建相机
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.rotation.order = 'YXZ';
        this.camera.position.y = 1.6;

        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({
            antialias,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        if (enableShadows) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }

        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        document.body.appendChild(this.renderer.domElement);

        // 创建后处理
        if (enableBloom) {
            this.setupPostProcessing();
        }

        // 窗口大小变化处理
        window.addEventListener('resize', this.onResize.bind(this));

        this.isInitialized = true;
        console.log('[SceneManager] 初始化完成');
    }

    /**
     * 设置后处理效果
     */
    setupPostProcessing() {
        this.composer = new EffectComposer(this.renderer);

        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5, 0.4, 0.85
        );
        bloomPass.threshold = 0.2;
        bloomPass.strength = 1.2;
        bloomPass.radius = 0.5;
        this.composer.addPass(bloomPass);
    }

    /**
     * 渲染一帧
     */
    render() {
        if (this.composer) {
            this.composer.render();
        } else if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    /**
     * 窗口大小变化处理
     */
    onResize() {
        if (!this.camera || !this.renderer) return;

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        if (this.composer) {
            this.composer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    /**
     * 添加对象到场景
     * @param {THREE.Object3D} object
     */
    add(object) {
        if (this.scene) {
            this.scene.add(object);
        }
    }

    /**
     * 从场景移除对象
     * @param {THREE.Object3D} object
     */
    remove(object) {
        if (this.scene) {
            this.scene.remove(object);
        }
    }

    /**
     * 清空场景
     */
    clearScene() {
        if (!this.scene) return;

        while (this.scene.children.length > 0) {
            const object = this.scene.children[0];
            this.scene.remove(object);

            // 释放几何体和材质
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(m => m.dispose());
                } else {
                    object.material.dispose();
                }
            }
        }
    }

    /**
     * 销毁场景管理器
     */
    destroy() {
        this.clearScene();

        window.removeEventListener('resize', this.onResize.bind(this));

        if (this.renderer) {
            this.renderer.dispose();
            document.body.removeChild(this.renderer.domElement);
        }

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
        this.isInitialized = false;

        console.log('[SceneManager] 已销毁');
    }
}

// 全局单例
export const sceneManager = new SceneManager();
export default SceneManager;
