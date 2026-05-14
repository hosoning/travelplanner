# Travoo — 部署指南

## 第一步：创建 Firebase 项目

1. 前往 https://console.firebase.google.com
2. 点击「添加项目」，输入项目名称（如 journey-trip）
3. 可以关闭 Google Analytics（非必须）
4. 项目创建完成后，点击「</> Web」图标添加 Web 应用
5. 应用昵称随意填，复制生成的 firebaseConfig 配置信息

## 第二步：启用 Firestore

1. 左侧菜单 → Build → Firestore Database
2. 点击「创建数据库」
3. 选择「以测试模式启动」（之后会修改规则）
4. 选择最近的服务器位置（建议 asia-east1）
5. 创建完成后，点击左侧「规则」标签
6. 将 firebase.rules 文件内容粘贴进去，发布

## 第三步：启用 Storage（用于收据照片）

1. 左侧菜单 → Build → Storage
2. 点击「开始使用」，以测试模式
3. 规则里允许读写（和 Firestore 类似）

## 第四步：填写 Firebase 配置

打开 app.js，找到文件顶部的 FIREBASE_CONFIG，
替换为你在第一步复制的真实配置：

```javascript
const FIREBASE_CONFIG = {
  apiKey:            "AIza...",
  authDomain:        "your-project.firebaseapp.com",
  projectId:         "your-project-id",
  storageBucket:     "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abcdef"
};
