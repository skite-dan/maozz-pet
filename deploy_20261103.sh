#!/bin/bash
# =====================================================================
# 毛茸茸星球 · 部署脚本（2026-11-03）
# 变更内容：
#   1. Adsterra Popunder 全站化（layout.ejs </head> 前，每页一份）
#   2. Adsterra Social Bar 全站化（layout.ejs </body> 前，每页一份）
#   3. 移除首页原有的 Social Bar（index.ejs），避免重复
# 部署方式：宿主机暂存 → Docker 容器内备份 → docker cp → 重启容器
# 用法：
#   Step 1（宝塔文件管理器）：将以下 2 个文件上传到宿主机对应目录
#       views/layout.ejs   -> /www/wwwroot/maozz-pet/views/layout.ejs
#       views/index.ejs    -> /www/wwwroot/maozz-pet/views/index.ejs
#   Step 2（宝塔终端）：bash /www/wwwroot/maozz-pet/deploy_20261103.sh
# =====================================================================

set -e

# === 配置（单一来源，修改只改这里） ===
CONTAINER="maozz-pet-app"
APP_DIR="/app"
HOST_ROOT="/www/wwwroot/maozz-pet"
TS="20261103_ads_layout"

# 本次变更的文件列表（相对路径）
FILES=(
  "views/layout.ejs"
  "views/index.ejs"
)

ROLLBACK_FILE="${HOST_ROOT}/rollback_${TS}.sh"

# === Step 0: 预检宿主机暂存文件是否齐全 ===
echo "=== Step 0: 预检宿主机暂存文件 ==="
MISSING=0
for f in "${FILES[@]}"; do
  if [ ! -f "${HOST_ROOT}/${f}" ]; then
    echo "  [缺失] ${HOST_ROOT}/${f}"
    MISSING=1
  else
    echo "  [就绪] ${HOST_ROOT}/${f}"
  fi
done
if [ "${MISSING}" -ne 0 ]; then
  echo "错误：部分文件未上传到宿主机，请先通过宝塔文件管理器补齐后再执行。"
  exit 1
fi

# === Step 1: 容器内备份原文件 ===
echo ""
echo "=== Step 1: 备份容器原文件到 /app-backup/${TS} ==="
docker exec "${CONTAINER}" mkdir -p "/app-backup/${TS}/views"
for f in "${FILES[@]}"; do
  docker exec "${CONTAINER}" cp "${APP_DIR}/${f}" "/app-backup/${TS}/${f}"
  echo "  [已备份] ${f}"
done

# === Step 2: 生成回滚脚本 ===
echo ""
echo "=== Step 2: 生成回滚脚本 ${ROLLBACK_FILE} ==="
cat > "${ROLLBACK_FILE}" << ROLLBACK_EOF
#!/bin/bash
# 回滚脚本：将 ${TS} 备份的文件还原到容器并重启
set -e
CONTAINER="${CONTAINER}"
APP_DIR="${APP_DIR}"
TS="${TS}"
ROLLBACK_FILES=($(printf '"%s" ' "${FILES[@]}"))
echo "=== 开始回滚到 ${TS} ==="
for f in "\${ROLLBACK_FILES[@]}"; do
  docker exec "\${CONTAINER}" cp "/app-backup/\${TS}/\${f}" "\${APP_DIR}/\${f}"
  echo "  [已还原] \${f}"
done
docker restart "\${CONTAINER}"
sleep 5
echo "=== 回滚完成 ==="
docker exec "\${CONTAINER}" pm2 list
ROLLBACK_EOF
chmod +x "${ROLLBACK_FILE}"
echo "  回滚脚本已生成：${ROLLBACK_FILE}"

# === Step 3: 复制新文件到容器 ===
echo ""
echo "=== Step 3: 复制新文件到容器 ==="
for f in "${FILES[@]}"; do
  docker cp "${HOST_ROOT}/${f}" "${CONTAINER}:${APP_DIR}/${f}"
  echo "  [已部署] ${f}"
done

# === Step 4: 重启容器 ===
echo ""
echo "=== Step 4: 重启容器 ${CONTAINER} ==="
docker restart "${CONTAINER}"

# === Step 5: 验证 ===
echo ""
echo "=== Step 5: 验证 ==="
sleep 5
docker exec "${CONTAINER}" pm2 list
echo ""
echo "--- 广告脚本落地检查（每页应各命中 1 次）---"
docker exec "${CONTAINER}" sh -c 'wget -qO- http://127.0.0.1:3000/ | grep -c "afders.org" || echo 0' | sed 's/^/首页 Popunder 命中: /'
docker exec "${CONTAINER}" sh -c 'wget -qO- http://127.0.0.1:3000/tools | grep -c "pl30527772" || echo 0' | sed 's/^/工具箱 SocialBar 命中: /'
echo ""
echo "部署完成。回滚命令：bash ${ROLLBACK_FILE}"
