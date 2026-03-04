# 验证码提取适配器系统

## 概述

适配器模式用于根据不同发件人自动选择最佳策略提取验证码。

## 架构

```
adapters/
├── base-adapter.js      # 基础适配器接口
├── xai-adapter.js       # xAI/Grok 专用适配器
├── common-adapter.js    # 常用服务适配器 (GitHub, Google, AWS, etc.)
├── default-adapter.js   # 默认通用适配器
└── index.js             # 工厂/路由器
```

## 已支持的服务

| 服务 | 域名 | 验证码格式 |
|------|------|-----------|
| xAI/Grok | x.ai | XXX-XXXX |
| GitHub | github.com | 6-8位数字 |
| Google | google.com | 6位数字 |
| AWS | amazon.com | 6位数字 |
| Apple | apple.com | 6位数字 |
| Microsoft | microsoft.com | 7位数字 |
| 微信 | qq.com | 4-8位数字 |

## 如何添加新适配器

```javascript
import { BaseVerificationAdapter } from './base-adapter.js';

class MyServiceAdapter extends BaseVerificationAdapter {
  static DOMAINS = ['example.com'];

  canHandle(params) {
    const { fromDomain = '' } = params;
    return fromDomain.endsWith('example.com');
  }

  getPriority() {
    return 50; // 数字越小优先级越高
  }

  extract(params) {
    const { subject, html, text } = params;
    // 实现你的提取逻辑
    const match = subject.match(/CODE:\s*(\w+)/);
    return match ? match[1] : null;
  }
}

// 在 index.js 中注册
import { MyServiceAdapter } from './my-service-adapter.js';
const ADAPTERS = [
  // ... 其他适配器
  new MyServiceAdapter(),
];
```

## 优先级规则

- 1-19: 专属服务 (如 xAI)
- 20-49: 常用大厂
- 50-99: 行业服务
- 100+: 默认/兜底
