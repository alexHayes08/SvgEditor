const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

// var serverConfig = {
//     entry: {
//         svgeditor: "./src/index.ts"
//     },
//     resolve: {
//         extensions: [
//             ".js",
//             ".ts"
//         ]
//     },
//     target: "node",
//     devtool: "source-map",
//     mode: "development",
//     // this makes sure we include node_modules and other 3rd party libraries
//     externals: [/(node_modules|main\..*\.js)/],
//     output: {
//         library: "Aperture.SvgEditors",
//         libraryTarget: "umd",
//         libraryExport: "default",
//         path: path.join(__dirname, "dist/server"),
//         filename: "[name].js",
//         umdNamedDefine: true
//     },
//     module: {
//         rules: [{ test: /\.ts$/, loader: "ts-loader" }]
//     },
//     plugins: [
//         // Temporary Fix for issue: https://github.com/angular/angular/issues/11580
//         // for 'WARNING Critical dependency: the request of a dependency is an expression'
//         new webpack.ContextReplacementPlugin(
//           /(.+)?angular(\\|\/)core(.+)?/,
//           path.join(__dirname, "src"), // location of your src
//           {} // a map of your routes
//         ),
//         new webpack.ContextReplacementPlugin(
//           /(.+)?express(\\|\/)(.+)?/,
//           path.join(__dirname, "src"),
//           {}
//         )
//     ]
// }

var clientConfig = {
    entry: [
        "./src/index.ui.js",
        "./src/index.ts"
    ],
    resolve: {
        extensions: [
            ".js",
            ".ts"
        ]
    },
    // target: "web",
    devtool: "source-map",
    mode: "development",
    // this makes sure we include node_modules and other 3rd party libraries
    // externals: [/(node_modules|main\..*\.js)/],
    output: {
        library: [ "Aperture", "[name]" ],
        libraryTarget: "umd",
        libraryExport: "default",
        path: path.join(__dirname, "dist/"),
        filename: "[name].lib.js"
    },
    module: {
        rules: [{ 
            test: /\.ts$/, 
            loader: "ts-loader", 
            exclude: "/node_modules/" 
        }]
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
    resolve: {
        modules: [path.resolve(__dirname, "./src"), "node_modules"],
        extensions: [".ts", ".tsx", ".js"]
    },
    devServer: {
        contentBase: ["./dist/"],
        // index: "index.html",
        port: 8080
    },
    externals: {
        jquery: 'jQuery'
    }
}

// module.exports = [ clientConfig, serverConfig ];
module.exports = clientConfig;