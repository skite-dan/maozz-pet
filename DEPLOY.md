# 毛茸茸星球 - 宝塔面板部署指南

## 一、环境要求

| 组件 | 版本要求 | 说明 |
|------|----------|------|
| 服务器 | Linux (CentOS 7+/Ubuntu 18.04+) | 推荐 2核4G 起步 |
| Node.js | 18.x 或 20.x LTS | 宝塔面板 Node 版本管理器安装 |
| MySQL | 8.0+ | 宝塔面板软件商店安装 |
| Redis | 6.x+ | 宝塔面板软件商店安装 |
| PM2 | 最新版 | 全局安装，进程管理 |

---

## 二、宝塔面板安装

### 1. 安装宝塔面板（如尚未安装）

```bash
# CentOS
yum install -y wget && wget -O install.sh https://download.bt.cn/install/install_lts.sh && sh install.sh ed8484bec

# Ubuntu/Debian
wget -O install.sh https://download.bt.cn/install/install_lts.sh && sudo bash install.sh ed8484bec
```

安装完成后，记录面板地址、用户名和密码。

### 2. 登录宝塔面板安装必备软件

在宝塔面板 **软件商店** 中安装：
- **Nginx**（可选，如后续需要域名访问）
- **MySQL** 8.0
- **Redis**
- **Node.js版本管理器**

---

## 三、数据库配置

### 1. 创建数据库

在宝塔面板 -> **数据库** -> **添加数据库**：
- 数据库名：`maozz_pet`
- 用户名：`maozz_pet`
- 密码：设置一个强密码并记住
- 访问权限：**本地服务器**

### 2. 导入初始化数据

```bash
# 进入项目目录后执行
mysql -u maozz_pet -p maozz_pet < sql/init.sql
```

或者在宝塔面板数据库管理中使用 **phpMyAdmin** 导入 `sql/init.sql`。

---

## 四、项目部署

### 1. 上传代码到服务器

**方法一：Git 克隆（推荐）**

```bash
cd /www/wwwroot
git clone https://github.com/yourusername/maozz-pet.git
cd maozz-pet
```

**方法二：宝塔面板文件管理器上传**

- 在宝塔面板 -> **文件** -> 进入 `/www/wwwroot`
- 上传本地项目压缩包并解压

### 2. 安装 Node.js 依赖

```bash
cd /www/wwwroot/maozz-pet

# 使用宝塔安装的 Node.js 版本
# 先通过宝塔 Node 版本管理器安装 Node.js 18 或 20
# 然后在终端中执行：

npm install --production

# 全局安装 PM2
npm install -g pm2
```

### 3. 配置环境变量

```bash
cp .env.production .env
```

编辑 `.env` 文件，修改以下关键配置：

```env
# MySQL配置（使用你刚才创建的数据库信息）
DB_USER=maozz_pet
DB_PASSWORD=你的数据库密码
DB_NAME=maozz_pet

# Redis配置（宝塔默认无需密码）
REDIS_HOST=localhost
REDIS_PORT=6379

# 管理员账号（部署后立即修改）
ADMIN_USERNAME=admin
ADMIN_PASSWORD=你的强密码

# 网站地址（替换为服务器IP）
SITE_URL=http://你的服务器IP:3000
```

### 4. 创建日志目录

```bash
mkdir -p /www/wwwroot/maozz-pet/logs
mkdir -p /www/wwwroot/maozz-pet/uploads
```

---

## 五、启动服务

### 使用 PM2 启动

```bash
cd /www/wwwroot/maozz-pet

# 启动前台和后台服务
pm2 start ecosystem.config.js

# 查看运行状态
pm2 status

# 查看日志
pm2 logs

# 设置开机自启
pm2 startup
pm2 save
```

### 常用 PM2 命令

```bash
pm2 restart maozz-front    # 重启前台
pm2 restart maozz-admin    # 重启后台
pm2 stop maozz-front       # 停止前台
pm2 stop maozz-admin       # 停止后台
pm2 delete maozz-front     # 删除前台进程
pm2 delete maozz-admin     # 删除后台进程
pm2 logs maozz-front       # 查看前台日志
pm2 logs maozz-admin       # 查看后台日志
```

---

## 六、防火墙配置

### 1. 宝塔面板安全组

在宝塔面板 -> **安全** -> 放行以下端口：

| 端口 | 用途 | 说明 |
|------|------|------|
| 3000 | 前台服务 | 必须放行 |
| 3001 | 后台管理 | 必须放行 |
| 3306 | MySQL | 仅限本地，勿对外暴露 |
| 6379 | Redis | 仅限本地，勿对外暴露 |
| 8888 | 宝塔面板 | 默认，建议修改 |
| 22 | SSH | 必须 |

### 2. 云服务器安全组（如阿里云/腾讯云）

在云平台控制台 -> 安全组规则中，添加入站规则：
- 端口：`3000-3001`
- 来源：`0.0.0.0/0`（或指定IP）
- 协议：TCP

---

## 七、访问地址

部署完成后，通过以下地址访问：

| 服务 | 访问地址 | 说明 |
|------|----------|------|
| 前台页面 | `http://服务器IP:3000` | 用户端 |
| 管理后台 | `http://服务器IP:3001/admin/login` | 管理员端 |

默认管理员账号：
- 用户名：`admin`
- 密码：`.env` 中配置的 `ADMIN_PASSWORD`

---

## 八、常见问题

### Q1: 服务启动失败，提示数据库连接错误
检查 `.env` 中的 `DB_HOST`、`DB_USER`、`DB_PASSWORD` 是否正确，确认 MySQL 服务已启动。

### Q2: 页面能打开但无数据
确认 `sql/init.sql` 已正确导入数据库。

### Q3: 上传图片失败
确认 `uploads` 目录存在且有写入权限：
```bash
chmod -R 755 /www/wwwroot/maozz-pet/uploads
```

### Q4: 端口无法访问
检查宝塔面板安全设置和云服务器安全组，确保 3000/3001 端口已放行。

### Q5: 如何绑定域名（可选）
如需域名访问，在宝塔面板 -> **网站** -> 添加站点：
- 前台：配置反向代理到 `http://127.0.0.1:3000`
- 后台：配置反向代理到 `http://127.0.0.1:3001`

---

## 九、快速部署脚本（可选）

在项目根目录创建 `deploy.sh`：

```bash
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
```

赋予执行权限并运行：
```bash
chmod +x deploy.sh
./deploy.sh
```
