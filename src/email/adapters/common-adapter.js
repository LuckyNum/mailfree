/**
 * 常用服务验证码提取适配器
 * 支持 GitHub、Google、AWS、Apple 等主流服务
 * @module email/adapters/common-adapter
 */

import { BaseVerificationAdapter } from './base-adapter.js';
import { stripHtml } from '../parser.js';

/**
 * GitHub 验证码适配器
 */
class GitHubAdapter extends BaseVerificationAdapter {
  static DOMAINS = ['github.com', 'noreply.github.com'];

  canHandle(params) {
    const { fromDomain = '' } = params;
    const domain = fromDomain.toLowerCase();
    return GitHubAdapter.DOMAINS.some(d => domain === d || domain.endsWith('.' + d));
  }

  getPriority() {
    return 20;
  }

  extract(params) {
    const { subject = '', html = '', text = '' } = params;

    // GitHub 验证码通常是 6-8 位数字
    // 主题格式: "[GitHub] Your verification code is 123456"
    const subjectMatch = subject.match(/\b(\d{6,8})\b/);
    if (subjectMatch) return subjectMatch[1];

    // 正文中查找验证码
    const bodyText = text || stripHtml(html);
    const patterns = [
      /verification code[:\s]+(\d{6,8})/i,
      /Your code is[:\s]+(\d{6,8})/i,
      /Enter the following code[:\s]+(\d{6,8})/i,
    ];

    for (const pattern of patterns) {
      const match = bodyText.match(pattern);
      if (match) return match[1];
    }

    return null;
  }
}

/**
 * Google 验证码适配器
 */
class GoogleAdapter extends BaseVerificationAdapter {
  static DOMAINS = ['google.com', 'gmail.com', 'accounts.google.com', 'gstatic.com'];

  canHandle(params) {
    const { fromDomain = '' } = params;
    const domain = fromDomain.toLowerCase();
    return GoogleAdapter.DOMAINS.some(d => domain === d || domain.endsWith('.' + d));
  }

  getPriority() {
    return 20;
  }

  extract(params) {
    const { subject = '', html = '', text = '' } = params;

    // Google 验证码通常是 6 位数字
    // 主题格式: "G-123456 is your Google verification code"
    const gCodeMatch = subject.match(/G-(\d{6})\b/);
    if (gCodeMatch) return gCodeMatch[1];

    // 直接在主题中查找 6 位数字
    const subjectMatch = subject.match(/\b(\d{6})\b/);
    if (subjectMatch) return subjectMatch[1];

    const bodyText = text || stripHtml(html);
    const patterns = [
      /verification code[:\s]+(\d{6})/i,
      /Your code is[:\s]+(\d{6})/i,
      /Enter[:\s]+(\d{6})/i,
    ];

    for (const pattern of patterns) {
      const match = bodyText.match(pattern);
      if (match) return match[1];
    }

    return null;
  }
}

/**
 * AWS 验证码适配器
 */
class AWSAdapter extends BaseVerificationAdapter {
  static DOMAINS = ['amazon.com', 'amazonwebservices.com', 'aws.amazon.com'];

  canHandle(params) {
    const { fromDomain = '' } = params;
    const domain = fromDomain.toLowerCase();
    return AWSAdapter.DOMAINS.some(d => domain === d || domain.endsWith('.' + d));
  }

  getPriority() {
    return 25;
  }

  extract(params) {
    const { subject = '', html = '', text = '' } = params;

    // AWS 验证码通常是 6 位数字
    // 主题格式: "Your AWS verification code is 123456"
    const patterns = [
      /verification code[:\s]+(\d{6})/i,
      /Your code[:\s]+(\d{6})/i,
      /\b(\d{6})\b.*AWS/i,
    ];

    for (const pattern of patterns) {
      const match = subject.match(pattern);
      if (match) return match[1];
    }

    const bodyText = text || stripHtml(html);
    for (const pattern of patterns) {
      const match = bodyText.match(pattern);
      if (match) return match[1];
    }

    return null;
  }
}

/**
 * Apple 验证码适配器
 */
class AppleAdapter extends BaseVerificationAdapter {
  static DOMAINS = ['apple.com', 'icloud.com'];

  canHandle(params) {
    const { fromDomain = '' } = params;
    const domain = fromDomain.toLowerCase();
    return AppleAdapter.DOMAINS.some(d => domain === d || domain.endsWith('.' + d));
  }

  getPriority() {
    return 25;
  }

  extract(params) {
    const { subject = '', html = '', text = '' } = params;

    // Apple 验证码通常是 6 位数字
    // 主题格式: "Your Apple ID verification code is 123456"
    const patterns = [
      /verification code[:\s]+(\d{6})/i,
      /code is[:\s]+(\d{6})/i,
    ];

    for (const pattern of patterns) {
      const match = subject.match(pattern);
      if (match) return match[1];
    }

    const bodyText = text || stripHtml(html);
    for (const pattern of patterns) {
      const match = bodyText.match(pattern);
      if (match) return match[1];
    }

    return null;
  }
}

/**
 * Microsoft 验证码适配器
 */
class MicrosoftAdapter extends BaseVerificationAdapter {
  static DOMAINS = ['microsoft.com', 'live.com', 'outlook.com', 'hotmail.com'];

  canHandle(params) {
    const { fromDomain = '' } = params;
    const domain = fromDomain.toLowerCase();
    return MicrosoftAdapter.DOMAINS.some(d => domain === d || domain.endsWith('.' + d));
  }

  getPriority() {
    return 25;
  }

  extract(params) {
    const { subject = '', html = '', text = '' } = params;

    // Microsoft 验证码通常是 7 位数字（如：1234567）
    const patterns = [
      /code[:\s]+(\d{7})/i,
      /security code[:\s]+(\d{7})/i,
    ];

    for (const pattern of patterns) {
      const match = subject.match(pattern);
      if (match) return match[1];
    }

    const bodyText = text || stripHtml(html);
    for (const pattern of patterns) {
      const match = bodyText.match(pattern);
      if (match) return match[1];
    }

    return null;
  }
}

/**
 * 微信 验证码适配器
 */
class WeChatAdapter extends BaseVerificationAdapter {
  static DOMAINS = ['qq.com', 'wechat.com', 'weixin.qq.com'];

  canHandle(params) {
    const { fromDomain = '' } = params;
    const domain = fromDomain.toLowerCase();
    return WeChatAdapter.DOMAINS.some(d => domain === d || domain.endsWith('.' + d));
  }

  getPriority() {
    return 30;
  }

  extract(params) {
    const { subject = '', html = '', text = '' } = params;

    // 微信验证码关键词: 验证码、登录验证码、安全验证码
    const bodyText = text || stripHtml(html);
    const patterns = [
      /验证码[：:]\s*(\d{4,8})/,
      /登录验证码[：:]\s*(\d{4,8})/,
      /安全验证码[：:]\s*(\d{4,8})/,
      /\b(\d{6})\b.*验证码/,
    ];

    for (const pattern of patterns) {
      const match = bodyText.match(pattern);
      if (match) return match[1];
    }

    return null;
  }
}

// 导出所有常用服务适配器
export {
  GitHubAdapter,
  GoogleAdapter,
  AWSAdapter,
  AppleAdapter,
  MicrosoftAdapter,
  WeChatAdapter,
};
