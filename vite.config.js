import path from 'path'
import inject from "@rollup/plugin-inject";

export default {
    build: {
        target: 'esnext',
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'index.html'),
            }
        }
    },
    plugins: [
        inject({
            $: 'jquery',
            jQuery: 'jquery',
        }),
    ],
}