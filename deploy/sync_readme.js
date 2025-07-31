const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const yaml = require("js-yaml");

// 루트 README.md 파일 경로
const rootReadmePath = path.join(__dirname, "..", "README.md");
const rootLicensePath = path.join(__dirname, "..", "LICENSE");
const workspaceConfigPath = path.join(__dirname, "..", "pnpm-workspace.yaml");

// pnpm-workspace.yaml 파일 읽기
const workspaceConfig = yaml.load(fs.readFileSync(workspaceConfigPath, "utf8"));
const workspacePatterns = workspaceConfig.packages;

// README.md 파일 내용 읽기
const readmeContent = fs.readFileSync(rootReadmePath, "utf-8");
const licenseContent = fs.readFileSync(rootLicensePath, "utf-8");

// 각 워크스페이스에 README.md 복사
workspacePatterns.forEach((pattern) => {
  try {
    // 패턴에 맞는 디렉토리 찾기
    const dirs = execSync(`find ${pattern} -type d -maxdepth 0`, {
      encoding: "utf8",
    })
      .trim()
      .split("\n");

    dirs.forEach((dir) => {
      if (dir) {
        const targetPath = path.join(dir, "README.md");
        console.warn(`Copying README.md to ${targetPath}`);
        fs.writeFileSync(targetPath, readmeContent);
        fs.writeFileSync(path.join(dir, "LICENSE"), licenseContent);
      }
    });
  } catch (error) {
    console.error(`Error processing pattern ${pattern}:`, error.message);
  }
});

console.warn("README.md sync completed!");
