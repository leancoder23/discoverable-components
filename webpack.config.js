const path = require("path");

module.exports = {
    mode: "production",
    entry: {
        main: "./ts-dist/lib/@dwc/decorators.js",
    },
    output: {
        path: path.join(__dirname, "dist"),
        filename: "index.js",
        library: "DiscoverableComponents",
        libraryTarget: "umd",
        umdNamedDefine: true,
    },
};
