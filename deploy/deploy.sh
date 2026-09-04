#!/usr/bin/env bash
# =============================================================================
# 重工机械商城部署脚本
# 用法: ./deploy.sh [server_user]
#   server_user 默认 root，可传如 app
# 前置: 已配置服务器免密 SSH（ssh-keygen -t ed25519 && ssh-copy-id user@112.124.18.181）
# =============================================================================
set -euo pipefail

SERVER="112.124.18.181"
SERVER_USER="${1:-root}"
REMOTE_HOME="/data/www/heavy-machinery"

BACKEND_PORT=8081
H5_PORT=8082

# ---------- 1. 本地构建 ----------
echo ">> 构建后端 jar..."
(
  cd "$(dirname "$0")/../server" || exit 1
  export JAVA_HOME="${JAVA_HOME:-$(/usr/libexec/java_home -v 23 2>/dev/null || echo '')}"
  mvn -q clean package -DskipTests
)

echo ">> 构建 H5 前端..."
(
  cd "$(dirname "$0")/../mobile" || exit 1
  npm run build:h5
)

# ---------- 2. 上传 ----------
echo ">> 创建远程目录..."
ssh "$SERVER_USER@$SERVER" "mkdir -p $REMOTE_HOME/server $REMOTE_HOME/mobile"

echo ">> 上传后端 jar..."
rsync -avz "$(dirname "$0")/../server/target/heavy-machinery-server-1.0.0.jar" \
  "$SERVER_USER@$SERVER:$REMOTE_HOME/server/"

echo ">> 上传 H5 前端..."
rsync -avz --delete "$(dirname "$0")/../mobile/dist/" \
  "$SERVER_USER@$SERVER:$REMOTE_HOME/mobile/"

# ---------- 3. Nginx 配置 ----------
echo ">> 上传并启用 Nginx 配置..."
scp "$(dirname "$0")/nginx/heavy-machinery.conf" \
  "$SERVER_USER@$SERVER:/tmp/heavy-machinery.conf"
ssh "$SERVER_USER@$SERVER" "sudo cp /tmp/heavy-machinery.conf /etc/nginx/conf.d/heavy-machinery.conf && sudo nginx -t && sudo nginx -s reload || echo 'nginx 配置校验失败，请手工处理'"

echo ">> 部署完成 ✅"
echo "   H5:    http://$SERVER:$H5_PORT"
echo "   API:   http://$SERVER:$BACKEND_PORT"
echo "   (后端请确认已配置 MySQL 并启动 systemd 服务 heavy-machinery)"
