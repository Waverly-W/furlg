/**
 * 颜色提取和分析工具
 * 基于Canvas API从图片中提取主要颜色调色板
 */

export interface ColorInfo {
  rgb: [number, number, number];
  hex: string;
  hsl: [number, number, number];
  frequency: number; // 颜色在图片中的出现频率
  weight: number;    // 颜色重要性权重
  area: number;      // 颜色占据的面积比例
  position: 'center' | 'edge' | 'corner' | 'distributed'; // 颜色在图片中的位置分布
}

export interface ExtendedColorPalette {
  dominant: ColorInfo;      // 主色调
  secondary: ColorInfo[];   // 次要颜色（2-4个）
  accent: ColorInfo;        // 强调色
  neutral: ColorInfo;       // 中性色
  warm: ColorInfo[];        // 暖色调
  cool: ColorInfo[];        // 冷色调
  vibrant: ColorInfo[];     // 高饱和度颜色
  muted: ColorInfo[];       // 低饱和度颜色
  light: ColorInfo[];       // 亮色
  dark: ColorInfo[];        // 暗色
}

export interface ColorExtractionOptions {
  strategy: 'dominant' | 'average' | 'edge' | 'center' | 'corners' | 'distributed';
  filterExtremes: boolean;  // 是否过滤极端颜色
  weightByPosition: boolean; // 是否按位置加权
  weightBySaturation: boolean; // 是否按饱和度加权
  maxColors: number;        // 最大颜色数量
  sampleRate: number;       // 采样率（1-16）
}

/**
 * RGB转HSL
 */
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

/**
 * HSL转RGB
 */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  s /= 100;
  l /= 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * RGB转HEX
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * 计算颜色亮度（用于对比度计算）
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * 计算对比度比率
 */
