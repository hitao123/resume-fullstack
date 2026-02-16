# PDF 导出方案指南

处理前端预览中 SVG 图案和背景颜色在 PDF 中丢失的完整解决方案。

## 问题诊断

**问题症状：**
- 灰色标签（带背景颜色）在 PDF 导出中变为透明
- SVG 图案无法正确显示
- 图片、图标等元素缺失

**根本原因：**
`@react-pdf/renderer` 的限制：
1. 对 CSS 样式支持不完整（如 `backgroundColor` 可能不兼容）
2. 不支持 SVG 元素直接嵌入
3. 不支持复杂样式和动画

---

## 解决方案对比

### 方案 1：Canvas 图片方式（当前使用 @react-pdf/renderer）

**优点：**
- ✅ 文件体积小
- ✅ 生成速度快
- ✅ 兼容性好

**缺点：**
- ❌ 需要手动处理各种样式
- ❌ 对复杂设计支持差
- ❌ SVG 需要额外转换

**实现：** 已在 `pdfHelpers.ts` 中创建

---

### 方案 2：HTML2Canvas + jsPDF（推荐 ⭐）

**优点：**
- ✅ 完全保留所有样式、SVG、背景颜色
- ✅ 支持复杂设计
- ✅ 实现最简单（一行代码搞定）
- ✅ 所见即所得

**缺点：**
- ⚠️ 文件体积稍大（通常 200-500KB）
- ⚠️ 生成速度较慢（通常 2-5 秒）

**推荐使用场景：** 大多数情况下使用此方案

**实现：** 已在 `htmlToPdfExport.ts` 中创建

---

## 安装步骤

### 1. 安装必要依赖

```bash
cd frontend
npm install html2canvas jspdf
```

### 2. 更新 package.json

```json
{
  "dependencies": {
    "html2canvas": "^1.4.1",
    "jspdf": "^2.5.1"
  }
}
```

---

## 使用方式

### 方案 1：使用 Canvas 图片方式（当前方案升级）

**代码示例：**

```tsx
import { EnhancedPDFDocument } from '@/components/pdf/EnhancedPDFDocument';
import { PDFViewer } from '@react-pdf/renderer';

export const ResumePreview = () => {
  const resume = useResume();

  return (
    <PDFViewer>
      <EnhancedPDFDocument resume={resume} />
    </PDFViewer>
  );
};
```

**优化点：**
- ✅ 预渲染技能标签为图片
- ✅ 保留背景颜色和样式
- ✅ 支持自定义颜色

---

### 方案 2：HTML 元素直接导出（推荐使用）

**A. 导出 PDF（下载）**

```tsx
import { exportElementToPDF } from '@/utils/htmlToPdfExport';

const handleExportPDF = async () => {
  const element = document.getElementById('resume-content');
  if (element) {
    await exportElementToPDF(element, {
      filename: 'my-resume.pdf',
      scale: 2,
      quality: 'high',
    });
  }
};

return <button onClick={handleExportPDF}>导出 PDF</button>;
```

**B. 预览 PDF（新标签页）**

```tsx
import { previewElementAsPDF } from '@/utils/htmlToPdfExport';

const handlePreviewPDF = async () => {
  const element = document.getElementById('resume-content');
  if (element) {
    await previewElementAsPDF(element, {
      scale: 2,
      quality: 'high',
    });
  }
};

return <button onClick={handlePreviewPDF}>预览 PDF</button>;
```

**C. 上传 PDF 到服务器**

```tsx
import { getElementPDFBlob } from '@/utils/htmlToPdfExport';

const handleUploadPDF = async () => {
  const element = document.getElementById('resume-content');
  if (element) {
    const blob = await getElementPDFBlob(element);
    const formData = new FormData();
    formData.append('file', blob, 'resume.pdf');
    
    await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
  }
};
```

---

## 集成到现有代码

### 更新 usePDFExport Hook

```tsx
// src/hooks/usePDFExport.tsx

import { exportElementToPDF, previewElementAsPDF } from '@/utils/htmlToPdfExport';
import { useState } from 'react';

export const usePDFExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportPDF = async (elementId: string, filename?: string) => {
    try {
      setIsExporting(true);
      const element = document.getElementById(elementId);
      if (!element) throw new Error('找不到导出元素');

      await exportElementToPDF(element, {
        filename: filename || 'resume.pdf',
        scale: 2,
        quality: 'high',
      });
    } catch (error) {
      console.error('PDF 导出失败:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  const previewPDF = async (elementId: string) => {
    try {
      setIsExporting(true);
      const element = document.getElementById(elementId);
      if (!element) throw new Error('找不到预览元素');

      await previewElementAsPDF(element, {
        scale: 2,
        quality: 'high',
      });
    } catch (error) {
      console.error('PDF 预览失败:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportPDF,
    previewPDF,
    isExporting,
  };
};
```

### 在 ResumePreview 中使用

