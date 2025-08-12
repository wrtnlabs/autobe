// rspack.config.js
const path = require("path");
const { default: unpluginTypia } = require("@ryoppippi/unplugin-typia/rspack");

/** @type {import("@rspack/core").Configuration} */
module.exports = {
  mode: "production",
  target: "node", // VS Code Extension Host 환경
  entry: {
    extension: "./src/extension.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    library: { type: "commonjs2" }, // CJS 출력
    clean: true,
  },
  devtool: "source-map",
  externals: [
    "vscode", // Host가 주입하는 vscode 모듈
  ],
  resolve: {
    extensions: [".ts", ".js", ".json"],
    extensionAlias: {
      ".js": [".ts", ".js"],
    },
    tsConfig: path.resolve(__dirname, "tsconfig.json"),
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true,
            },
          },
        ],
      },
      {
        // Dependency packages may import files without extensions
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  ignoreWarnings: [{ module: /bufferutil/ }, { module: /utf-8-validate/ }],
  plugins: [unpluginTypia()],
};
