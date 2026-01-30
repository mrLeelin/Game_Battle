import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        host: true, // Listen on all network addresses
        port: 8080
    },
    root: 'client', // Since we moved files to /client
    build: {
        outDir: '../dist',
        emptyOutDir: true
    },
    css: {
        postcss: '../postcss.config.js'
    }
});
