import path from "path"

export default {
    entry: './static/scripts/index.js',
    output: {
        filename: 'index.min.js',
        path: path.resolve('', 'build/static/scripts/')
    },
    mode: "production",
    optimization: {
        minimize: false
    }
};
