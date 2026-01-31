# 船死亡后延迟显示结算界面

## 修改日期
2025-01-31

## 修改文件
- `client/games/gunbean/GunBeanGame.js`

## 修改内容

### handleGameResult 方法

添加1秒延迟后再显示结算界面，让玩家有时间看到船只爆炸效果。

**修改位置**：`handleGameResult` 方法

**修改前**：
```javascript
handleGameResult(data) {
    this.isRunning = false;
    this.isShopOpen = false;

    // 关闭商店（如果开着的话）
    if (this.shop) {
        this.shop.hide();
    }

    const localData = data.players?.find(p => p.id === this.localPlayerId);
    this.ui.showResult({
        isWin: data.isWin,
        kills: localData?.kills || this.kills,
        surviveTime: data.surviveTime || this.countdown,
        revives: localData?.revives || 0,
        finalRound: data.finalRound || this.currentRound,
        maxRounds: data.maxRounds || this.maxRounds,
        coins: localData?.coins || this.coins
    });
}
```

**修改后**：
```javascript
handleGameResult(data) {
    this.isRunning = false;
    this.isShopOpen = false;

    // 关闭商店（如果开着的话）
    if (this.shop) {
        this.shop.hide();
    }

    // 延迟1秒后显示结算界面
    setTimeout(() => {
        const localData = data.players?.find(p => p.id === this.localPlayerId);
        this.ui.showResult({
            isWin: data.isWin,
            kills: localData?.kills || this.kills,
            surviveTime: data.surviveTime || this.countdown,
            revives: localData?.revives || 0,
            finalRound: data.finalRound || this.currentRound,
            maxRounds: data.maxRounds || this.maxRounds,
            coins: localData?.coins || this.coins
        });
    }, 1000);
}
```

## 修改原因

船死亡后立即弹出结算界面，玩家没有时间看到船只爆炸效果。添加1秒延迟让游戏体验更流畅。

## 影响范围

- 结算界面现在会在船死亡1秒后显示
- 玩家可以看到完整的船只爆炸动画
