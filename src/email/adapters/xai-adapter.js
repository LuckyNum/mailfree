/**
 * xAI 验证码提取适配器
 * 处理来自 x.ai (xAI/Grok) 的验证码邮件
 * @module email/adapters/xai-adapter
 */

import { BaseVerificationAdapter } from './base-adapter.js';
import { stripHtml } from '../parser.js';

export class XaiAdapter extends BaseVerificationAdapter {
  /**
   * xAI 相关的域名列表
   */
  static DOMAINS = ['x.ai', 'xai.com', 'x.ai.org'];

  /**
   * xAI 验证码格式：字母数字组合，通常为 XXX-XXX 或 XXXXX-XXXXX 格式
   * 示例: Y52-NG6, ABC12-DEF34
   */
  static CODE_PATTERN = /([A-Z0-9]{2,5}[-–—][A-Z0-9]{2,5})/i;

  /**
   * 检查是否为 xAI 邮件
   */
  canHandle(params) {
    const { fromDomain = '' } = params;
    const domain = fromDomain.toLowerCase();
    return XaiAdapter.DOMAINS.some(d => domain === d || domain.endsWith('.' + d));
  }

  /**
   * xAI 优先级较高（数字小）
   */
  getPriority() {
    return 10;
  }

  /**
   * 提取 xAI 验证码
   * 策略：
   * 1. 首先从邮件主题中提取（xAI 通常将验证码放在主题开头）
   * 2. 然后从 HTML 的特定样式表格中提取
   * 3. 最后从纯文本中提取
   */
  extract(params) {
    const { subject = '', html = '', text = '' } = params;

    // 策略 1: 从主题中提取（最可靠）
    // xAI 主题格式: "Y52-NG6 xAI confirmation code" 或 "Your confirmation code"
    const subjectCode = this.extractFromSubject(subject);
    if (subjectCode) {
      return this.normalizeCode(subjectCode);
    }

    // 策略 2: 从 HTML 的特殊格式表格中提取
    // xAI HTML 中验证码在灰色背景的表格单元格中
    if (html) {
      const htmlCode = this.extractFromHtml(html);
      if (htmlCode) {
        return this.normalizeCode(htmlCode);
      }
    }

    // 策略 3: 从纯文本中提取
    if (text) {
      const textCode = this.extractFromText(text);
      if (textCode) {
        return this.normalizeCode(textCode);
      }
    }

    // 策略 4: 从 HTML 文本中提取
    if (html) {
      const htmlTextCode = this.extractFromText(stripHtml(html));
      if (htmlTextCode) {
        return this.normalizeCode(htmlTextCode);
      }
    }

    return null;
  }

  /**
   * 从主题中提取验证码
   * xAI 主题示例:
   * - "Y52-NG6 xAI confirmation code"
   * - "Your xAI confirmation code: ABC12-DEF34"
   * - "Confirm your xAI account - XYZ789-ABC123"
   */
  extractFromSubject(subject) {
    if (!subject) return null;

    // 匹配主题开头的验证码格式
    const startMatch = subject.match(/^([A-Z0-9]{2,5}[-–—][A-Z0-9]{2,5})\b/i);
    if (startMatch) {
      return startMatch[1].toUpperCase();
    }

    // 匹配主题中任何位置的验证码
    const anyMatch = subject.match(/\b([A-Z0-9]{2,5}[-–—][A-Z0-9]{2,5})\b/i);
    if (anyMatch) {
      return anyMatch[1].toUpperCase();
    }

    return null;
  }

  /**
   * 从 HTML 中提取验证码
   * xAI HTML 格式: 验证码在 <td style="background: #FAFAFA; ...font-size: 26px; font-weight: bold;">
   */
  extractFromHtml(html) {
    if (!html) return null;

    // 匹配 xAI 特定的表格单元格格式
    // 1. 查找灰色背景的单元格
    const grayCellPattern = /<td[^>]*style=["'][^"']*background:\s*#FAFAFA[^"']*["'][^>]*>(.*?)<\/td>/is;
    const grayMatch = html.match(grayCellPattern);
    if (grayMatch && grayMatch[1]) {
      const cellContent = grayMatch[1].replace(/<[^>]+>/g, '').trim();
      const codeMatch = cellContent.match(/^([A-Z0-9]{2,5}[-–—][A-Z0-9]{2,5})$/i);
      if (codeMatch) {
        return codeMatch[1].toUpperCase();
      }
    }

    // 2. 查找大字体加粗的文本（26px 或更大的）
    const largeFontPattern = /<td[^>]*style=["'][^"']*font-size:\s*2[56]px[^"']*["'][^>]*>(.*?)<\/td>/is;
    const largeMatch = html.match(largeFontPattern);
    if (largeMatch && largeMatch[1]) {
      const cellContent = largeMatch[1].replace(/<[^>]+>/g, '').trim();
      const codeMatch = cellContent.match(/^([A-Z0-9]{2,5}[-–—][A-Z0-9]{2,5})$/i);
      if (codeMatch) {
        return codeMatch[1].toUpperCase();
      }
    }

    // 3. 通用匹配：查找符合格式的验证码
    const generalPattern = />([A-Z0-9]{2,5}[-–—][A-Z0-9]{2,5})</i;
    const generalMatch = html.match(generalPattern);
    if (generalMatch) {
      return generalMatch[1].toUpperCase();
    }

    return null;
  }

  /**
   * 从纯文本中提取验证码
   */
  extractFromText(text) {
    if (!text) return null;

    // 匹配独立成行的验证码
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      const codeMatch = trimmed.match(/^([A-Z0-9]{2,5}[-–—][A-Z0-9]{2,5})$/i);
      if (codeMatch) {
        return codeMatch[1].toUpperCase();
      }
    }

    // 匹配文本中任何位置的验证码
    const anyMatch = text.match(/\b([A-Z0-9]{2,5}[-–—][A-Z0-9]{2,5})\b/i);
    if (anyMatch) {
      return anyMatch[1].toUpperCase();
    }

    return null;
  }

  /**
   * 清理 xAI 验证码
   * 统一连字符格式，转为大写
   */
  normalizeCode(code) {
    if (!code) return null;
    // 统一使用标准连字符，转大写
    const normalized = code
      .replace(/[–—]/g, '-')
      .toUpperCase()
      .trim();
    // 验证格式
    if (/^[A-Z0-9]{2,5}-[A-Z0-9]{2,5}$/.test(normalized)) {
      return normalized;
    }
    return null;
  }
}
