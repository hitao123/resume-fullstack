import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { message } from 'antd';
import type { Resume } from '@/types/resume.types';
import PDFDocument from '@/components/pdf/PDFDocument';
import ModernTemplatePDF from '@/components/pdf/ModernTemplatePDF';
import MinimalTemplatePDF from '@/components/pdf/MinimalTemplatePDF';
import { useTranslation } from 'react-i18next';

type TemplateType = 'classic' | 'modern' | 'minimal';
type ExportMode = 'react-pdf' | 'html2canvas';

const PREVIEW_ELEMENT_ID = 'resume-preview';

export const usePDFExport = () => {
  const { t } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportMode, setExportMode] = useState<ExportMode>('html2canvas');

  const getTemplate = (resume: Resume, templateType: TemplateType = 'classic') => {
    switch (templateType) {
      case 'modern':
        return <ModernTemplatePDF resume={resume} />;
      case 'minimal':
        return <MinimalTemplatePDF resume={resume} />;
      case 'classic':
      default:
        return <PDFDocument resume={resume} />;
    }
  };

  const buildFileName = (resume: Resume, templateType: TemplateType) => {
    return `${resume.personalInfo?.fullName || t('resumeEditor.export.defaultFileNameBase')}_${templateType}_${Date.now()}.pdf`;
  };

  // --- react-pdf path ---

  const generateWithReactPDF = async (resume: Resume, templateType: TemplateType) => {
    const blob = await pdf(getTemplate(resume, templateType)).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = buildFileName(resume, templateType);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const previewWithReactPDF = async (resume: Resume, templateType: TemplateType) => {
    const blob = await pdf(getTemplate(resume, templateType)).toBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  // --- html2canvas + jsPDF path ---

  const captureElement = async () => {
    const el = document.getElementById(PREVIEW_ELEMENT_ID);
    if (!el) {
      throw new Error(t('resumeEditor.export.previewElementMissing', { id: PREVIEW_ELEMENT_ID }));
    }

    const html2canvas = (await import('html2canvas')).default;

    // 临时将预览容器调整为 A4 比例宽度，避免侧边栏窄宽导致字体在 PDF 中偏大
    const A4_WIDTH_PX = 794; // 210mm at 96dpi
    const parent = el.parentElement;
    const origElWidth = el.style.width;
    const origParentWidth = parent?.style.width ?? '';
    const origParentMinWidth = parent?.style.minWidth ?? '';
    const origParentOverflow = parent?.style.overflow ?? '';

    if (parent) {
      parent.style.width = `${A4_WIDTH_PX}px`;
      parent.style.minWidth = `${A4_WIDTH_PX}px`;
      parent.style.overflow = 'hidden';
    }
    el.style.width = `${A4_WIDTH_PX}px`;

    // 等待浏览器重排
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        width: A4_WIDTH_PX,
      });
      return canvas;
    } finally {
      // 恢复原始样式
      el.style.width = origElWidth;
      if (parent) {
        parent.style.width = origParentWidth;
        parent.style.minWidth = origParentMinWidth;
        parent.style.overflow = origParentOverflow;
      }
    }
  };

  const canvasToPDF = async (canvas: HTMLCanvasElement) => {
    const { jsPDF } = await import('jspdf');

    const pdfWidth = 210; // A4 mm
    const pdfHeight = 297;
    const margin = 10;
    const contentWidth = pdfWidth - margin * 2;
    const contentHeight = pdfHeight - margin * 2;
    const imgHeight = (canvas.height * contentWidth) / canvas.width;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const imgData = canvas.toDataURL('image/png');

    let heightLeft = imgHeight;
    let position = 0;

    while (heightLeft > 0) {
      doc.addImage(imgData, 'PNG', margin, position + margin, contentWidth, imgHeight);
      heightLeft -= contentHeight;
      position -= contentHeight;
      if (heightLeft > 0) {
        doc.addPage();
      }
    }

    return doc;
  };

  const generateWithHtml2Canvas = async (resume: Resume, templateType: TemplateType) => {
    const canvas = await captureElement();
    const doc = await canvasToPDF(canvas);
    doc.save(buildFileName(resume, templateType));
  };

  const previewWithHtml2Canvas = async () => {
    const canvas = await captureElement();
    const doc = await canvasToPDF(canvas);
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  // --- public API ---

  const generatePDF = async (resume: Resume, templateType: TemplateType = 'classic') => {
    setIsGenerating(true);
    try {
      if (exportMode === 'html2canvas') {
        await generateWithHtml2Canvas(resume, templateType);
      } else {
        await generateWithReactPDF(resume, templateType);
      }
      message.success(t('resumeEditor.export.exportSuccess'));
    } catch (error) {
      console.error('PDF generation failed:', error);
      message.error(t('resumeEditor.export.exportFailed'));
    } finally {
      setIsGenerating(false);
    }
  };

  const previewPDF = async (resume: Resume, templateType: TemplateType = 'classic') => {
    setIsGenerating(true);
    try {
      if (exportMode === 'html2canvas') {
        await previewWithHtml2Canvas();
      } else {
        await previewWithReactPDF(resume, templateType);
      }
      message.success(t('resumeEditor.export.previewOpened'));
    } catch (error) {
      console.error('PDF preview failed:', error);
      message.error(t('resumeEditor.export.previewFailed'));
    } finally {
      setIsGenerating(false);
    }
  };

  const switchExportMode = (mode: ExportMode) => {
    setExportMode(mode);
  };

  return {
    generatePDF,
    previewPDF,
    isGenerating,
    exportMode,
    switchExportMode,
  };
};

export default usePDFExport;