export function getContrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const lum1 = getLuminance(...rgb1);
  const lum2 = getLuminance(...rgb2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * 检查颜色对比度是否符合WCAG标准
 */
export function isAccessibleContrast(foreground: [number, number, number], background: [number, number, number], level: 'AA' | 'AAA' = 'AA'): boolean {
  const ratio = getContrastRatio(foreground, background);
  return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
}

/**
 * 检查颜色是否为极端颜色（过亮、过暗、过饱和）
 */
function isExtremeColor(rgb: [number, number, number]): boolean {
  const [r, g, b] = rgb;
  const [h, s, l] = rgbToHsl(r, g, b);

  // 过亮（亮度 > 95%）
  if (l > 95) return true;

  // 过暗（亮度 < 5%）
  if (l < 5) return true;

  // 过饱和且过亮或过暗
  if (s > 90 && (l > 85 || l < 15)) return true;

  // 接近纯灰色
  if (s < 5 && l > 20 && l < 80) return true;

  return false;
}

/**
 * 计算颜色的重要性权重
 */
function calculateColorWeight(
  rgb: [number, number, number],
  x: number,
  y: number,
  width: number,
  height: number,
  options: ColorExtractionOptions
): number {
  let weight = 1;
  const [h, s, l] = rgbToHsl(...rgb);

  // 位置权重
  if (options.weightByPosition) {
    const centerX = width / 2;
    const centerY = height / 2;
    const distanceFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
    const centerWeight = 1 - (distanceFromCenter / maxDistance) * 0.5; // 中心权重更高
    weight *= centerWeight;
  }

  // 饱和度权重
  if (options.weightBySaturation) {
    const saturationWeight = 0.5 + (s / 100) * 0.5; // 饱和度高的颜色权重更高
    weight *= saturationWeight;
  }

  // 亮度权重（避免过亮过暗）
  const lightnessWeight = 1 - Math.abs(l - 50) / 50 * 0.3; // 中等亮度权重更高
  weight *= lightnessWeight;

  return weight;
}

/**
 * 根据策略获取采样点
 */
function getSamplePoints(width: number, height: number, strategy: string, sampleRate: number): Array<{x: number, y: number}> {
  const points: Array<{x: number, y: number}> = [];

  switch (strategy) {
    case 'center':
      // 只采样中心区域
      const centerSize = Math.min(width, height) * 0.6;
      const startX = (width - centerSize) / 2;
      const startY = (height - centerSize) / 2;
      for (let y = startY; y < startY + centerSize; y += sampleRate) {
        for (let x = startX; x < startX + centerSize; x += sampleRate) {
          points.push({x: Math.floor(x), y: Math.floor(y)});
        }
      }
      break;

    case 'edge':
      // 只采样边缘区域
      const edgeWidth = Math.min(width, height) * 0.2;
      // 上边缘
      for (let y = 0; y < edgeWidth; y += sampleRate) {
        for (let x = 0; x < width; x += sampleRate) {
          points.push({x, y});
        }
      }
      // 下边缘
      for (let y = height - edgeWidth; y < height; y += sampleRate) {
        for (let x = 0; x < width; x += sampleRate) {
          points.push({x, y});
        }
      }
      // 左边缘
      for (let y = edgeWidth; y < height - edgeWidth; y += sampleRate) {
        for (let x = 0; x < edgeWidth; x += sampleRate) {
          points.push({x, y});
        }
      }
      // 右边缘
      for (let y = edgeWidth; y < height - edgeWidth; y += sampleRate) {
        for (let x = width - edgeWidth; x < width; x += sampleRate) {
          points.push({x, y});
        }
      }
      break;

    case 'corners':
      // 只采样四个角落
      const cornerSize = Math.min(width, height) * 0.3;
      const corners = [
        {startX: 0, startY: 0},
        {startX: width - cornerSize, startY: 0},
        {startX: 0, startY: height - cornerSize},
        {startX: width - cornerSize, startY: height - cornerSize}
      ];
      corners.forEach(corner => {
        for (let y = corner.startY; y < corner.startY + cornerSize; y += sampleRate) {
          for (let x = corner.startX; x < corner.startX + cornerSize; x += sampleRate) {
            if (x >= 0 && x < width && y >= 0 && y < height) {
              points.push({x, y});
            }
          }
        }
      });
      break;

    default: // 'distributed' 或 'dominant'
      // 均匀采样整个图片
      for (let y = 0; y < height; y += sampleRate) {
        for (let x = 0; x < width; x += sampleRate) {
          points.push({x, y});
        }
      }
      break;
  }

  return points;
}

/**
 * 改进的颜色提取函数
 */
export async function extractColorsFromImage(
  imageUrl: string,
  options: Partial<ColorExtractionOptions> = {}
): Promise<ExtendedColorPalette> {
  const defaultOptions: ColorExtractionOptions = {
    strategy: 'distributed',
    filterExtremes: true,
    weightByPosition: true,
    weightBySaturation: true,
    maxColors: 12,
    sampleRate: 4
  };

  const finalOptions = { ...defaultOptions, ...options };

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('无法获取Canvas上下文');

        // 缩放图片以提高性能（最大300x300）
        const maxSize = 300;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = canvas.width;
        const height = canvas.height;

        // 根据策略获取采样点
        const samplePoints = getSamplePoints(width, height, finalOptions.strategy, finalOptions.sampleRate);

        // 颜色统计，包含权重信息
        const colorStats = new Map<string, {
          rgb: [number, number, number];
          frequency: number;
          totalWeight: number;
          positions: Array<{x: number, y: number}>;
        }>();

        // 采样像素
        samplePoints.forEach(({x, y}) => {
          if (x >= 0 && x < width && y >= 0 && y < height) {
            const index = (y * width + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            const a = data[index + 3];

            // 跳过透明像素
            if (a < 128) return;

            const rgb: [number, number, number] = [r, g, b];

            // 过滤极端颜色
            if (finalOptions.filterExtremes && isExtremeColor(rgb)) return;

            // 量化颜色
            const quantizedR = Math.round(r / 24) * 24;
            const quantizedG = Math.round(g / 24) * 24;
            const quantizedB = Math.round(b / 24) * 24;
            const quantizedRgb: [number, number, number] = [quantizedR, quantizedG, quantizedB];

            const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
            const weight = calculateColorWeight(quantizedRgb, x, y, width, height, finalOptions);

            if (!colorStats.has(colorKey)) {
              colorStats.set(colorKey, {
                rgb: quantizedRgb,
                frequency: 0,
                totalWeight: 0,
                positions: []
              });
            }

            const stats = colorStats.get(colorKey)!;
            stats.frequency += 1;
            stats.totalWeight += weight;
            stats.positions.push({x, y});
          }
        });

        if (colorStats.size === 0) {
          throw new Error('无法从图片中提取颜色');
        }

        // 转换为ColorInfo数组并排序
        const extractedColors: ColorInfo[] = Array.from(colorStats.entries())
          .map(([colorKey, stats]) => {
            const [r, g, b] = stats.rgb;
            const area = stats.frequency / samplePoints.length * 100;

            // 计算位置分布
            let position: 'center' | 'edge' | 'corner' | 'distributed' = 'distributed';
            const centerX = width / 2;
            const centerY = height / 2;
            const avgDistance = stats.positions.reduce((sum, pos) => {
              return sum + Math.sqrt(Math.pow(pos.x - centerX, 2) + Math.pow(pos.y - centerY, 2));
            }, 0) / stats.positions.length;
            const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));

            if (avgDistance < maxDistance * 0.3) position = 'center';
            else if (avgDistance > maxDistance * 0.7) position = 'edge';

            return {
              rgb: [r, g, b] as [number, number, number],
              hex: rgbToHex(r, g, b),
              hsl: rgbToHsl(r, g, b),
              frequency: stats.frequency,
              weight: stats.totalWeight / stats.frequency, // 平均权重
              area,
              position
            };
          })
          .sort((a, b) => b.totalWeight - a.totalWeight)
          .slice(0, finalOptions.maxColors);

        // 构建扩展调色板
        const palette = buildExtendedPalette(extractedColors);
        resolve(palette);

      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = imageUrl;
  });
}

