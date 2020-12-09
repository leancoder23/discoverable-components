const path = require('path');

module.exports = {
    mode: 'production',
    entry: './src/main.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'dwc-dev-tools.js',
        library: 'dwcDevTools',
        libraryTarget: 'umd'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    module: {
        rules: [
            { 
                test: /\.tsx?$/, 
                loader: 'ts-loader',
                options: {
                    configFile: 'tsconfig.dev-tools.json'
	            }
            }
        ]
    }
};