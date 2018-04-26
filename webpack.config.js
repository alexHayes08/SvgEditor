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
        "./src/index.ts",
        "./src/ui/index.ui.js"
    ],
    resolve: {
        extensions: [
            ".js",
            ".ts"
        ],
        modules: [
            path.resolve(__dirname, "src"),
            "node_modules"
        ]
    },
    target: "web",
    devtool: "source-map",
    mode: "development",
    output: {
        library: [ "Aperture" ],
        libraryTarget: "umd",
        libraryExport: "Aperture",
        path: path.join(__dirname, "dist/"),
        filename: "SvgEditor.lib.js"
    },
    module: {
        rules: [
            { 
                test: /\.ts$/, 
                loader: "ts-loader", 
                exclude: "/node_modules/" 
            },
            {
                test: /\.js$/,
                exclude: "/node_modules/",
                use: {
                    loader: "babel-loader",
                    options: {
                        babelrc: true,
                        presets: ["babel-preset-env"]
                    }
                }
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: "Development",
            template: "./src/ui/index.html",
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
        modules: [
            path.resolve(__dirname, "./src"), 
            "node_modules"
        ],
        extensions: [".ts", ".tsx", ".js"]
    },
    devServer: {
        contentBase: ["./dist/"],
        // index: "index.html",
        port: 8080
    },
    // this makes sure we include node_modules and other 3rd party libraries
    // externals: [/(node_modules|main\..*\.js)/],
    externals: {
        jquery: "$",
        d3: "d3",
        all: /(node_modules|main\..*\.js)/
    },
    node: {
        // This is a fix for ioc-container
        fs:  "empty"
    }
}

// module.exports = [ clientConfig, serverConfig ];
module.exports = clientConfig;