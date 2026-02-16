/**
 * 使用 html2canvas + jsPDF 的 PDF 导出方案
 * 优势：完全保留所有样式、SVG、背景颜色等
 * 推荐用于复杂样式的 PDF 导出
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ExportOptions {
  filename?: string;
  scale?: number;
  quality?: 'high' | 'medium' | 'low';
}

/**
 * 将 HTML 元素导出为 PDF（完整样式）
 * 推荐方法：支持 SVG、背景颜色、复杂样式等
 */
export const exportElementToPDF = async (
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<void> => {
  const {
    filename = 'resume.pdf',
    scale = 2,
    quality = 'high',
  } = options;

  try {
    // 显示加载状态
    const originalCursor = document.body.style.cursor;
    document.body.style.cursor = 'wait';

    // 配置 html2canvas 选项
    const canvasOptions = {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: element.offsetWidth,
      height: element.offsetHeight,
      // 重要：避免 SVG 转换问题
      allowTaint: true,
      foreignObjectRendering: true,
    };

    // 转换 HTML 为 Canvas
    const canvas = await html2canvas(element, canvasOptions);
    
    // 获取页面尺寸信息
    const pdfWidth = 210; // A4 宽度（mm）
    const pdfHeight = 297; // A4 高度（mm）
    
    // 计算缩放比例
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // 创建 PDF
    const pdf = new jsPDF({
      orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    let heightLeft = imgHeight;
    let position = 0;

    // 处理多页 PDF
    const pageHeight = pdfHeight - 20; // 留出页边距
    const pageWidth = pdfWidth - 20;

    // 转换 Canvas 为图片
    const imgData = canvas.toDataURL('image/png', quality === 'high' ? 1 : 0.8);

    while (heightLeft > 0) {
      pdf.addImage(
        imgData,
        'PNG',
        10,
        position + 10,
        pageWidth,
        imgHeight
      );

      heightLeft -= pageHeight;
      position -= pageHeight;

      if (heightLeft > 0) {
        pdf.addPage();
      }
    }

    // 下载 PDF
    pdf.save(filename);

    // 恢复光标
    document.body.style.cursor = originalCursor;
  } catch (error) {
    console.error('PDF 导出失败:', error);
    document.body.style.cursor = 'auto';
    throw new Error('PDF 导出失败，请检查网络连接或重试');
  }
};

/**
 * 预览 PDF（在新标签页中显示）
 */
export const previewElementAsPDF = async (
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<void> => {
  const { scale = 2, quality = 'high' } = options;

  try {
    const canvasOptions = {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: element.offsetWidth,
      height: element.offsetHeight,
      allowTaint: true,
      foreignObjectRendering: true,
    };

    const canvas = await html2canvas(element, canvasOptions);
    
    const pdfWidth = 210;
    const pdfHeight = 297;
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    let heightLeft = imgHeight;
    let position = 0;
    const pageHeight = pdfHeight - 20;
    const pageWidth = pdfWidth - 20;

    const imgData = canvas.toDataURL('image/png', quality === 'high' ? 1 : 0.8);

    while (heightLeft > 0) {
      pdf.addImage(imgData, 'PNG', 10, position + 10, pageWidth, imgHeight);
      heightLeft -= pageHeight;
      position -= pageHeight;

      if (heightLeft > 0) {
        pdf.addPage();
      }
    }

    // 在新标签页预览
    const pdfDataUri = pdf.output('dataurlstring');
    window.open(pdfDataUri, '_blank');
  } catch (error) {
    console.error('PDF 预览失败:', error);
    throw new Error('PDF 预览失败，请重试');
  }
};

/**
 * 获取高质量 PDF Blob
 * 用于发送到服务器或其他处理
 */
export const getElementPDFBlob = async (
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<Blob> => {
  const { scale = 2, quality = 'high' } = options;

  const canvasOptions = {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    width: element.offsetWidth,
    height: element.offsetHeight,
    allowTaint: true,
    foreignObjectRendering: true,
  };

  const canvas = await html2canvas(element, canvasOptions);
  
  const pdfWidth = 210;
  const pdfHeight = 297;
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  const pdf = new jsPDF({
    orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  let heightLeft = imgHeight;
  let position = 0;
  const pageHeight = pdfHeight - 20;
  const pageWidth = pdfWidth - 20;

  const imgData = canvas.toDataURL('image/png', quality === 'high' ? 1 : 0.8);

  while (heightLeft > 0) {
    pdf.addImage(imgData, 'PNG', 10, position + 10, pageWidth, imgHeight);
    heightLeft -= pageHeight;
    position -= pageHeight;

    if (heightLeft > 0) {
      pdf.addPage();
    }
  }

  return pdf.output('blob');
};
