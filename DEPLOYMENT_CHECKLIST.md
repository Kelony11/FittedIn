# 🚀 部署检查清单

## ✅ 部署前检查

### 1. 测试工作流状态
- ✅ **Test and Lint** 工作流已成功运行
- ✅ Backend Tests 通过
- ✅ Code Linting 通过

### 2. GitHub Secrets 配置
请确认以下 Secrets 已正确配置：
- ✅ `EC2_SSH_PRIVATE_KEY` - SSH 私钥
- ✅ `EC2_HOST` - EC2 IP 或域名
- ✅ `EC2_USER` - SSH 用户名（通常是 `ubuntu`）

### 3. 代码状态
- ✅ 最新代码已推送到 `main` 分支
- ✅ CI/CD 配置已更新
- ✅ 修复已应用

---

## 🎯 部署方式

### 方式 1: 自动部署（推荐）

**触发条件**：推送到 `main` 分支会自动触发部署

**当前状态**：
- ✅ 代码已推送到 `main` 分支
- ⏳ 部署工作流应该会自动触发

**检查步骤**：
1. 打开 GitHub Actions: https://github.com/zhihungchen/FittedIn/actions
2. 查找 "Deploy to AWS EC2" 工作流
3. 查看是否正在运行或已完成

### 方式 2: 手动触发部署

如果自动部署没有触发，可以手动触发：

1. 打开 GitHub 仓库
2. 点击 **Actions** 标签
3. 选择 **Deploy to AWS EC2** 工作流
4. 点击 **Run workflow**
5. 选择 `main` 分支
6. 点击 **Run workflow**

---

## 📊 部署工作流步骤

部署时会执行以下步骤：

1. ✅ **Run Tests** - 运行测试（在 deploy 工作流中）
2. ⏳ **Configure AWS credentials** - 可选，跳过（如果未配置）
3. ⏳ **Add SSH key** - 配置 SSH 密钥
4. ⏳ **Add EC2 to known hosts** - 添加 EC2 到已知主机
5. ⏳ **Deploy to EC2** - 部署到服务器
   - Git pull 最新代码
   - npm install 依赖
   - 运行数据库迁移
   - PM2 重启应用
   - Nginx 重新加载
6. ⏳ **Health Check** - 健康检查（非阻塞）
7. ⏳ **Notify deployment status** - 通知部署状态

---

## 🔍 如何验证部署成功

### 1. 检查 GitHub Actions

- ✅ 部署工作流显示绿色（成功）
- ✅ 所有步骤都完成
- ✅ 没有错误消息

### 2. 检查 EC2 服务器

```bash
# SSH 到 EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# 检查 PM2 状态
pm2 status

# 查看应用日志
pm2 logs fittedin-backend

# 检查健康端点
curl http://localhost:3000/api/health
```

### 3. 检查应用

- 访问你的应用 URL
- 测试主要功能
- 检查 API 端点

---

## ⚠️ 常见问题

### 问题 1: 部署工作流没有自动触发

**原因**：
- 工作流文件可能有问题
- 触发条件不满足

**解决**：
- 使用手动触发（方式 2）
- 检查工作流文件语法

### 问题 2: SSH 连接失败

**错误**: "Permission denied (publickey)"

**解决**：
1. 检查 `EC2_SSH_PRIVATE_KEY` 是否完整
2. 测试 SSH 连接：`ssh -i key.pem ubuntu@ec2-ip`
3. 检查 `EC2_USER` 是否正确

### 问题 3: PM2 重启失败

**错误**: "pm2: command not found"

**解决**：
```bash
# 在 EC2 上安装 PM2
npm install -g pm2
```

### 问题 4: Git pull 失败

**错误**: "fatal: not a git repository"

**解决**：
```bash
# 在 EC2 上检查
cd /var/www/fittedin
git remote -v
git status
```

---

## ✅ 部署成功标准

- [ ] GitHub Actions 显示部署成功
- [ ] 没有错误或警告
- [ ] PM2 显示应用正在运行
- [ ] 健康检查端点返回 200
- [ ] 应用可以正常访问

---

## 🎉 部署完成后

1. ✅ 验证应用功能
2. ✅ 检查日志是否有错误
3. ✅ 测试主要功能
4. ✅ 监控应用性能

---

**准备好了吗？**

✅ 如果所有检查都通过，可以开始部署！
🚀 建议先检查 GitHub Actions 看是否已自动触发

