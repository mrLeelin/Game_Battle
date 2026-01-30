/**
 * 通用滚动列表组件
 * 支持下拉刷新和上拉加载
 */
export class ScrollableList {
    /**
     * @param {HTMLElement} container - 列表容器元素
     * @param {Object} options - 配置项
     * @param {Function} options.onRefresh - 下拉刷新回调 (返回 Promise)
     * @param {Function} options.onLoadMore - 上拉加载回调 (返回 Promise)
     */
    constructor(container, options = {}) {
        this.container = container;
        this.options = options;

        this.isRefreshing = false;
        this.isLoadingMore = false;
        this.touchStartY = 0;
        this.touchMoveY = 0;
        this.pullDistance = 0;
        this.maxPullDistance = 80;
        this.threshold = 50;

        this.initUI();
        this.bindEvents();
    }

    /**
     * 初始化 UI 结构
     */
    initUI() {
        // 确保容器定位
        const computedStyle = window.getComputedStyle(this.container);
        if (computedStyle.position === 'static') {
            this.container.style.position = 'relative';
        }

        // 下拉刷新指示器
        this.refreshIndicator = document.createElement('div');
        this.refreshIndicator.className = 'list-refresh-indicator';
        this.refreshIndicator.innerHTML = '<div class="spinner"></div><span class="text">下拉刷新</span>';
        this.container.parentNode.insertBefore(this.refreshIndicator, this.container);

        // 上拉加载指示器
        this.loadMoreIndicator = document.createElement('div');
        this.loadMoreIndicator.className = 'list-load-more-indicator';
        this.loadMoreIndicator.innerHTML = '<div class="spinner"></div><span class="text">加载更多...</span>';
        this.loadMoreIndicator.style.display = 'none';
        this.container.parentNode.insertBefore(this.loadMoreIndicator, this.container.nextSibling);
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 触摸事件处理下拉刷新
        this.container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        this.container.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.container.addEventListener('touchend', this.handleTouchEnd.bind(this));

        // 滚动事件处理上拉加载
        this.container.addEventListener('scroll', this.handleScroll.bind(this));
    }

    handleTouchStart(e) {
        if (this.container.scrollTop > 0 || this.isRefreshing) return;
        this.touchStartY = e.touches[0].clientY;
        this.isDragging = true;
    }

    handleTouchMove(e) {
        if (!this.isDragging) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - this.touchStartY;

        // 只有在顶部向下拉时触发
        if (diff > 0 && this.container.scrollTop <= 0) {
            e.preventDefault(); // 阻止默认滚动
            
            // 阻尼效果
            this.pullDistance = Math.min(diff * 0.5, this.maxPullDistance);
            
            this.updateRefreshUI(this.pullDistance);
        }
    }

    handleTouchEnd() {
        if (!this.isDragging) return;
        this.isDragging = false;

        if (this.pullDistance >= this.threshold) {
            this.startRefresh();
        } else {
            this.resetRefreshUI();
        }
    }

    handleScroll() {
        if (this.isLoadingMore || !this.options.onLoadMore) return;

        const { scrollTop, scrollHeight, clientHeight } = this.container;
        const distanceToBottom = scrollHeight - scrollTop - clientHeight;

        // 距离底部 20px 时触发加载
        if (distanceToBottom < 20) {
            this.startLoadMore();
        }
    }

    updateRefreshUI(distance) {
        this.refreshIndicator.style.height = `${distance}px`;
        this.refreshIndicator.style.opacity = Math.min(distance / this.threshold, 1);
        
        const text = this.refreshIndicator.querySelector('.text');
        if (distance >= this.threshold) {
            text.textContent = '释放刷新';
            this.refreshIndicator.classList.add('ready');
        } else {
            text.textContent = '下拉刷新';
            this.refreshIndicator.classList.remove('ready');
        }
    }

    resetRefreshUI() {
        this.pullDistance = 0;
        this.refreshIndicator.style.height = '0px';
        this.refreshIndicator.style.opacity = '0';
        this.refreshIndicator.classList.remove('refreshing');
    }

    async startRefresh() {
        if (this.isRefreshing || !this.options.onRefresh) {
            this.resetRefreshUI();
            return;
        }

        this.isRefreshing = true;
        this.refreshIndicator.classList.add('refreshing');
        this.refreshIndicator.style.height = '50px';
        this.refreshIndicator.querySelector('.text').textContent = '刷新中...';

        try {
            await this.options.onRefresh();
        } catch (error) {
            console.error('Refresh failed:', error);
        } finally {
            this.isRefreshing = false;
            // 延迟一点重置，让用户看到完成状态
            setTimeout(() => this.resetRefreshUI(), 500);
        }
    }

    async startLoadMore() {
        if (this.isLoadingMore) return;

        this.isLoadingMore = true;
        this.loadMoreIndicator.style.display = 'flex';

        try {
            const hasMore = await this.options.onLoadMore();
            if (!hasMore) {
                // 如果没有更多数据，可以移除监听或显示"没有更多"
                // 这里简单隐藏
            }
        } catch (error) {
            console.error('Load more failed:', error);
        } finally {
            this.isLoadingMore = false;
            this.loadMoreIndicator.style.display = 'none';
        }
    }
}
