# 🔍 部署失败排查指南

## 📊 当前状态

- ✅ **Test and Lint** 工作流：成功
- ❌ **Deploy to AWS EC2** 工作流：失败

## 🔍 需要检查的错误

部署工作流失败，需要查看具体的错误信息。

### 步骤 1: 查看失败日志

1. 打开 GitHub Actions: https://github.com/zhihungchen/FittedIn/actions
2. 点击失败的 "Deploy to AWS EC2" 工作流（最新的那个）
3. 点击 "Deploy to EC2" job
4. 查看哪个步骤失败了
5. 展开失败的步骤，查看详细错误信息

### 常见失败原因

#### 1. SSH 连接失败
**错误信息**: "Permission denied (publickey)" 或 "Connection refused"

**可能原因**:
- `EC2_SSH_PRIVATE_KEY` 不正确或不完整
- `EC2_HOST` 不正确
- `EC2_USER` 不正确
- EC2 安全组没有允许 SSH

**解决方法**:
1. 检查 GitHub Secrets 是否正确
2. 测试 SSH 连接：
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

#### 2. Git 操作失败
**错误信息**: "fatal: not a git repository" 或 "Permission denied"

**可能原因**:
- EC2 上的项目目录不存在
- Git 没有初始化
- 目录权限问题

**解决方法**:
```bash
# SSH 到 EC2 检查
ssh -i key.pem ubuntu@ec2-ip
cd /var/www/fittedin
ls -la
git status
```

#### 3. PM2 命令失败
**错误信息**: "pm2: command not found"

**可能原因**:
- PM2 没有安装
- PM2 不在 PATH 中

**解决方法**:
```bash
# 在 EC2 上安装 PM2
npm install -g pm2
```

#### 4. Nginx 配置错误
**错误信息**: "nginx: configuration file test failed"

**可能原因**:
- Nginx 配置文件有错误
- 需要 sudo 权限

**解决方法**:
```bash
# 在 EC2 上检查
sudo nginx -t
```

#### 5. 健康检查失败
**错误信息**: "Health check failed"

**可能原因**:
- 应用没有启动
- 端口不正确
- URL 不正确

**解决方法**:
- 健康检查现在是可选的，不会阻止部署
- 手动检查应用状态

---

## 🛠️ 快速修复步骤

### 1. 查看具体错误

请告诉我：
- 哪个步骤失败了？
- 错误信息是什么？

### 2. 验证 EC2 配置

```bash
# SSH 到 EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# 检查项目目录
ls -la /var/www/fittedin

# 检查 Git
cd /var/www/fittedin
git remote -v

# 检查 PM2
pm2 --version

# 检查 Nginx
nginx -v
```

### 3. 手动测试部署步骤

```bash
# 在 EC2 上手动执行部署步骤
cd /var/www/fittedin
git fetch origin
git reset --hard origin/main
cd backend
npm install --production
npm run db:migrate
pm2 restart fittedin-backend
sudo nginx -t && sudo systemctl reload nginx
```

---

## 📝 需要的信息

为了帮助排查，请提供：

1. **失败的步骤名称**（例如："Deploy to EC2"）
2. **错误消息**（完整的错误文本）
3. **EC2 状态**（是否可以 SSH 连接）

---

**下一步**: 请打开失败的部署工作流，查看具体错误信息，然后告诉我。

