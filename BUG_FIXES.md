# Bug修复报告 - API返回HTML而非JSON

## 🔴 发现的关键Bug

### Bug: API请求返回HTML而不是JSON

**错误信息:**
```
API Error: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
Failed to load posts feed: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

**根本原因:**
在 `backend/server.js` 中，路由顺序错误：
1. Catch-all路由 (`app.get('*')`) 在404 API handler之前
2. 这导致所有未匹配的API请求（如 `/api/posts/feed`）被catch-all捕获
3. Catch-all返回了 `index.html` (HTML) 而不是JSON响应

**修复:**
- ✅ 调整了路由顺序：
  - API 404 handler现在在catch-all之前
  - Error handler在catch-all之前
  - Catch-all必须是最后一个

**修改的文件:**
- `backend/server.js` - 修复路由顺序

**修复前:**
```javascript
// API Routes
app.use('/api/posts', postRoutes);

// Catch-all handler (❌ 错误位置)
app.get('*', (req, res) => {
    res.sendFile('index.html', { root: '../frontend/public' });
});

// 404 handler for API (❌ 永远不会到达)
app.use('/api/*', (req, res) => {
    res.status(404).json({ ... });
});
```

**修复后:**
```javascript
// API Routes
app.use('/api/posts', postRoutes);

// 404 handler for API (✅ 正确位置)
app.use('/api/*', (req, res) => {
    res.status(404).json({ ... });
});

// Error handler
app.use(errorHandler);

// Catch-all handler (✅ 最后)
app.get('*', (req, res) => {
    res.sendFile('index.html', { root: '../frontend/public' });
});
```

### 其他修复

**1. 前端API调用一致性**
- ✅ 在 `frontend/public/js/posts.js` 中使用 `api.activities.getFeed()` 代替直接调用
- ✅ 在 `frontend/public/js/api.js` 中添加了 `activities.getFeed()` 方法

**2. 路由顺序修复**
- ✅ API 404 handler现在能正确捕获未匹配的API路由
- ✅ 所有API请求都会先经过API路由和404 handler
- ✅ 只有非API的前端路由才会被catch-all捕获

## 🧪 测试建议

1. **重启服务器**（如果正在运行）
   ```bash
   cd backend
   node server.js
   ```

2. **运行数据库迁移**（如果还没运行）
   ```bash
   npm run db:migrate
   ```

3. **测试API端点:**
   - 访问 `http://localhost:3000/api/posts/feed` 应该返回JSON
   - 访问 `http://localhost:3000/api/activities/feed` 应该返回JSON
   - 访问 `http://localhost:3000/api/health` 应该返回JSON

4. **测试前端:**
   - 刷新 `dashboard.html`
   - 检查控制台，应该不再有HTML解析错误
   - Posts feed应该能正常加载

## ✅ 验证清单

- [ ] 服务器重启后能正常运行
- [ ] API端点 `/api/posts/feed` 返回JSON
- [ ] API端点 `/api/activities/feed` 返回JSON
- [ ] 前端dashboard能正常加载posts feed
- [ ] 前端dashboard能正常加载activities
- [ ] 控制台没有HTML解析错误
- [ ] 所有API请求返回正确的JSON响应

## 📝 注意事项

1. **数据库迁移:** 确保运行了所有迁移，特别是：
   - `20251117155452-create-activities.js`
   - `20251117155614-create-posts.js`
   - `20251118014241-create-notifications.js`

2. **服务器重启:** 修复路由顺序后需要重启服务器

3. **认证:** 确保有有效的JWT token，因为posts和activities路由需要认证

