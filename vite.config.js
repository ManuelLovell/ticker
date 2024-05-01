import path from 'path'

export default {
    base: "./",
    build: {
        target: 'esnext',
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'index.html'),
                whatsnew: path.resolve(__dirname, 'whatsnew/bswhatsnew.html'),
            }
        }
    },
}