/**
 * 验证码提取适配器工厂
 * 根据发件人信息选择合适的适配器提取验证码
 * @module email/adapters
 */

import { XaiAdapter } from './xai-adapter.js';
import { DefaultAdapter } from './default-adapter.js';
import {
  GitHubAdapter,
  GoogleAdapter,
  AWSAdapter,
  AppleAdapter,
  MicrosoftAdapter,
  WeChatAdapter,
} from './common-adapter.js';

/**
 * 适配器注册表
 * 按优先级排序，优先级数字越小越优先
 */
const ADAPTERS = [
  new XaiAdapter(),           // xAI/Grok - 优先级 10
  new GitHubAdapter(),        // GitHub - 优先级 20
  new GoogleAdapter(),        // Google - 优先级 20
  new AWSAdapter(),           // AWS - 优先级 25
  new AppleAdapter(),         // Apple - 优先级 25
  new MicrosoftAdapter(),     // Microsoft - 优先级 25
  new WeChatAdapter(),        // 微信 - 优先级 30
  new DefaultAdapter(),       // 默认兜底 - 优先级 999
];

/**
 * 提取发件人域名
 * @param {string} from - 发件人地址
 * @returns {string} 域名
 */
function extractDomain(from) {
  if (!from) return '';
  const match = String(from).match(/@([^@\s>]+)$/);
  return match ? match[1].toLowerCase() : '';
}

/**
 * 提取发件人邮箱（去除显示名称）
 * @param {string} from - 发件人字段
 * @returns {string} 纯邮箱地址
 */
function extractEmailAddress(from) {
  if (!from) return '';
  // 匹配 <email> 格式或纯 email
  const match = String(from).match(/<([^@\s>]+@[^@\s>]+)>|^([^@\s>]+@[^@\s>]+)$/);
  return match ? (match[1] || match[2]) : from;
}

/**
 * 根据邮件内容选择合适的适配器并提取验证码
 * @param {object} params - 邮件参数
 * @param {string} params.from - 发件人（可以是 "name <email>" 或纯 email）
 * @param {string} params.subject - 邮件主题
 * @param {string} params.text - 纯文本内容
 * @param {string} params.html - HTML内容
 * @returns {string} 提取的验证码，如果未找到返回空字符串
 */
export function extractVerificationCode(params = {}) {
  const from = extractEmailAddress(params.from || '');
  const fromDomain = extractDomain(from);

  const enrichedParams = {
    from,
    fromDomain,
    subject: String(params.subject || ''),
    text: String(params.text || ''),
    html: String(params.html || ''),
  };

  // 按优先级遍历适配器
  for (const adapter of ADAPTERS) {
    if (adapter.canHandle(enrichedParams)) {
      const code = adapter.extract(enrichedParams);
      if (code) {
        console.log(`[${adapter.getName()}] Extracted verification code: ${code}`);
        return code;
      }
    }
  }

  return '';
}

/**
 * 注册新的适配器
 * @param {BaseVerificationAdapter} adapter - 适配器实例
 */
export function registerAdapter(adapter) {
  if (!adapter.canHandle || !adapter.extract) {
    throw new Error('Adapter must implement canHandle() and extract() methods');
  }
  ADAPTERS.push(adapter);
  // 按优先级重新排序
  ADAPTERS.sort((a, b) => a.getPriority() - b.getPriority());
}

/**
 * 获取所有已注册的适配器
 * @returns {Array} 适配器列表
 */
export function getAdapters() {
  return [...ADAPTERS];
}

// 导出适配器类供外部扩展使用
export { BaseVerificationAdapter } from './base-adapter.js';
export { XaiAdapter } from './xai-adapter.js';
export { DefaultAdapter } from './default-adapter.js';
export {
  GitHubAdapter,
  GoogleAdapter,
  AWSAdapter,
  AppleAdapter,
  MicrosoftAdapter,
  WeChatAdapter,
} from './common-adapter.js';
