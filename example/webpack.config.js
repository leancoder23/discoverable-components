const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: {
        'dwc-dev-tools': './src/inject-dev-tools.ts',
        'todo-data-broker': './src/components/todo-data-broker/main.ts',
        'todo-list-ui': './src/components/todo-list-ui/main.ts',
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