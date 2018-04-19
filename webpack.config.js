const path = require("path");
const webpack = require("webpack");

const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    entry: "./src/index.ts",
    resolve: {
        extensions: [
            ".js",
            ".ts"
        ]
    },
    target: "node",
    devtool: "source-map",
    mode: "development",
    // this makes sure we include node_modules and other 3rd party libraries
    externals: [/(node_modules|main\..*\.js)/],
    output: {
        path: path.join(__dirname, "dist"),
        filename: "[name].js"
    },
    module: {
        rules: [{ test: /\.ts$/, loader: "ts-loader" }]
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: "Development",
            template: "./src/index.html",
            inject: "body"
        }),
        // Temporary Fix for issue: https://github.com/angular/angular/issues/11580
        // for 'WARNING Critical dependency: the request of a dependency is an expression'
        new webpack.ContextReplacementPlugin(
          /(.+)?angular(\\|\/)core(.+)?/,
          path.join(__dirname, "src"), // location of your src
          {} // a map of your routes
        ),
        new webpack.ContextReplacementPlugin(
          /(.+)?express(\\|\/)(.+)?/,
          path.join(__dirname, "src"),
          {}
        )
    ],
    devServer: {
        contentBase: [path.join(__dirname, "dist")],
        compress: true,
        index: "index.html",
        port: 8080
    }
}
