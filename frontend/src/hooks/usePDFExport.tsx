import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { message } from 'antd';
import type { Resume } from '@/types/resume.types';
import PDFDocument from '@/components/pdf/PDFDocument';
import ModernTemplatePDF from '@/components/pdf/ModernTemplatePDF';

type TemplateType = 'classic' | 'modern';

export const usePDFExport = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const getTemplate = (resume: Resume, templateType: TemplateType = 'classic') => {
    switch (templateType) {
      case 'modern':
        return <ModernTemplatePDF resume={resume} />;
      case 'classic':
      default:
        return <PDFDocument resume={resume} />;
    }
  };

  const generatePDF = async (resume: Resume, templateType: TemplateType = 'classic') => {
    setIsGenerating(true);
    try {
      // 生成 PDF Blob
      const template = getTemplate(resume, templateType);
      const blob = await pdf(template).toBlob();

      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // 使用简历标题作为文件名
      const fileName = `${resume.personalInfo?.fullName || '简历'}_${templateType}_${new Date().getTime()}.pdf`;
      link.download = fileName;

      // 触发下载
      document.body.appendChild(link);
      link.click();

      // 清理
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success('PDF 导出成功！');
    } catch (error) {
      console.error('PDF 生成失败:', error);
      message.error('PDF 导出失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const previewPDF = async (resume: Resume, templateType: TemplateType = 'classic') => {
    setIsGenerating(true);
    try {
      // 生成 PDF Blob
      const template = getTemplate(resume, templateType);
      const blob = await pdf(template).toBlob();

      // 在新窗口中打开预览
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');

      // 延迟清理 URL（给浏览器时间打开）
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

      message.success('PDF 预览已打开');
    } catch (error) {
      console.error('PDF 预览失败:', error);
      message.error('PDF 预览失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generatePDF,
    previewPDF,
    isGenerating,
  };
};

export default usePDFExport;