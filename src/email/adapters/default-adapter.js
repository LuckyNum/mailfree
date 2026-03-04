/**
 * 默认验证码提取适配器
 * 通用验证码提取逻辑，处理标准格式的验证码邮件
 * @module email/adapters/default-adapter
 */

import { BaseVerificationAdapter } from './base-adapter.js';
import { stripHtml } from '../parser.js';

export class DefaultAdapter extends BaseVerificationAdapter {
  /**
   * 默认适配器处理所有邮件（兜底）
   */
  canHandle() {
    return true;
  }

  /**
   * 默认适配器优先级最低
   */
  getPriority() {
    return 999;
  }

  /**
   * 提取验证码 - 原有的通用逻辑
   */
  extract(params) {
    const { subject = '', text = '', html = '' } = params;

    const subjectText = String(subject || '');
    const textBody = String(text || '');
    const htmlBody = stripHtml(html);

    const sources = {
      subject: subjectText,
      body: `${textBody} ${htmlBody}`.trim()
    };

    const minLen = 4;
    const maxLen = 8;

    function normalizeDigits(s) {
      const digits = String(s || '').replace(/\D+/g, '');
      if (digits.length >= minLen && digits.length <= maxLen) return digits;
      return '';
    }

    const kw = '(?:verification|one[-\\s]?time|two[-\\s]?factor|2fa|security|auth|login|confirm|code|otp|验证码|校验码|驗證碼|確認碼|認證碼|認証コード|인증코드|코드)';
    const sepClass = "[\\u00A0\\s\\-–—_.·•∙‧'']";
    const codeChunk = `([0-9](?:${sepClass}?[0-9]){3,7})`;

    const subjectOrdereds = [
      new RegExp(`${kw}[^\n\r\d]{0,20}(?<!\\d)${codeChunk}(?!\\d)`, 'i'),
      new RegExp(`(?<!\\d)${codeChunk}(?!\\d)[^\n\r\d]{0,20}${kw}`, 'i'),
    ];
    for (const r of subjectOrdereds) {
      const m = sources.subject.match(r);
      if (m && m[1]) {
        const n = normalizeDigits(m[1]);
        if (n) return n;
      }
    }

    const bodyOrdereds = [
      new RegExp(`${kw}[^\n\r\d]{0,30}(?<!\\d)${codeChunk}(?!\\d)`, 'i'),
      new RegExp(`(?<!\\d)${codeChunk}(?!\\d)[^\n\r\d]{0,30}${kw}`, 'i'),
    ];
    for (const r of bodyOrdereds) {
      const m = sources.body.match(r);
      if (m && m[1]) {
        const n = normalizeDigits(m[1]);
        if (n) return n;
      }
    }

    const looseBodyOrdereds = [
      new RegExp(`${kw}[^\n\r\d]{0,80}(?<!\\d)${codeChunk}(?!\\d)`, 'i'),
      new RegExp(`(?<!\\d)${codeChunk}(?!\\d)[^\n\r\d]{0,80}${kw}`, 'i'),
    ];
    for (const r of looseBodyOrdereds) {
      const m = sources.body.match(r);
      if (m && m[1]) {
        const n = normalizeDigits(m[1]);
        if (n && !this.isLikelyNonVerificationCode(n, sources.body)) {
          return n;
        }
      }
    }

    return null;
  }

  /**
   * 判断是否不太可能是验证码
   */
  isLikelyNonVerificationCode(digits, context = '') {
    if (!digits) return true;

    const year = parseInt(digits, 10);
    if (digits.length === 4 && year >= 2000 && year <= 2099) {
      return true;
    }

    if (digits.length === 5) {
      const lowerContext = context.toLowerCase();
      if (lowerContext.includes('address') ||
        lowerContext.includes('street') ||
        lowerContext.includes('zip') ||
        lowerContext.includes('postal') ||
        /\b[a-z]{2,}\s+\d{5}\b/i.test(context)) {
        return true;
      }
    }

    const addressPattern = new RegExp(`\\b${digits}\\s+[A-Z][a-z]+(?:,|\\b)`, 'i');
    if (addressPattern.test(context)) {
      return true;
    }

    return false;
  }
}
