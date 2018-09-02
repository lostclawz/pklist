
module.exports = function(env, argv){
    return {
        mode: env && env.production ? "production" : "development",
        entry: "./src/index.js",
        module: {
            rules: [
                {
                    test: /.jsx?$/,
                    exclude: /node_modules/,
                    use: [{
                        loader: 'babel-loader', options: {
                            cacheDirectory: true
                        }
                    }]
                }
            ]
        },
        performance: {
            hints: false
        },
        devtool: "source-map",
        watch: !env || !env.production
    }
}