#!/bin/bash
set -e

echo "===== 毛茸茸星球部署脚本 ====="

# 安装依赖
echo "[1/5] 安装依赖..."
npm install --production

# 创建目录
echo "[2/5] 创建日志和上传目录..."
mkdir -p logs uploads

# 检查 .env
echo "[3/5] 检查环境配置..."
if [ ! -f .env ]; then
    echo "错误：.env 文件不存在，请先复制 .env.production 并配置"
    exit 1
fi

# 启动服务
echo "[4/5] 启动服务..."
pm2 delete maozz-front maozz-admin 2>/dev/null || true
pm2 start ecosystem.config.js

# 保存配置
echo "[5/5] 保存 PM2 配置..."
pm2 save

echo "===== 部署完成 ====="
echo "前台: http://$(curl -s ip.sb):3000"
echo "后台: http://$(curl -s ip.sb):3001/admin/login"
echo "查看日志: pm2 logs"
