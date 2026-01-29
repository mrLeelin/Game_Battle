/**
 * 网络管理器 - Socket.io 封装
 * 统一管理网络连接和事件
 */
import { io } from 'socket.io-client';
import { NETWORK } from '../../shared/Constants.js';
import { eventBus } from './EventBus.js';

class Network {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.serverUrl = null;
    }

    /**
     * 连接服务器
     * @param {string} [url] - 服务器地址，默认使用当前主机
     * @returns {Promise<void>}
     */
    connect(url) {
        return new Promise((resolve, reject) => {
            const serverHost = window.location.hostname || 'localhost';
            this.serverUrl = url || `http://${serverHost}:${NETWORK.SERVER_PORT}`;

            this.socket = io(this.serverUrl);

            this.socket.on('connect', () => {
                console.log('[Network] 已连接到服务器:', this.socket.id);
                this.isConnected = true;
                eventBus.emit('network:connected', { id: this.socket.id });
                resolve();
            });

            this.socket.on('disconnect', (reason) => {
                console.log('[Network] 断开连接:', reason);
                this.isConnected = false;
                eventBus.emit('network:disconnected', { reason });
            });

            this.socket.on('connect_error', (error) => {
                console.error('[Network] 连接错误:', error);
                eventBus.emit('network:error', { error });
                reject(error);
            });

            // 连接超时
            setTimeout(() => {
                if (!this.isConnected) {
                    reject(new Error('连接超时'));
                }
            }, 5000);
        });
    }

    /**
     * 断开连接
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    /**
     * 发送事件
     * @param {string} event - 事件名
     * @param {*} data - 数据
     */
    emit(event, data) {
        if (this.socket && this.isConnected) {
            this.socket.emit(event, data);
        } else {
            console.warn('[Network] 未连接，无法发送:', event);
        }
    }

    /**
     * 监听事件
     * @param {string} event - 事件名
     * @param {Function} callback - 回调函数
     * @returns {Function} 取消监听函数
     */
    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
            return () => this.socket.off(event, callback);
        }
        return () => {};
    }

    /**
     * 取消监听
     * @param {string} event - 事件名
     * @param {Function} [callback] - 回调函数，不传则移除所有
     */
    off(event, callback) {
        if (this.socket) {
            if (callback) {
                this.socket.off(event, callback);
            } else {
                this.socket.removeAllListeners(event);
            }
        }
    }

    /**
     * 获取当前 Socket ID
     * @returns {string|null}
     */
    get id() {
        return this.socket?.id || null;
    }
}

// 全局单例
export const network = new Network();
export default Network;
