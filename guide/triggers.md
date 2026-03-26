---
title: 触发词与消息路由
description: AeroLoongClaw 如何匹配和路由用户消息
---

# 触发词与消息路由

AeroLoongClaw 通过触发词机制来决定是否响应一条消息。理解这套机制有助于正确配置助手名称、处理群聊与私聊的差异化行为，以及按需调整触发灵敏度。

## 触发词匹配规则

### 默认触发词

默认触发词为 **`@Andy`**（区分大小写不敏感）。系统内部将其编译为正则表达式：

```typescript
// src/config.ts:444
export const TRIGGER_PATTERN = new RegExp(`^@${escapeRegex(ASSISTANT_NAME)}\\b`, 'i');
```

生成的正则等价于 `/^@Andy\b/i`。

### 关键约束：必须出现在消息开头

::: warning 触发词必须位于消息起始位置
消息在匹配之前会先执行 `trim()`，因此消息前缀的空白字符会被忽略。但触发词本身**必须出现在消息的最前面**，即消息的第一个非空白字符必须是 `@助手名`。

以下消息**可以**触发响应：

- `@Andy 你好`
- `@andy 帮我查一下状态`
- `  @Andy 发送报告` （trim 后等同于 `@Andy 发送报告`）

以下消息**不会**触发响应：

- `你好 @Andy` （触发词在消息中间）
- `@Andyextra hello` （中间无空白，触发词是 `@Andyextra`）
- `Hi Andy, help me` （没有 `@` 前缀）
:::

### `requiresTrigger` 分组选项

每个注册群组可以独立设置 `requiresTrigger` 标志：

- **`requiresTrigger: true`**（默认）：该群组的消息必须匹配触发词才会被处理
- **`requiresTrigger: false`**：消息无需匹配触发词，所有消息都会被路由处理

Web UI 测试会话和首次企业微信私聊默认 `requiresTrigger: false`，以降低使用门槛。

## `ASSISTANT_HAS_OWN_NUMBER` 的行为差异

`.env` 中的 `ASSISTANT_HAS_OWN_NUMBER` 控制助手是否拥有独立电话号码（或其他唯一标识）：

| 值 | 行为 |
|---|---|
| `ASSISTANT_HAS_OWN_NUMBER=true` | 助手发送的消息会被渠道平台正确标记为"来自我"，无需额外区分 |
| `ASSISTANT_HAS_OWN_NUMBER=false`（默认） | 助手与用户共享同一号码/身份，需要在消息前加触发词来区分哪些是助手发出的 |

```bash
# 修改 .env
ASSISTANT_NAME=Rainbow
ASSISTANT_HAS_OWN_NUMBER=true
```

修改后需要重启服务：`npm run service:stop && npm run service:install`（或对应的平台重启命令）。

## 私聊 vs 群聊的触发逻辑

### 企业微信私聊（WeCom DM）

私聊消息的触发检测有**三个并列条件**，满足任意一个即触发：

1. **`hasStructuredMention`**：消息的 mentions 字段中包含助手名称（企业微信平台结构化提及）
2. **`isAgentMentioned()`**：消息内容中包含 `@助手名`（按单词边界匹配）
3. **`TRIGGER_PATTERN.test()`**：消息以触发词开头

```typescript
// src/index.ts:409-418
if (msg.chat_jid.startsWith('wecom:')) {
  const hasStructuredMention = (msg.mentions ?? []).some(
    (mention) => mention.trim().toLowerCase() === ASSISTANT_NAME.toLowerCase(),
  );
  return (
    hasStructuredMention ||
    isAgentMentioned(msg.content, ASSISTANT_NAME) ||
    TRIGGER_PATTERN.test(msg.content.trim())
  );
}
```

### 非 WeCom 渠道私聊（Web UI 等）

仅使用 `TRIGGER_PATTERN.test(msg.content.trim())`，即触发词必须出现在消息开头。

### 企业微信群聊（WeCom Group）

默认**安静模式**：只在明确 `@` 助手时才响应。触发逻辑与私聊相同（三个条件并列），但平台语义上强调"被提及"这个动作。

### 其他群聊（Web UI Group）

仅 `TRIGGER_PATTERN.test(msg.content.trim())`。

## `event.enter_chat` 欢迎消息

企业微信通道在用户**首次进入私聊会话**时，会触发 `event.enter_chat` 事件，系统自动发送一条内置欢迎消息：

> "你好！我是 Andy，你可以让我帮你处理各种任务。试试发送「/skill」查看可用技能，或直接告诉我你需要什么。"

欢迎消息包含三个引导性操作建议，让新用户快速了解助手能力。

::: tip 欢迎消息仅发送一次
`event.enter_chat` 在每个新会话建立时触发一次，不会重复发送。如果需要重新发送欢迎消息，需要结束当前会话并重新建立。
:::

## 如何修改触发词

### 步骤 1：编辑 `.env`

```bash
# 找到或添加 ASSISTANT_NAME 行
ASSISTANT_NAME=YourNewName
```

### 步骤 2：重启服务

```bash
# Linux (systemd)
systemctl --user restart aeroloongclaw

# macOS (launchd)
launchctl kickstart -k gui/$(id -u)/com.aeroloongclaw
```

### 注意事项

- 触发词修改后，正则表达式的单词边界 `\b` 仍然生效，因此 `Rainbow` 和 `RainbowExtra` 不会被混淆
- 触发词支持中文、emoji 等字符，正则转义由 `escapeRegex()` 函数处理
- 企业微信群聊中，如果用户在消息中 `@YourNewName` 但未使用新触发词，系统仍能通过 `isAgentMentioned()` 正确识别（因为它检查 mentions 字段和 `@助手名` 模式）
