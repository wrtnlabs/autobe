// rspack.config.js
const path = require("path");
const { builtinModules } = require("module");

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
    ...builtinModules, // fs, path 등 Node 내장 모듈은 외부 처리
  ],
  resolve: {
    extensions: [".ts", ".js", ".json"],
    extensionAlias: {
      ".js": [".ts", ".js"],
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true, // 타입체크는 tsc 별도 실행
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        // Dependency packages may import files without extensions
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false
        }
      },
    ],
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  ignoreWarnings: [{ module: /bufferutil/ }, { module: /utf-8-validate/ }],
};
