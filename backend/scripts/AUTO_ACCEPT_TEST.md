# 测试自动接受连接功能

## 快速测试步骤

### 1. 确保已运行 Seeding 脚本

```bash
cd backend
npm run db:seed:faker
```

这会创建假用户，他们的邮箱格式是 `xxx@fittedin-seeded.com`

### 2. 运行测试脚本

```bash
npm run test:auto-accept
```

这会：
- 检查是否有假用户
- 测试假用户识别功能
- 测试自动接受功能
- 处理所有待处理的连接请求

### 3. 手动测试（通过 API）

#### 步骤 1: 登录获取 Token

```bash
# 使用任何假用户登录（密码都是 Password123!）
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@fittedin-seeded.com",
    "password": "Password123!"
  }'
```

保存返回的 `token`

#### 步骤 2: 查找一个假用户的 ID

```bash
# 在数据库中查找假用户
docker-compose exec postgres psql -U postgres -d fittedin_dev -c \
  "SELECT id, email, display_name FROM users WHERE email LIKE '%@fittedin-seeded.com' LIMIT 5;"
```

#### 步骤 3: 发送连接请求给假用户

```bash
# 替换 YOUR_TOKEN 和 RECEIVER_ID
curl -X POST http://localhost:3000/api/connections \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"receiver_id": RECEIVER_ID}'
```

**预期结果**: 连接应该立即被接受（status: "accepted"）

#### 步骤 4: 检查连接状态

```bash
curl http://localhost:3000/api/connections/status/RECEIVER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

应该返回 `"status": "accepted"`

### 4. 批量处理待处理的请求

```bash
curl -X POST http://localhost:3000/api/connections/auto-accept-pending \
  -H "Authorization: Bearer YOUR_TOKEN"
```

这会自动接受所有发送给假用户的待处理请求。

## 故障排除

### 问题: 连接没有被自动接受

**可能原因**:
1. 用户不是假用户（邮箱不是 `@fittedin-seeded.com`）
2. 连接已经存在且状态不是 "pending"
3. 服务器没有重启（如果刚刚添加了代码）

**解决方法**:
1. 检查用户邮箱: `SELECT email FROM users WHERE id = USER_ID;`
2. 检查连接状态: `SELECT * FROM connections WHERE id = CONNECTION_ID;`
3. 重启服务器: `npm run dev` 或 `node server.js`

### 问题: 找不到假用户

**解决方法**:
运行 seeding 脚本:
```bash
npm run db:seed:faker
```

### 问题: 测试脚本报错

**检查**:
1. 数据库是否运行: `docker-compose ps`
2. 数据库连接配置是否正确
3. 模型是否正确加载

## 验证功能是否工作

1. **检查日志**: 当发送连接请求时，应该看到日志:
   ```
   Connection auto-accepted for seeded user
   ```

2. **检查数据库**:
   ```sql
   SELECT * FROM connections WHERE receiver_id IN (
     SELECT id FROM users WHERE email LIKE '%@fittedin-seeded.com'
   ) AND status = 'accepted';
   ```

3. **检查 API 响应**: 发送连接请求后，响应中的 `status` 应该是 `"accepted"`

## 预期行为

✅ **应该自动接受**:
- 发送给假用户（`@fittedin-seeded.com`）的连接请求
- 发送给其他匹配模式的假用户的请求

❌ **不会自动接受**:
- 发送给真实用户的连接请求
- 已经存在的连接
- 状态不是 "pending" 的连接