/**
 * 构建扩展调色板
 */
function buildExtendedPalette(colors: ColorInfo[]): ExtendedColorPalette {
  if (colors.length === 0) {
    throw new Error('颜色数组为空');
  }

  // 基础颜色分类
  const warm: ColorInfo[] = [];
  const cool: ColorInfo[] = [];
  const vibrant: ColorInfo[] = [];
  const muted: ColorInfo[] = [];
  const light: ColorInfo[] = [];
  const dark: ColorInfo[] = [];

  colors.forEach(color => {
    const [h, s, l] = color.hsl;

    // 暖色/冷色分类
    if ((h >= 0 && h <= 60) || (h >= 300 && h <= 360)) {
      warm.push(color);
    } else if (h >= 180 && h <= 300) {
      cool.push(color);
    } else if (h > 60 && h < 180) {
      if (h <= 120) warm.push(color); // 黄绿偏暖
      else cool.push(color); // 青蓝偏冷
    }

    // 饱和度分类
    if (s >= 50) {
      vibrant.push(color);
    } else {
      muted.push(color);
    }

    // 亮度分类
    if (l >= 60) {
      light.push(color);
    } else {
      dark.push(color);
    }
  });

  // 选择主色调（权重最高的颜色）
  const dominant = colors[0];

  // 选择次要颜色（排除主色调后的前3个）
  const secondary = colors.slice(1, Math.min(4, colors.length));

  // 选择强调色（与主色调对比度高的颜色）
  let accent = colors[1] || dominant;
  for (const color of colors.slice(1)) {
    if (getContrastRatio(dominant.rgb, color.rgb) > 4) {
      accent = color;
      break;
    }
  }

  // 选择中性色（饱和度低的颜色）
  let neutral = muted.find(color => color.hsl[1] < 30) || colors[colors.length - 1];

  return {
    dominant,
    secondary,
    accent,
    neutral,
    warm: warm.slice(0, 3),
    cool: cool.slice(0, 3),
    vibrant: vibrant.slice(0, 3),
    muted: muted.slice(0, 3),
    light: light.slice(0, 3),
    dark: dark.slice(0, 3)
  };
}

/**
 * 生成颜色变体（亮色、暗色版本）
 */
export function generateColorVariants(baseColor: [number, number, number]) {
  const [h, s, l] = rgbToHsl(...baseColor);

  return {
    lighter: hslToRgb(h, Math.max(0, s - 10), Math.min(100, l + 20)),
    light: hslToRgb(h, Math.max(0, s - 5), Math.min(100, l + 10)),
    base: baseColor,
    dark: hslToRgb(h, Math.min(100, s + 5), Math.max(0, l - 10)),
    darker: hslToRgb(h, Math.min(100, s + 10), Math.max(0, l - 20))
  };
}

/**
 * 调整颜色饱和度
 */
export function adjustSaturation(rgb: [number, number, number], adjustment: number): [number, number, number] {
  const [h, s, l] = rgbToHsl(...rgb);
  const newS = Math.max(0, Math.min(100, s + adjustment));
  return hslToRgb(h, newS, l);
}

/**
 * 调整颜色亮度
 */
export function adjustLightness(rgb: [number, number, number], adjustment: number): [number, number, number] {
  const [h, s, l] = rgbToHsl(...rgb);
  const newL = Math.max(0, Math.min(100, l + adjustment));
  return hslToRgb(h, s, newL);
}
