// webpack.config.js
const path = require("path");
const { builtinModules } = require("module");

module.exports = {
  mode: "production",
  target: "node", // VS Code Extension Host (Node)
  entry: "./src/extension.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "extension.js",
    libraryTarget: "commonjs2", // CJS 출력
    clean: true,
  },
  devtool: "source-map",
  externals: [
    "vscode", // ← Host가 주입
    ...builtinModules, // ← fs, path 등 Node 내장 모듈은 외부 처리(권장)
  ],
  resolve: {
    extensions: [".ts", ".js"],
    // monorepo 워크스페이스 쓰는 경우 ESM 패키지의 fullySpecified 에러 예방
    extensionAlias: { ".js": [".ts", ".js"] },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        exclude: /node_modules/,
        options: {
          transpileOnly: true, // 속도↑ (타입체크는 tsc 스크립트로 별도)
        },
      },
    ],
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  // 일부 네이티브 optional deps를 참조만 하고 설치 안 했다면 오류 방지
  ignoreWarnings: [{ module: /bufferutil/ }, { module: /utf-8-validate/ }],
};
