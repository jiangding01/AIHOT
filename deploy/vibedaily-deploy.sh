#!/usr/bin/env bash
# VibeDaily 的服务器部署：把 ~/vibedaily 切到 main 上的指定提交，重新构建并启动，最后做冒烟检查。
# GitHub Actions（.github/workflows/deploy.yml）用部署密钥登录时，authorized_keys 的 command= 强制运行本脚本的
# 安装副本，提交号从 SSH_ORIGINAL_COMMAND 传入；手动运行时作为第一个参数传入，不传就部署 origin/main 的最新提交。
# 安装或更新服务器上的副本：install -Dm 755 deploy/vibedaily-deploy.sh ~/.local/bin/vibedaily-deploy
set -euo pipefail

REPO="${VIBEDAILY_DIR:-$HOME/vibedaily}"
target="${1:-${SSH_ORIGINAL_COMMAND:-}}"

# 同一时间只部署一次：后来的等前一个结束（最多 40 分钟）。
exec 9>"$HOME/.vibedaily-deploy.lock"
flock -w 2400 9

cd "$REPO"
git fetch -q origin main
[ -n "$target" ] || target=$(git rev-parse origin/main)
if [[ ! "$target" =~ ^[0-9a-f]{40}$ ]]; then
  echo "只接受 40 位提交号，收到：$target" >&2
  exit 2
fi
if ! git merge-base --is-ancestor "$target" origin/main; then
  echo "$target 不在 origin/main 上，拒绝部署" >&2
  exit 2
fi

git reset -q --hard "$target"
echo "== 部署 $(git log --oneline -1)"

# 并行数 1：内存小，且几个服务共用同一个镜像，并行导出会撞车。
COMPOSE_PARALLEL_LIMIT=1 docker compose up -d --build --remove-orphans
docker image prune -f >/dev/null

echo "== 冒烟检查"
for _ in $(seq 1 30); do
  if docker run --rm --network host aihot-app node scripts/smoke.ts --base http://127.0.0.1:3000 > /tmp/vibedaily-smoke.log 2>&1; then
    tail -1 /tmp/vibedaily-smoke.log
    echo "== 部署完成：$(git log --oneline -1)"
    exit 0
  fi
  sleep 5
done
cat /tmp/vibedaily-smoke.log >&2
docker compose ps >&2
exit 1
