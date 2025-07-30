# 跨平台安装指南

## 🎉 项目现已支持跨平台运行！

这个Next.js播客分析项目现在可以在Windows和macOS系统上无缝运行。

## ✅ 已完成的跨平台改进

### 1. **自动平台检测**
- 新增 `SystemDetector` 类，自动检测运行平台
- 根据操作系统自动选择正确的工具路径
- 智能回退机制，确保在任何环境下都能运行

### 2. **配置文件优化**
- `.env.local` 现在使用跨平台配置
- 支持环境变量覆盖，也支持自动检测
- 本地开发和生产部署都得到优化

### 3. **路径处理改进**
- 所有硬编码路径已移除
- 使用Node.js `path` 模块确保跨平台兼容
- 临时目录自动创建和管理

### 4. **工具路径自动检测**

#### Windows 系统默认路径：
- **Python**: `python` (从PATH)
- **FFmpeg**: `ffmpeg` (从PATH)
- **Chrome**: `C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe`
- **ChromeDriver**: `chromedriver.exe` (从PATH)
- **临时目录**: 系统临时目录 + `audio_processing`

#### macOS 系统默认路径：
- **Python**: `/usr/bin/python3`
- **FFmpeg**: `/opt/homebrew/bin/ffmpeg` (Homebrew)
- **Chrome**: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- **ChromeDriver**: `/opt/homebrew/bin/chromedriver`
- **临时目录**: `/tmp/audio_processing`

## 🚀 运行项目

无论在哪个系统上，都可以直接运行：

```bash
npm run dev
```

项目会自动检测平台并使用正确的配置。

## 🔧 可选工具安装

### Windows 系统

#### 使用包管理器 (推荐)

```powershell
# 安装 Chocolatey (如果还没有)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 安装工具
choco install python ffmpeg googlechrome chromedriver yt-dlp
```

#### 手动安装

1. **Python**: [python.org](https://www.python.org/downloads/windows/)
2. **FFmpeg**: [ffmpeg.org](https://ffmpeg.org/download.html#build-windows)
3. **Chrome**: [google.com/chrome](https://www.google.com/chrome/)
4. **yt-dlp**: `pip install yt-dlp`

### macOS 系统

#### 使用 Homebrew (推荐)

```bash
# 安装 Homebrew (如果还没有)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装工具
brew install python ffmpeg yt-dlp chromedriver
brew install --cask google-chrome
```

## 🔍 健康检查

访问 `/api/health` 端点查看系统状态：

```bash
curl http://localhost:3000/api/health
```

返回示例：
```json
{
  "status": "healthy",
  "platform": "windows",
  "services": {
    "nodejs": true,
    "python": "available",
    "ffmpeg": "available", 
    "chrome": "available"
  },
  "paths": {
    "python": "python",
    "ffmpeg": "ffmpeg",
    "chrome": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "tempDir": "C:\\Users\\Username\\AppData\\Local\\Temp\\audio_processing"
  }
}
```

## 🎛️ 自定义配置

如果需要使用特定路径，可以在 `.env.local` 中设置：

```bash
# 自定义工具路径 (可选)
PYTHON_PATH="/path/to/python"
FFMPEG_PATH="/path/to/ffmpeg"
CHROME_BIN="/path/to/chrome"
TEMP_DIR="/path/to/temp"
```

## 🐛 故障排除

### 常见问题

1. **权限错误**
   - Windows: 以管理员权限运行命令提示符
   - macOS: 使用 `sudo` 或检查文件权限

2. **工具未找到**
   - 确保工具已安装并在系统PATH中
   - 或在环境变量中指定完整路径

3. **Chrome/ChromeDriver 问题**
   - 确保Chrome和ChromeDriver版本兼容
   - Windows用户需要确保Chrome安装在默认位置

4. **临时目录问题**
   - 项目会自动创建临时目录
   - 如果失败，会回退到系统临时目录

### 调试模式

设置环境变量启用详细日志：

```bash
LOG_LEVEL=debug
NODE_ENV=development
```

## 🌟 功能支持

所有功能在两个平台上都完全支持：

- ✅ 音频/视频下载
- ✅ 网页抓取 (Selenium)
- ✅ 音频转录 (Azure Speech + Gemini)
- ✅ AI分析和总结
- ✅ 思维导图生成
- ✅ 多平台URL支持

## 📝 开发贡献

项目现在具有强大的跨平台基础，开发者可以在任何系统上贡献代码而无需担心平台兼容性问题。
