#!/bin/bash
set -euxo pipefail

API_PORT="${api_port}"
APP_DIR="/opt/autobe"
SRC_DIR="$APP_DIR/src"

# 소스 압축 해제
cd "$APP_DIR"
rm -rf src
mkdir -p src
tar -xzf app-deploy.tar.gz -C src
rm -f app-deploy.tar.gz

# .env를 앱 디렉토리로 복사
cp "$APP_DIR/.env" "$SRC_DIR/.env"

# 빌드 (nestia sdk가 ~450MB 힙을 사용하므로 한도 확장)
export NODE_OPTIONS="--max-old-space-size=1536"
cd "$SRC_DIR"
pnpm install --frozen-lockfile
pnpm run build:prisma
pnpm run build:sdk
pnpm run build:main
pnpm run build:swagger

# 기존 프로세스 종료
pkill -f "node lib/executable/server" 2>/dev/null || true
pkill -f "node lib/executable/swagger" 2>/dev/null || true
sleep 2

# DB 스키마 푸시 (첫 배포 시 테이블 생성)
npx prisma db push --schema prisma/schema

# Seed 데이터 초기화 (idempotent)
node lib/executable/seed

# 백그라운드 실행 (setsid로 새 세션 생성 → SSH 종료와 완전 분리)
unset NODE_OPTIONS
setsid node lib/executable/server > "$APP_DIR/app.log" 2>&1 < /dev/null &
setsid node lib/executable/swagger --skipBuild > "$APP_DIR/swagger.log" 2>&1 < /dev/null &

# 헬스 체크
sleep 5
tail -20 "$APP_DIR/app.log"

echo "Deploy complete. API on port $API_PORT, Swagger UI on port 37810"
