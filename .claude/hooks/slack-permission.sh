#!/bin/bash
# Claude Code가 권한 요청할 때 Slack으로 알림 전송

set -euo pipefail

# stdin에서 JSON 데이터 읽기
INPUT=$(cat)

# .env.local에서 SLACK_WEBHOOK_URL 로드 (훅 실행 환경은 shell profile을 읽지 않으므로 직접 파싱)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env.local"
if [ -f "$ENV_FILE" ]; then
  SLACK_WEBHOOK_URL=$(grep '^SLACK_WEBHOOK_URL=' "$ENV_FILE" | cut -d '=' -f2-)
fi

SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
if [ -z "$SLACK_WEBHOOK_URL" ]; then
  exit 0
fi

# node로 JSON 파싱 (한글 깨짐 방지)
NOTIFICATION_TYPE=$(echo "$INPUT" | node -e "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{ const o=JSON.parse(d); process.stdout.write(o.notification_type||'unknown'); })")

# permission_prompt일 때만 알림 전송
if [ "$NOTIFICATION_TYPE" = "permission_prompt" ]; then
  TOOL_NAME=$(echo "$INPUT" | node -e "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{ const o=JSON.parse(d); process.stdout.write(o.tool_name||'알 수 없는 도구'); })")
  CWD=$(echo "$INPUT" | node -e "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{ const o=JSON.parse(d); process.stdout.write(o.cwd||''); })")
  PROJECT=$(basename "$CWD")

  # node로 UTF-8 JSON 생성 후 curl에 전달
  node -e "
const payload = {
  text: '🔐 *Claude Code 권한 요청*',
  attachments: [{
    color: 'warning',
    fields: [
      { title: '프로젝트', value: '$PROJECT', short: true },
      { title: '도구', value: '$TOOL_NAME', short: true }
    ]
  }]
}
process.stdout.write(JSON.stringify(payload))
" | curl -s -X POST "$SLACK_WEBHOOK_URL" \
    -H 'Content-type: application/json; charset=utf-8' \
    -d @-
fi

exit 0
