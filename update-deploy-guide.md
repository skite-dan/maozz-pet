# 毛茸茸星球 - 标准化部署流程

## 部署方向

**本地 → 宿主机 → 容器（单向，绝不反向同步）**

- 本地代码是唯一真相来源（Single Source of Truth）
- 宿主机和容器仅作为部署目标
- 禁止从容器或宿主机反向同步代码到本地

---

## 部署原则

1. **所有修改先在本地完成**，修改完成后必须本地启动服务验证通过
2. **复制到容器之前，必须对容器内文件做备份**
3. **每次部署必须提供一键回滚脚本**，若部署失败可立即回滚恢复

---

## 部署步骤（严格按顺序执行）

### Step 1：本地修改 & 验证

- 在本地项目目录 `d:\workspace\trae\google_adv\maozz-pet` 中修改代码
- 修改完成后启动本地服务（前端 localhost:3000 / 后端 localhost:3001）
- 在浏览器中验证功能正常，确认无报错
- ✅ 本地验证通过后，方可进入下一步

### Step 2：上传至宿主机

- 通过宝塔面板，将修改的文件上传到 `/www/wwwroot/maozz-pet/` 对应目录
- 保持相对路径一致，例如：
  - `views/layout.ejs` → `/www/wwwroot/maozz-pet/views/layout.ejs`
  - `shared/utils/botFilter.js` → `/www/wwwroot/maozz-pet/shared/utils/botFilter.js`
  - `src/services/visitTracker.js` → `/www/wwwroot/maozz-pet/src/services/visitTracker.js`

### Step 3：备份容器原文件

在执行 docker cp 之前，先备份容器内即将被覆盖的文件。

```bash
# 设置时间戳（格式：YYYYMMDD_HHMMSS，支持一天内多次部署）
TS="20260725_183000"

# 创建备份目录
docker exec maozz-pet-app mkdir -p /app-backup/${TS}

# 备份文件（逐个文件执行，保持相对路径）
docker exec maozz-pet-app cp /app/views/layout.ejs /app-backup/${TS}/views/layout.ejs
docker exec maozz-pet-app mkdir -p /app-backup/${TS}/shared/utils
docker exec maooz-pet-app cp /app/shared/utils/botFilter.js /app-backup/${TS}/shared/utils/botFilter.js
# ... 其他文件同理
```

### Step 4：生成回滚脚本（在 docker cp 之前！）

将回滚脚本保存到宿主机 `/www/wwwroot/maozz-pet/rollback_<时间戳>.sh`：

```bash
#!/bin/bash
# rollback_20260725_183000.sh
# 自动生成的一键回滚脚本 - 部署失败时执行此脚本恢复
TS="20260725_183000"

echo "=== 开始回滚 ==="

# 恢复文件（逐个文件执行）
docker exec maozz-pet-app cp /app-backup/${TS}/views/layout.ejs /app/views/layout.ejs
docker exec maozz-pet-app cp /app-backup/${TS}/shared/utils/botFilter.js /app/shared/utils/botFilter.js
docker exec maozz-pet-app cp /app-backup/${TS}/src/services/visitTracker.js /app/src/services/visitTracker.js
# ... 其他文件同理

# 重启容器
docker restart maozz-pet-app

echo "=== 回滚完成，请检查服务状态 ==="
docker exec maozz-pet-app pm2 list
```

### Step 5：复制文件到容器 & 重启

```bash
# 复制文件到容器（保持相对路径）
docker cp /www/wwwroot/maozz-pet/views/layout.ejs maozz-pet-app:/app/views/layout.ejs
docker cp /www/wwwroot/maozz-pet/shared/utils/botFilter.js maozz-pet-app:/app/shared/utils/botFilter.js
docker cp /www/wwwroot/maozz-pet/src/services/visitTracker.js maozz-pet-app:/app/src/services/visitTracker.js
# ... 其他文件同理

# 重启容器
docker restart maozz-pet-app
```

### Step 6：验证部署

```bash
# 检查 PM2 进程状态
docker exec maozz-pet-app pm2 list

# 查看最近日志（确认无报错）
docker logs --tail 50 maozz-pet-app

# 浏览器访问生产环境页面，确认功能正常
```

---

## 回滚执行

若部署后发现问题，立即在宿主机上执行回滚脚本：

```bash
bash /www/wwwroot/maozz-pet/rollback_20260725_183000.sh
```

脚本会自动恢复备份文件并重启容器。

---

## 多文件部署模板

当一次部署涉及多个文件时，完整的操作命令模板如下：

```bash
# === 配置 ===
TS="20260725_183000"             # 时间戳
FILES=(
  "views/layout.ejs"
  "shared/utils/botFilter.js"
  "front/routes/posts.js"
  "src/services/visitTracker.js"
)

# === 备份 ===
docker exec maozz-pet-app mkdir -p /app-backup/${TS}
for f in "${FILES[@]}"; do
  docker exec maozz-pet-app mkdir -p /app-backup/${TS}/$(dirname $f)
  docker exec maooz-pet-app cp /app/$f /app-backup/${TS}/$f
done

# === 回滚脚本 ===
cat > /www/wwwroot/maozz-pet/rollback_${TS}.sh << 'ROLLBACK_EOF'
#!/bin/bash
TS="20260725_183000"
echo "=== 开始回滚 ==="
# 逐个恢复文件...
ROLLBACK_EOF

for f in "${FILES[@]}"; do
  echo "docker exec maozz-pet-app cp /app-backup/${TS}/$f /app/$f" >> /www/wwwroot/maozz-pet/rollback_${TS}.sh
done

echo "docker restart maozz-pet-app" >> /www/wwwroot/maozz-pet/rollback_${TS}.sh
echo 'echo "=== 回滚完成 ==="' >> /www/wwwroot/maozz-pet/rollback_${TS}.sh
echo "docker exec maozz-pet-app pm2 list" >> /www/wwwroot/maozz-pet/rollback_${TS}.sh

# === 部署 ===
for f in "${FILES[@]}"; do
  docker cp /www/wwwroot/maozz-pet/$f maozz-pet-app:/app/$f
done
docker restart maozz-pet-app

# === 验证 ===
sleep 5
docker exec maozz-pet-app pm2 list
docker logs --tail 50 maozz-pet-app
```

---

## 备份保留策略

- 容器内 `/app-backup/` 保留最近 **5 次**部署备份
- 宿主机 `/www/wwwroot/maozz-pet/rollback_*.sh` 保留最近 **3 次**回滚脚本
- 清理命令：

```bash
# 清理容器旧备份（保留最近5个）
docker exec maozz-pet-app bash -c "ls -d /app-backup/*/ | sort | head -n -5 | xargs rm -rf"

# 清理宿主机旧回滚脚本（保留最近3个）
ls -t /www/wwwroot/maozz-pet/rollback_*.sh | tail -n +4 | xargs rm -f
```

---

## 注意事项

- 仅当 `package.json` 依赖或 `Dockerfile` 发生变更时，才使用 `docker-compose build` 重新构建镜像
- EJS/JS 模板改动一律使用 `docker cp + restart` 工作流
- `.env`、`src/public/uploads`、`logs` 目录通过 volume 挂载持久化，不在容器内直接修改
- 大文件（如 60KB 以上的 views/admin/posts.ejs）上传后务必验证文件完整性，避免传输不完整导致代码异常
- 每次部署完成后，确认本地、宿主机、容器三者的代码保持一致
