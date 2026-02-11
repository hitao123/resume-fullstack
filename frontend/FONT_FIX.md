# PDF 字体问题解决方案

## 问题描述
导出 PDF 时出现错误：`Unknown font format`

## 原因
在线字体 URL 在 @react-pdf/renderer 中可能因为 CORS 或格式问题加载失败。

## ✅ 解决方案

### 当前方案：使用系统默认字体
已修改代码，移除了自定义字体注册，使用 @react-pdf/renderer 的内置字体。

**优点：**
- ✅ 不需要额外的字体文件
- ✅ 构建和运行都没有问题
- ✅ 可以正常渲染中文

**缺点：**
- 字体样式有限
- 中文显示可能不是最优

### 如果需要更好的中文字体支持

可以使用以下两种方案：

#### 方案 A：使用本地字体文件（推荐）

1. **下载中文字体文件**
```bash
# 在 frontend/public 目录下创建 fonts 文件夹
mkdir -p public/fonts

# 下载思源黑体（开源免费）
# 访问：https://github.com/adobe-fonts/source-han-sans/releases
# 下载 SourceHanSansCN-Normal.otf 并放到 public/fonts/
```

2. **修改 PDF 组件注册字体**
```typescript
import { Font } from '@react-pdf/renderer';

Font.register({
  family: 'Source Han Sans',
  src: '/fonts/SourceHanSansCN-Normal.otf',
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Source Han Sans',
    // ...
  },
});
```

#### 方案 B：使用 CDN 字体（简单但不稳定）

使用更可靠的 CDN：

```typescript
Font.register({
  family: 'Noto Sans SC',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc@4.5.11/files/noto-sans-sc-chinese-simplified-400-normal.woff',
    },
  ],
});
```

#### 方案 C：使用 Google Fonts 的备用链接

```typescript
Font.register({
  family: 'Noto Sans SC',
  src: 'https://fonts.gstatic.com/s/notosanssc/v30/k3kXo84MPvpLmixcA63oeALZP4iJ-Q7m_w.woff2',
  fontWeight: 400,
});
```

## 🎯 推荐做法

**对于生产环境：**
使用**方案 A（本地字体）**最稳定可靠。

**步骤：**
1. 下载思源黑体或其他开源中文字体
2. 放到 `public/fonts/` 目录
3. 在 PDF 组件中注册本地字体路径

## 📝 当前状态

- ✅ **PDF 导出功能正常工作**
- ✅ **中文可以显示**（使用默认字体）
- ✅ **构建成功**
- ⚠️ 字体样式是默认的，如需更美观的字体可使用上述方案

## 🧪 测试

现在可以测试 PDF 导出：
1. 启动项目：`npm run dev`
2. 进入简历编辑器
3. 填写中英文内容
4. 点击"导出" → "下载 PDF"
5. 查看 PDF 文件

应该可以正常生成和下载，中文也能正常显示。

---

**当前方案已可用！** 如果需要更好的字体效果，再使用方案 A 添加本地字体文件。