```tsx
// src/components/resume/ResumePreview.tsx

import { usePDFExport } from '@/hooks/usePDFExport';
import { Button, Space } from 'antd';
import { DownloadOutlined, EyeOutlined } from '@ant-design/icons';

export const ResumePreview = () => {
  const { exportPDF, previewPDF, isExporting } = usePDFExport();

  return (
    <>
      <Space>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={() => exportPDF('resume-content')}
          loading={isExporting}
        >
          下载 PDF
        </Button>

        <Button
          icon={<EyeOutlined />}
          onClick={() => previewPDF('resume-content')}
          loading={isExporting}
        >
          预览 PDF
        </Button>
      </Space>

      {/* 这个 div 用于 PDF 渲染，需要包含所有简历内容 */}
      <div id="resume-content">
        {/* 简历内容在这里 */}
      </div>
    </>
  );
};
```

---

## 配置选项

### exportElementToPDF Options

```tsx
interface ExportOptions {
  // PDF 文件名
  filename?: string;  // 默认: 'resume.pdf'

  // 导出质量（影响文件大小和速度）
  scale?: number;     // 默认: 2 (高质量)

  // 图片质量
  quality?: 'high' | 'medium' | 'low';  // 默认: 'high'
}
```

**质量选择建议：**
- `high` + `scale: 2`: 最佳质量，文件最大
- `high` + `scale: 1.5`: 平衡质量和大小
- `medium` + `scale: 1`: 文件较小，速度快

---

## SVG 特殊处理

### 问题：SVG 在 HTML2Canvas 中可能渲染失败

**解决方案 1：使用 inline SVG**

```tsx
// ✅ 正确
<svg>
  <circle cx="50" cy="50" r="40" />
</svg>

// ❌ 避免使用 <img> 标签引入 SVG
<img src="icon.svg" />
```

### 解决方案 2：SVG 转图片（如需使用 img 标签）

```tsx
import { svgToImage } from '@/utils/pdfHelpers';

const SvgIcon = ({ svgString }) => {
  const [imageData, setImageData] = useState<string>('');

  useEffect(() => {
    svgToImage(svgString).then(setImageData);
  }, [svgString]);

  return <img src={imageData} alt="icon" />;
};
```

---

## 常见问题

### Q1: PDF 导出速度太慢怎么办？

**A:** 降低导出质量

```tsx
await exportElementToPDF(element, {
  scale: 1.5,      // 改为 1.5 而不是 2
  quality: 'medium' // 改为 medium
});
```

### Q2: PDF 文件太大怎么办？

**A:** 压缩图片质量和降低 scale

```tsx
await exportElementToPDF(element, {
  scale: 1,
  quality: 'low'
});
```

### Q3: 某些样式在 PDF 中还是显示不对？

**A:** 确保样式内联或在可导出的范围内

```tsx
// ✅ 推荐
<div style={{ backgroundColor: '#f0f0f0', padding: '10px' }}>
  内容
</div>

// ⚠️ 避免
<div className="external-class">内容</div>
```

### Q4: 如何只导出简历的某个部分？

**A:** 指定特定的元素 ID

```tsx
const handleExportEducation = async () => {
  const element = document.getElementById('education-section');
  await exportElementToPDF(element, {
    filename: 'education.pdf'
  });
};
```

---

## 性能优化建议

### 1. 图片压缩
```tsx
// 在简历中使用压缩的图片
<img src="compressed.webp" />  // 比 PNG 小 30%
```

### 2. 异步处理
```tsx
// 显示加载指示器
const [loading, setLoading] = useState(false);

const handleExport = async () => {
  setLoading(true);
  try {
    await exportElementToPDF(element);
  } finally {
    setLoading(false);
  }
};
```

### 3. 样式优化
```tsx
// 避免过多阴影和渐变
<div style={{ 
  boxShadow: 'none',  // 改为无阴影或简单边框
  background: 'solid'  // 改为纯色背景
}}>
```

---

## 技术细节

### 工作流程

```
HTML 元素
   ↓
html2canvas 转为 Canvas
   ↓
Canvas 转为图片数据
   ↓
jsPDF 创建 PDF 并嵌入图片
   ↓
生成可下载的 PDF
```

### 支持的浏览器

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ⚠️ IE 11（不支持）

---

## 总结

| 功能 | 方案 1（Canvas 图片） | 方案 2（HTML2Canvas） |
|-----|-------------------|-------------------|
| 背景颜色 | ✅ 需手动处理 | ✅ 自动支持 |
| SVG | ⚠️ 需转换 | ✅ 自动支持 |
| 图片 | ✅ | ✅ |
| 复杂样式 | ❌ | ✅ |
| 文件大小 | ✅ 小 | ⚠️ 中等 |
| 生成速度 | ✅ 快 | ⚠️ 中等 |
| 实现难度 | ⚠️ 中等 | ✅ 简单 |

**推荐：**
- **大多数情况使用方案 2（HTML2Canvas）**
- 如需极致优化和小文件，才考虑方案 1
