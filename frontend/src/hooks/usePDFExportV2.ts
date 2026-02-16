/**
 * 增强的 PDF 导出 Hook
 * 支持两种方案：
 * 1. @react-pdf/renderer（原有方案）
 * 2. HTML2Canvas + jsPDF（新推荐方案，完全保留样式）
 */

import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { message } from 'antd';
import type { Resume } from '@/types/resume.types';
import PDFDocument from '@/components/pdf/PDFDocument';
import EnhancedPDFDocument from '@/components/pdf/EnhancedPDFDocument';
import ModernTemplatePDF from '@/components/pdf/ModernTemplatePDF';

type TemplateType = 'classic' | 'modern';

/**
 * 动态导入 html2canvas 和 jsPDF
 * 避免不必要的库加载
 */
const importHtml2Canvas = async () => {
  const { default: html2canvas } = await import('html2canvas');
  return html2canvas;
};

const importJsPDF = async () => {
  const jsPDF = await import('jspdf');
  return jsPDF;
};

interface ExportMode {
  type: 'react-pdf' | 'html2canvas';
}

export const usePDFExport = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportMode, setExportMode] = useState<ExportMode['type']>('react-pdf');

  const getTemplate = (resume: Resume, templateType: TemplateType = 'classic') => {
    switch (templateType) {
      case 'modern':
        return <ModernTemplatePDF resume={resume} />;
      case 'classic':
      default:
        // 如果使用 html2canvas 模式，使用常规内容（不用 PDF 组件）
        return exportMode === 'html2canvas' 
          ? null 
          : <PDFDocument resume={resume} />;
    }
  };

  /**
   * 方案 1：使用 @react-pdf/renderer（原有方案）
   * 保留原有功能，改进了样式支持
   */
  const generatePDFWithReactPDF = async (
    resume: Resume,
    templateType: TemplateType = 'classic'
  ) => {
    try {
      // 优先使用增强版本，它支持背景颜色和图片
      const template = 
        <EnhancedPDFDocument resume={resume} />;

      const blob = await pdf(template).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const fileName = `${resume.personalInfo?.fullName || '简历'}_${templateType}_${new Date().getTime()}.pdf`;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
      message.success('PDF 导出成功！');
    } catch (error) {
      console.error('PDF 生成失败:', error);
      throw new Error('PDF 导出失败，请重试');
    }
  };

  /**
   * 方案 2：使用 HTML2Canvas + jsPDF（推荐）
   * 完全保留 HTML 样式、SVG、背景颜色等
   */
  const generatePDFWithHtml2Canvas = async (elementId: string) => {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`找不到 ID 为 "${elementId}" 的元素`);
      }

      const html2canvas = await importHtml2Canvas();
      const { jsPDF } = await importJsPDF();

      // 转换 HTML 为 Canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: element.offsetWidth,
        height: element.offsetHeight,
        allowTaint: true,
        foreignObjectRendering: true,
      });

      // 创建 PDF
      const pdfWidth = 210; // A4 宽度
      const pdfHeight = 297; // A4 高度
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdfDoc = new jsPDF({
        orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      let heightLeft = imgHeight;
      let position = 0;
      const pageHeight = pdfHeight - 20;
      const pageWidth = pdfWidth - 20;

      const imgData = canvas.toDataURL('image/png');

      while (heightLeft > 0) {
        pdfDoc.addImage(imgData, 'PNG', 10, position + 10, pageWidth, imgHeight);
        heightLeft -= pageHeight;
        position -= pageHeight;

        if (heightLeft > 0) {
          pdfDoc.addPage();
        }
      }

      // 下载
      pdfDoc.save('resume.pdf');
      message.success('PDF 导出成功！');
    } catch (error) {
      console.error('HTML2Canvas 导出失败:', error);
      throw new Error('PDF 导出失败，请确保已安装依赖：npm install html2canvas jspdf');
    }
  };

  /**
   * 预览 PDF（使用 React PDF）
   */
  const previewPDFWithReactPDF = async (
    resume: Resume,
    templateType: TemplateType = 'classic'
  ) => {
    try {
      const template = <EnhancedPDFDocument resume={resume} />;
      const blob = await pdf(template).toBlob();

      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

      message.success('PDF 预览已打开');
    } catch (error) {
      console.error('PDF 预览失败:', error);
      throw new Error('PDF 预览失败，请重试');
    }
  };

  /**
   * 预览 HTML 为 PDF（使用 HTML2Canvas）
   */
  const previewPDFWithHtml2Canvas = async (elementId: string) => {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`找不到 ID 为 "${elementId}" 的元素`);
      }

      const html2canvas = await importHtml2Canvas();
      const { jsPDF } = await importJsPDF();

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: element.offsetWidth,
        height: element.offsetHeight,
        allowTaint: true,
        foreignObjectRendering: true,
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdfDoc = new jsPDF({
        orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      let heightLeft = imgHeight;
      let position = 0;
      const pageHeight = pdfHeight - 20;
      const pageWidth = pdfWidth - 20;

      const imgData = canvas.toDataURL('image/png');

      while (heightLeft > 0) {
        pdfDoc.addImage(imgData, 'PNG', 10, position + 10, pageWidth, imgHeight);
        heightLeft -= pageHeight;
        position -= pageHeight;

        if (heightLeft > 0) {
          pdfDoc.addPage();
        }
      }

      // 预览
      const pdfDataUri = pdfDoc.output('dataurlstring');
      window.open(pdfDataUri, '_blank');
      message.success('PDF 预览已打开');
    } catch (error) {
      console.error('预览失败:', error);
      throw new Error('PDF 预览失败，请确保已安装依赖');
    }
  };

  /**
   * 通用导出接口
   * 自动选择合适的方案
   * 
   * 使用示例：
   * 
   * // 导出 React PDF（仅含文本和基础样式）
   * generatePDF(resume, 'classic')
   * 
   * // 导出 HTML 元素为 PDF（完整保留所有样式和 SVG）
   * generatePDF({ elementId: 'resume-content' })
   */
  const generatePDF = async (
    resumeOrOptions: Resume | { elementId: string },
    templateType: TemplateType = 'classic'
  ) => {
    setIsGenerating(true);
    try {
      if ('elementId' in resumeOrOptions) {
        // HTML2Canvas 模式
        await generatePDFWithHtml2Canvas(resumeOrOptions.elementId);
      } else {
        // React PDF 模式
        await generatePDFWithReactPDF(resumeOrOptions, templateType);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * 通用预览接口
   */
  const previewPDF = async (
    resumeOrElementId: Resume | string,
    templateType: TemplateType = 'classic'
  ) => {
    setIsGenerating(true);
    try {
      if (typeof resumeOrElementId === 'string') {
        // HTML2Canvas 模式
        await previewPDFWithHtml2Canvas(resumeOrElementId);
      } else {
        // React PDF 模式
        await previewPDFWithReactPDF(resumeOrElementId, templateType);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const switchExportMode = (mode: ExportMode['type']) => {
    setExportMode(mode);
    message.info(`已切换为 ${mode === 'react-pdf' ? '@react-pdf/renderer' : 'HTML2Canvas'} 模式`);
  };

  return {
    // 原有接口（@react-pdf/renderer）
    generatePDF,
    previewPDF,
    isGenerating,

    // 新增接口
    generatePDFWithReactPDF,
    previewPDFWithReactPDF,
    generatePDFWithHtml2Canvas,
    previewPDFWithHtml2Canvas,

    // 模式控制
    exportMode,
    switchExportMode,
  };
};

export default usePDFExport;
