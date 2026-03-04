/**
 * 验证码提取器 - 基础适配器接口
 * @module email/adapters/base-adapter
 */

/**
 * 基础适配器类
 * 所有验证码提取适配器都应继承此类
 */
export class BaseVerificationAdapter {
  /**
   * 获取适配器名称
   * @returns {string} 适配器名称
   */
  getName() {
    return this.constructor.name.replace('Adapter', '').toLowerCase();
  }

  /**
   * 检查该适配器是否可以处理此邮件
   * @param {object} params - 邮件参数
   * @param {string} params.from - 发件人邮箱
   * @param {string} params.fromDomain - 发件人域名
   * @param {string} params.subject - 邮件主题
   * @param {string} params.text - 纯文本内容
   * @param {string} params.html - HTML内容
   * @returns {boolean} 是否可以处理
   */
  canHandle(params) {
    throw new Error('canHandle() must be implemented by subclass');
  }

  /**
   * 提取验证码
   * @param {object} params - 邮件参数
   * @param {string} params.from - 发件人邮箱
   * @param {string} params.fromDomain - 发件人域名
   * @param {string} params.subject - 邮件主题
   * @param {string} params.text - 纯文本内容
   * @param {string} params.html - HTML内容
   * @returns {string|null} 提取的验证码，如果未找到返回 null
   */
  extract(params) {
    throw new Error('extract() must be implemented by subclass');
  }

  /**
   * 获取适配器优先级（数字越小优先级越高）
   * @returns {number} 优先级，默认 100
   */
  getPriority() {
    return 100;
  }

  /**
   * 清理和验证提取的验证码
   * @param {string} code - 原始验证码
   * @returns {string|null} 清理后的验证码
   */
  normalizeCode(code) {
    if (!code) return null;
    const trimmed = code.trim();
    if (trimmed.length === 0) return null;
    return trimmed;
  }
}
