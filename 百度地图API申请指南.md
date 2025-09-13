# 百度地图API申请指南 - 详细步骤

## 🎯 第一步：注册百度账号
1. 打开浏览器，访问：https://lbsyun.baidu.com/
2. 点击右上角"注册"按钮
3. 使用手机号或邮箱注册百度账号
4. 完成手机验证

## 🎯 第二步：实名认证
1. 登录后，点击右上角头像 -> "账号中心"
2. 点击"实名认证"
3. 填写真实姓名和身份证号
4. 上传身份证正反面照片
5. 等待审核（通常几分钟到几小时）

## 🎯 第三步：创建应用
1. 回到首页：https://lbsyun.baidu.com/
2. 点击"控制台"或直接访问：https://lbsyun.baidu.com/apiconsole/key
3. 点击"创建应用"按钮
4. 填写应用信息：
   ```
   应用名称：学校听课管理系统
   应用类型：浏览器端
   应用描述：用于管理学校访问记录的地图应用
   ```

## 🎯 第四步：配置服务
勾选以下服务（重要！）：
- ✅ **地点检索服务** （必选）
- ✅ **地理编码服务** （推荐）
- ✅ **逆地理编码服务** （推荐）

## 🎯 第五步：设置白名单
1. 在"Referer白名单"中添加：
   ```
   http://localhost:*
   http://127.0.0.1:*
   ```
2. 如果要部署到服务器，还要添加你的域名

## 🎯 第六步：获取AK
1. 点击"提交"创建应用
2. 创建成功后，会显示你的AK（访问密钥）
3. **复制这个AK**，看起来像这样：
   ```
   abcdefghijklmnopqrstuvwxyz123456
   ```

## 🎯 第七步：替换代码中的API Key
找到项目中的 `app/page.tsx` 文件，搜索 `YOUR_BAIDU_API_KEY`，有两处需要替换：

### 位置1：
```javascript
// 找到这行：
const apiUrl = `https://api.map.baidu.com/place/v2/search?query=${encodeURIComponent(searchQuery)}&region=顺义区&output=json&ak=YOUR_BAIDU_API_KEY&callback=${callbackName}`

// 替换为：
const apiUrl = `https://api.map.baidu.com/place/v2/search?query=${encodeURIComponent(searchQuery)}&region=顺义区&output=json&ak=你的AK&callback=${callbackName}`
```

### 位置2：
```javascript
// 找到这行：
const apiUrl = `https://api.map.baidu.com/place/v2/search?query=${encodeURIComponent(testQuery)}&region=北京市&output=json&ak=YOUR_BAIDU_API_KEY&callback=${callbackName}`

// 替换为：
const apiUrl = `https://api.map.baidu.com/place/v2/search?query=${encodeURIComponent(testQuery)}&region=北京市&output=json&ak=你的AK&callback=${callbackName}`
```

## 🎯 第八步：测试
1. 保存文件并重启开发服务器
2. 打开应用，点击"添加学校"
3. 点击"测试地图API"按钮
4. 如果显示"测试成功"，说明配置正确

## 🎯 第九步：开始使用
现在可以在搜索框输入学校名称进行搜索了！

## ❓ 常见问题

### Q: 提示"INVALID_USER_SCODE"错误
A: API Key无效，检查是否正确复制粘贴

### Q: 提示"APP_NOT_EXIST"错误  
A: 应用不存在，检查API Key是否来自正确的应用

### Q: 提示"MCODE_NOT_EXIST"错误
A: Referer白名单设置问题，确保添加了localhost

### Q: 搜索无结果
A: 正常现象，可能该地区确实没有相关POI，尝试搜索更常见的地点

## 💡 免费配额
- 地点检索：每日10万次调用
- 个人使用完全够用
- 超出配额会暂停服务，次日自动恢复

## 📞 技术支持
如果遇到问题，可以：
1. 查看百度地图开放平台文档
2. 在控制台查看详细错误信息
3. 联系百度地图技术支持