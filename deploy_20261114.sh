#!/bin/bash
# =====================================================================
# 毛茸茸星球 · 部署脚本（2026-11-14）
# 变更内容：
#   1. 首页侧栏 3 个 Adsterra 广告改为 srcdoc iframe + sandbox 隔离，
#      阻止广告脚本把整个页面跳转到广告站
#   2. 首页内容原生广告改为 srcdoc iframe + sandbox 隔离
#   3. 内容原生广告新增高度自适应（postMessage + ResizeObserver）
#   4. 修复 .adsterra-content-native 的 max-height:120px 裁剪问题
#   5. 同步 layout.ejs（保持 Monetag / Popunder / Social Bar 注释状态）
# 部署方式：宿主机暂存 → Docker 容器内备份 → docker cp → 重启容器
# 用法：
#   Step 1（宝塔文件管理器）：将以下 3 个文件上传到宿主机对应目录
#       views/layout.ejs            -> /www/wwwroot/maozz-pet/views/layout.ejs
#       views/index.ejs             -> /www/wwwroot/maozz-pet/views/index.ejs
#       src/public/css/style.css    -> /www/wwwroot/maozz-pet/src/public/css/style.css
#   Step 2（宝塔终端）：bash /www/wwwroot/maozz-pet/deploy_20261114.sh
# =====================================================================

set -e

# === 配置（单一来源，修改只改这里） ===
CONTAINER="maozz-pet-app"
APP_DIR="/app"
HOST_ROOT="/www/wwwroot/maozz-pet"
TS="20261114_ads_sandbox"

# 本次变更的文件列表（相对路径）
FILES=(
  "views/layout.ejs"
  "views/index.ejs"
  "src/public/css/style.css"
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
for f in "${FILES[@]}"; do
  docker exec "${CONTAINER}" mkdir -p "/app-backup/${TS}/$(dirname "${f}")"
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
  docker exec "\${CONTAINER}" mkdir -p "/app-backup/\${TS}/\$(dirname "\${f}")"
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
  docker exec "${CONTAINER}" mkdir -p "${APP_DIR}/$(dirname "${f}")"
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
echo "--- 文件一致性校验（宿主机 vs 容器）---"
for f in "${FILES[@]}"; do
  H=$(md5sum "${HOST_ROOT}/${f}" | awk '{print $1}')
  C=$(docker exec "${CONTAINER}" md5sum "${APP_DIR}/${f}" | awk '{print $1}')
  if [ "${H}" = "${C}" ]; then
    echo "  [一致] ${f}"
  else
    echo "  [不一致] ${f} host=${H} container=${C}"
  fi
done

echo ""
echo "--- 首页广告隔离检查（sandbox iframe 应为 4 个）---"
docker exec "${CONTAINER}" sh -c 'wget -qO- http://127.0.0.1:3000/ | grep -c "allow-scripts allow-same-origin" || echo 0' | sed 's/^/sandbox iframe 数量: /'
docker exec "${CONTAINER}" sh -c 'wget -qO- http://127.0.0.1:3000/ | grep -c "nativeAdFrame" || echo 0' | sed 's/^/高度自适应 iframe 命中: /'
docker exec "${CONTAINER}" sh -c 'wget -qO- http://127.0.0.1:3000/ | grep -c "adsterra-content-native" || echo 0' | sed 's/^/内容原生广告容器命中: /'

echo ""
echo "--- CSS 裁剪修复检查 ---"
docker exec "${CONTAINER}" sh -c 'wget -qO- http://127.0.0.1:3000/css/style.css | grep -c "max-height: 120px" || echo 0' | sed 's/^/残留 max-height:120px 数量: /'
docker exec "${CONTAINER}" sh -c 'wget -qO- http://127.0.0.1:3000/css/style.css | grep -c "adsterra-content-native" || echo 0' | sed 's/^/CSS 中 .adsterra-content-native 命中: /'

echo ""
echo "提示：style.css 线上缓存 1 天，验收请用无痕窗口或强制刷新（Ctrl+F5）。"
echo "部署完成。回滚命令：bash ${ROLLBACK_FILE}"
