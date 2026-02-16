# PDF 导出快速开始指南

## 5 分钟快速上手

### 步骤 1：安装依赖

```bash
cd frontend
npm install html2canvas jspdf
```

### 步骤 2：选择解决方案

#### 推荐方案（HTML2Canvas - 最简单且效果最好）

**A. 在组件中添加导出按钮**

```tsx
import { Button, Space } from 'antd';
import { DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { exportElementToPDF, previewElementAsPDF } from '@/utils/htmlToPdfExport';
import { useState } from 'react';

export const ResumePreview = () => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      const element = document.getElementById('resume-content');
      if (element) {
        await exportElementToPDF(element, {
          filename: 'my-resume.pdf'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    try {
      setLoading(true);
      const element = document.getElementById('resume-content');
      if (element) {
        await previewElementAsPDF(element);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Space>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExport}
          loading={loading}
        >
          下载 PDF
        </Button>

        <Button
          icon={<EyeOutlined />}
          onClick={handlePreview}
          loading={loading}
        >
          预览 PDF
        </Button>
      </Space>

      {/* 这是要导出为 PDF 的内容 */}
      <div id="resume-content" style={{ padding: '20px', marginTop: '20px' }}>
        <h1>{resume.personalInfo?.fullName}</h1>
        <p>{resume.personalInfo?.email}</p>
        
        {/* 技能部分（会保留背景色） */}
        <div style={{ marginTop: '20px' }}>
          <h2>专业技能</h2>
          {skills.map(skill => (
            <span
              key={skill.id}
              style={{
                display: 'inline-block',
                backgroundColor: '#e3f2fd',
                color: '#1976d2',
                padding: '6px 12px',
                borderRadius: '4px',
                marginRight: '8px',
                marginBottom: '8px'
              }}
            >
              {skill.name}
            </span>
          ))}
        </div>

        {/* 其他内容... */}
      </div>
    </>
  );
};
```

**B. 就这样！现在打开 PDF 时所有背景颜色、SVG 和样式都会保留** ✅

---

#### 备选方案（使用改进的 @react-pdf/renderer）

```tsx
import { usePDFExport } from '@/hooks/usePDFExportV2';
import PDFDocument from '@/components/pdf/PDFDocument';

export const ResumeEditor = () => {
  const { generatePDF, previewPDF, isGenerating } = usePDFExport();
  const resume = useResume();

  return (
    <>
      <Button onClick={() => generatePDF(resume)}>下载 PDF</Button>
      <Button onClick={() => previewPDF(resume)}>预览 PDF</Button>
    </>
  );
};
```

---

## 最小化完整示例

### 文件：src/pages/ResumeEditor.tsx

