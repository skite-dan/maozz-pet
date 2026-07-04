FROM node:18-alpine

WORKDIR /app

# 安装 pm2（容器内进程管理）
RUN npm install pm2 -g

# 先复制依赖文件，利用 Docker 缓存层
COPY package*.json ./
RUN npm install --production

# 复制项目代码
COPY . .

# 创建必要的目录并设置权限
RUN mkdir -p logs uploads src/public/uploads && chmod -R 755 logs uploads src/public/uploads

# 暴露前台和后台端口
EXPOSE 3000 3001

# 使用 pm2-runtime 保持前台运行（适合容器环境）
CMD ["pm2-runtime", "ecosystem.config.js"]
