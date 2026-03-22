/**
 * PDF 渲染辅助工具
 * 处理 @react-pdf/renderer 的限制（SVG、背景颜色等）
 */

/**
 * SVG 转 Base64 PNG 图片
 * 用于在 PDF 中显示 SVG 图案
 */
export const svgToImage = async (svgString: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 创建 canvas 元素
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('无法获取 canvas 上下文'));
      return;
    }

    // 创建 SVG Blob
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    // 创建图片
    const img = new window.Image();
    img.onload = () => {
      canvas.width = img.width || 100;
      canvas.height = img.height || 100;
      ctx.drawImage(img, 0, 0);
      
      const dataUrl = canvas.toDataURL('image/png');
      URL.revokeObjectURL(url);
      resolve(dataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('SVG 转换失败'));
    };
    img.src = url;
  });
};

/**
 * 创建带背景色的标签图片数据
 * 用于 PDF 中显示带背景的标签
 */
export const createColoredTagImage = (
  text: string,
  backgroundColor: string = '#ecf0f1',
  textColor: string = '#2c3e50',
  width: number = 80,
  height: number = 24,
): string => {
  const canvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.scale(dpr, dpr);

  // 绘制背景
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // 绘制圆角边框
  ctx.strokeStyle = backgroundColor;
  ctx.lineWidth = 1;
  const radius = 4;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(width - radius, 0);
  ctx.quadraticCurveTo(width, 0, width, radius);
  ctx.lineTo(width, height - radius);
  ctx.quadraticCurveTo(width, height, width - radius, height);
  ctx.lineTo(radius, height);
  ctx.quadraticCurveTo(0, height, 0, height - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.stroke();

  // 绘制文字
  ctx.fillStyle = textColor;
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);

  return canvas.toDataURL('image/png');
};

/**
 * 获取颜色对应的背景色（用于 PDF 标签）
 */
export const getTagBackgroundColor = (colorType: string): string => {
  const colorMap: Record<string, string> = {
    'default': '#ecf0f1',
    'blue': '#e3f2fd',
    'green': '#e8f5e9',
    'gold': '#fff3e0',
    'red': '#ffebee',
    'purple': '#f3e5f5',
    'cyan': '#e0f2f1',
  };
  return colorMap[colorType] || '#ecf0f1';
};

/**
 * 获取文字颜色（用于 PDF 标签）
 */
export const getTagTextColor = (colorType: string): string => {
  const colorMap: Record<string, string> = {
    'default': '#2c3e50',
    'blue': '#1976d2',
    'green': '#388e3c',
    'gold': '#f57f17',
    'red': '#d32f2f',
    'purple': '#7b1fa2',
    'cyan': '#00796b',
  };
  return colorMap[colorType] || '#2c3e50';
};

/**
 * 为 PDF 预渲染带颜色的标签
 * 返回图片 URL 列表，避免渲染时性能问题
 */
export const preRenderSkillTags = (
  skills: Array<{ name: string; id: string }>,
  colorType: string = 'blue'
): Map<string, string> => {
  const tagImages = new Map<string, string>();
  const bgColor = getTagBackgroundColor(colorType);
  const textColor = getTagTextColor(colorType);

  skills.forEach((skill) => {
    const imageData = createColoredTagImage(skill.name, bgColor, textColor);
    tagImages.set(skill.id, imageData);
  });

  return tagImages;
};

/**
 * 计算 canvas 文本宽度（用于动态调整标签大小）
 */
export const calculateTextWidth = (text: string, font: string = '12px Arial'): number => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return text.length * 7;

  ctx.font = font;
  return ctx.measureText(text).width;
};