```tsx
import { useState } from 'react';
import { Button, Space, Spin } from 'antd';
import { DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { exportElementToPDF, previewElementAsPDF } from '@/utils/htmlToPdfExport';
import { useResume } from '@/hooks/useResume';

export const ResumeEditor = () => {
  const { resume } = useResume();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const element = document.getElementById('resume-for-pdf');
      if (element) {
        await exportElementToPDF(element, {
          filename: `${resume?.personalInfo?.fullName || 'resume'}.pdf`,
          scale: 2,
          quality: 'high'
        });
      }
    } catch (error) {
      alert('导出失败: ' + error);
    } finally {
      setExporting(false);
    }
  };

  const handlePreview = async () => {
    setExporting(true);
    try {
      const element = document.getElementById('resume-for-pdf');
      if (element) {
        await previewElementAsPDF(element, {
          scale: 2,
          quality: 'high'
        });
      }
    } catch (error) {
      alert('预览失败: ' + error);
    } finally {
      setExporting(false);
    }
  };

  if (!resume) return <div>加载中...</div>;

  return (
    <Spin spinning={exporting}>
      <div>
        <Space style={{ marginBottom: '20px' }}>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exporting}
          >
            下载 PDF
          </Button>

          <Button
            icon={<EyeOutlined />}
            onClick={handlePreview}
            loading={exporting}
          >
            预览 PDF
          </Button>
        </Space>

        {/* 简历内容 - 这个会被导出为 PDF */}
        <div 
          id="resume-for-pdf" 
          style={{
            backgroundColor: '#fff',
            padding: '40px',
            minHeight: '800px'
          }}
        >
          {/* 个人信息 */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>
              {resume.personalInfo?.fullName}
            </h1>
            <p style={{ color: '#666', marginTop: '10px' }}>
              {[
                resume.personalInfo?.email,
                resume.personalInfo?.phone,
                resume.personalInfo?.location
              ]
                .filter(Boolean)
                .join(' | ')}
            </p>
          </div>

          {/* 个人简介 */}
          {resume.personalInfo?.summary && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
                个人简介
              </h3>
              <p style={{ lineHeight: '1.8', color: '#555' }}>
                {resume.personalInfo.summary}
              </p>
            </div>
          )}

          {/* 专业技能（带背景色） */}
          {resume.skills && resume.skills.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
                专业技能
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {resume.skills.map((skill) => (
                  <span
                    key={skill.id}
                    style={{
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                      padding: '8px 14px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    {skill.name}
                    {skill.proficiencyLevel && ` (${skill.proficiencyLevel})`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 工作经历 */}
          {resume.workExperiences && resume.workExperiences.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
                工作经历
              </h3>
              {resume.workExperiences.map((work, index) => (
                <div key={index} style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontWeight: 'bold' }}>{work.position}</span>
                    <span style={{ color: '#999' }}>
                      {work.startDate} - {work.endDate || '至今'}
                    </span>
                  </div>
                  <div style={{ color: '#666', marginBottom: '8px' }}>
                    {work.companyName}
                    {work.location && ` · ${work.location}`}
                  </div>
                  {work.description && (
                    <p style={{ color: '#555', lineHeight: '1.6', fontSize: '14px' }}>
                      {work.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 教育背景 */}
          {resume.education && resume.education.length > 0 && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
                教育背景
              </h3>
              {resume.education.map((edu, index) => (
                <div key={index} style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontWeight: 'bold' }}>{edu.institution}</span>
                    <span style={{ color: '#999' }}>
                      {edu.startDate} - {edu.endDate}
                    </span>
                  </div>
                  <p style={{ color: '#555', lineHeight: '1.6', fontSize: '14px' }}>
                    {edu.degree}
                    {edu.fieldOfStudy && ` · ${edu.fieldOfStudy}`}
                    {edu.gpa && ` · GPA: ${edu.gpa}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Spin>
  );
};

export default ResumeEditor;
```

---

## 实际效果对比

### 之前（问题）
- ❌ 灰色标签变透明
- ❌ SVG 图案丢失
- ❌ 背景颜色丢失

### 之后（使用 HTML2Canvas）
- ✅ 所有背景颜色完美保留
- ✅ SVG 图案完美显示
- ✅ 所有复杂样式保留
- ✅ 所见即所得

---

## 常见问题速答

### Q: 我应该用哪个方案？

**A: 简单答案：用 HTML2Canvas 方案**

- 背景颜色、SVG、复杂样式都需要？→ HTML2Canvas ⭐⭐⭐
- 想要最小的文件？ → @react-pdf/renderer（但样式支持差）
- 想要快速导出？ → 两者都可以，HTML2Canvas 仅慢几秒

### Q: 导出速度太慢？

```tsx
// 降低质量
await exportElementToPDF(element, {
  scale: 1.5,        // 改为 1.5 而不是 2
  quality: 'medium'  // 改为 medium 而不是 high
});
```

### Q: 只有部分内容显示不对？

```tsx
// 确保 div 有内联样式，避免用 CSS 类
<div style={{ backgroundColor: '#f0f0f0' }}>  // ✅ 可以
  内容
</div>

<div className="my-class">  // ⚠️ 可能不行
  内容
</div>
```

### Q: 需要安装额外的库吗？

```bash
npm install html2canvas jspdf
```

就这个，不需要其他的！

---

## 验证效果

导出 PDF 后，打开检查：
- [ ] 背景颜色是否保留？
- [ ] 文字是否清晰？
- [ ] 多页是否分页正确？
- [ ] 点击"预览 PDF"是否在新标签页打开？

如果都是 ✅，说明已经成功！

---

## 下一步

1. **安装依赖**
   ```bash
   npm install html2canvas jspdf
   ```

2. **复制上面的代码示例**
   到你的组件中

3. **测试导出**
   导出一个 PDF 看看效果

4. **根据需要调整样式**
   确保所有背景颜色都用 inline style

完成！🎉
