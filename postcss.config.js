/**
 * PostCSS 配置
 * 自动将 px 转换为 vw
 */
export default {
    plugins: {
        'postcss-px-to-viewport': {
            viewportWidth: 375,       // 设计稿宽度
            viewportHeight: 667,      // 设计稿高度
            unitPrecision: 3,         // 转换后保留的小数位
            viewportUnit: 'vw',       // 转换单位
            selectorBlackList: [      // 不转换的选择器
                '.no-vw',
                '.ignore-vw',
                '#three-canvas',
                '.three-',
                'canvas'
            ],
            minPixelValue: 1,         // 最小转换像素值
            mediaQuery: false,        // 是否转换媒体查询中的 px
            replace: true,            // 直接替换而非追加
            exclude: [                // 排除的文件
                /node_modules/,
                /three/
            ],
            include: undefined,       // 只转换匹配的文件
            landscape: false,         // 是否添加横屏媒体查询
            landscapeUnit: 'vw',      // 横屏单位
            landscapeWidth: 667       // 横屏宽度
        }
    }
};
