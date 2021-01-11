const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = {
    mode: 'development',
    entry: {
        'dwc-dev-tools': './src/inject-dev-tools.ts',
        'todo-data-broker': './src/components/todo-data-broker/main.ts',
        'todo-list-ui': './src/components/todo-list-ui/main.ts',
        'todo-list-ui-vue': './src/components/todo-list-ui-vue/main.ts',
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
        port: 8080
    },
    module: {
        rules: [
            { 
                test: /\.tsx?$/, 
                loader: 'ts-loader',
                options: {
                    configFile: 'tsconfig.example.json'
	            }
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader'
            }
        ]
    },
    plugins: [
        new VueLoaderPlugin(),
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