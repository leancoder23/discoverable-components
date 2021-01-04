const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: {
        'main': './src/index.js',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        historyApiFallback: true,
        hot: true,
        port: 8080,
        headers: {
            "Access-Control-Allow-Origin": "webpack://example-legacy",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
          }
    },
    module: {
        rules: [
            { 
                test: /\.tsx?$/, 
                loader: 'ts-loader',
                options: {
                    configFile: 'tsconfig.example.json'
	            }
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            alwaysWriteToDisk: true,
            filename: 'index.html',
            hash: true,
            inject: true,
            publicPath: '/',
            template: './src/index.html',
            xhtml: true,
        }),
    ]
};