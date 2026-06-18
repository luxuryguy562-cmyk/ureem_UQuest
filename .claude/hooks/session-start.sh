#!/bin/bash
# U-Quest SessionStart hook.
# 매 세션 시작 시 의존성 설치 + 타입체크로 작업 가능 상태를 보장한다.
# 참고: 이 훅은 캐시플로우와 무관한 U-Quest 전용 환경만 준비한다.
set -euo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}"

echo "[U-Quest] Installing dependencies (npm install)..."
npm install --no-audit --no-fund

echo "[U-Quest] Running typecheck (tsc --noEmit)..."
# 타입 에러가 있어도 세션 시작 자체는 막지 않는다(정보성). 결과만 로그로 남긴다.
if npm run typecheck; then
  echo "[U-Quest] Typecheck passed."
else
  echo "[U-Quest] Typecheck reported issues — see output above."
fi

echo "[U-Quest] SessionStart hook complete."
