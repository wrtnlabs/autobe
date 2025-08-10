const {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
} = require("fs");
const { join, dirname } = require("path");

// 상수 정의
const PRISMA_SCHEMA_BUILD_WASM = "prisma_schema_build_bg.wasm";
const PRISMA_SCHEMA_WASM_PACKAGE = "prisma-schema-wasm";
const PNPM_DIRECTORY = ".pnpm";
const NODE_MODULES_PATH = "../../../node_modules";
const DIST_CHUNKS_PATH = "../dist/chunks";

// .pnpm 디렉토리에서 prisma-schema-wasm이 포함된 디렉토리를 찾는 함수
function findPrismaSchemaWasmInPnpm(pnpmPath) {
  try {
    const items = readdirSync(pnpmPath);

    // prisma-schema-wasm이 포함된 디렉토리 찾기
    const prismaSchemaDir = items.find((item) =>
      item.includes(PRISMA_SCHEMA_WASM_PACKAGE),
    );

    if (!prismaSchemaDir) {
      return null;
    }

    const packagePath = join(pnpmPath, prismaSchemaDir);
    const wasmPath = join(packagePath, "./node_modules/@prisma",PRISMA_SCHEMA_WASM_PACKAGE, "src", PRISMA_SCHEMA_BUILD_WASM);
    console.log(wasmPath);
    console.log(existsSync(wasmPath));
    return existsSync(wasmPath) ? wasmPath : null;
  } catch (error) {
    console.error(`❌ .pnpm 디렉토리 읽기 오류:`, error.message);
    return null;
  }
}

// 대상 디렉토리 경로
const targetDir = join(__dirname, DIST_CHUNKS_PATH);
const targetPath = join(targetDir, PRISMA_SCHEMA_BUILD_WASM);

try {
  // .pnpm 디렉토리 경로
  const pnpmPath = join(__dirname, NODE_MODULES_PATH, PNPM_DIRECTORY);
  console.log(`🔍 .pnpm 디렉토리에서 prisma-schema-wasm 패키지를 찾는 중...`);

  if (!existsSync(pnpmPath)) {
    console.error(`❌ .pnpm 디렉토리를 찾을 수 없습니다: ${pnpmPath}`);
    return;
  }

  const sourcePath = findPrismaSchemaWasmInPnpm(pnpmPath);

  if (!sourcePath) {
    console.error(
      `❌ ${PRISMA_SCHEMA_BUILD_WASM} 파일을 .pnpm 디렉토리에서 찾을 수 없습니다.`,
    );
    console.error(`   검색 경로: ${pnpmPath}`);
    return;
  }

  console.log(`✅ 파일 발견: ${sourcePath}`);

  // 대상 디렉토리가 존재하지 않으면 생성
  if (!existsSync(targetDir)) {
    console.log(`📁 디렉토리 생성: ${targetDir}`);
    mkdirSync(targetDir, { recursive: true });
  }

  // 파일 복사
  console.log(`📋 파일 복사 중: ${PRISMA_SCHEMA_BUILD_WASM}`);
  copyFileSync(sourcePath, targetPath);

  console.log(`✅ 성공적으로 복사되었습니다: ${targetPath}`);
} catch (error) {
  console.error(`❌ 파일 복사 중 오류 발생:`, error.message);
  return;
}
