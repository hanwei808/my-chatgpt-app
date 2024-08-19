# ChatGPT Interface

这是一个使用 React 和 Material-UI 构建的 ChatGPT 聊天界面应用。用户可以通过输入 OpenAI 的 API Key 来与 ChatGPT 进行对话。

## 功能

- 用户可以输入消息并发送给 ChatGPT
- ChatGPT 会根据用户输入返回响应
- 支持流式加载 ChatGPT 的响应
- 在加载过程中显示自定义的加载图标
- 使用 Material-UI 进行界面设计

## 安装

1. 克隆仓库

   ```bash
   git clone https://github.com/yourusername/chatgpt-interface.git
   cd chatgpt-interface
   ```

2. 安装依赖

   ```bash
   npm install
   ```

## 运行

在开发模式下运行应用

```bash
npm run dev
```

应用将在浏览器中自动打开，通常是 `http://localhost:5173`。

## 使用

1. 启动应用后，会弹出一个对话框要求输入 OpenAI 的 API Key。
2. 输入 API Key 后，点击 "确定" 按钮。
3. 在输入框中输入消息，并点击发送按钮或按下回车键。
4. ChatGPT 的响应将显示在消息列表中。

## 项目结构

```plaintext
chatgpt-interface/
├── public/                  # 公共文件夹
│   ├── index.html           # HTML 模板
│   └── favicon.ico          # 网站图标
├── src/                     # 源代码文件夹
│   ├── components/          # 组件文件夹
│   │   └── ChatInterface.tsx # 聊天界面组件
│   ├── assets/              # 静态资源文件夹
│   │   └── three-dots.svg   # 加载图标
│   ├── App.tsx              # 主要应用组件
│   ├── index.tsx            # 入口文件
│   └── ...                  # 其他文件
├── package.json             # 项目配置文件
└── README.md                # 项目文档
```

## 依赖

- React
- Material-UI
- TypeScript
