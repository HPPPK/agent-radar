# Agent Radar

Agent Radar 把每日 Agent 技术更新和 GitHub Trending 整理成一份既保留专业术语、又提供大白话解释的技术简报。

> **独立项目声明：**Agent Radar 由独立开发者 Jingyu Pan 开发，与 OpenAI、GitHub、Anthropic、Google、Microsoft、腾讯或被引用项目不存在隶属、赞助或官方背书关系。

## 当前发布边界

首个公开版本按低数据、低风险模式设计：

- 免费、开源、只读；
- 不要求用户注册；
- 不提供支付、广告或赞助排名；
- 不访问私人 GitHub、邮箱、联系人或文件；
- MCP 服务只查询预先发布的日报，不在服务端实时调用大模型；
- 不主动保存完整聊天记录或 MCP 请求正文；
- 每条内容保留来源类型、来源链接、检查状态和人工复核状态。

公开部署仍需由运营者根据服务器所在地完成域名、备案、HTTPS、隐私与安全配置。本仓库不会帮助规避平台地区、身份验证或访问限制。

## 用户可以做什么

- 查看最新或历史 Agent + GitHub 日报；
- 按工具、主题和用途搜索 Agent 更新；
- 了解 GitHub 项目是什么、能做什么、适合谁；
- 用大白话解释 MCP、RAG、Agent Harness、Telemetry、Skills 等术语；
- 通过只读 MCP 工具或网页查看相同的结构化日报。

## 内容透明度

日报中的部分摘要由 AI 辅助整理。数据中的以下字段用于避免把“有来源”误写成“已人工核实”：

- `source_type`：官方 Release、官方 Commit、GitHub Trending 等来源类型；
- `source_url` / `url`：原始来源；
- `source_checked_at`：最近一次来源可达性检查时间；
- `source_check_status`：检查结果只表示链接或 API 可达，不代表所有描述均已事实核验；
- `ai_assisted`：是否经过 AI 辅助；
- `human_reviewed`：是否完成逐条人工复核。

默认示例数据明确标记为 `human_reviewed: false`，不会虚构人工审核。重要决定请回到原始来源确认。详细规则见 [数据来源政策](docs/DATA-SOURCE-POLICY.md)。

## 目录

- `.codex-plugin/plugin.json`：Codex 插件元数据；
- `skills/agent-radar/SKILL.md`：回答风格和证据边界；
- `.mcp.json`：远程 MCP 连接模板；
- `server/`：Express、MCP Server 和只读网页；
- `scripts/publish_digest.py`：发布已经验证结构的日报 JSON；
- `scripts/package_plugin.py`：生成不含密钥和依赖目录的插件 ZIP；
- `scripts/security_audit.py`：发布前秘密与合规文件检查；
- `PRIVACY.md`、`TERMS.md`、`SECURITY.md`：隐私、条款和漏洞报告；
- `THIRD_PARTY_NOTICES.md`：运行时依赖许可证清单。

## 本地开发

```powershell
cd server
npm ci
npm run check
$env:ADMIN_API_KEY = "local-development-key"
$env:PUBLIC_BASE_URL = "http://localhost:8080"
npm run dev
```

打开 `http://localhost:8080`。MCP Endpoint 为 `http://localhost:8080/mcp`。

## 发布前检查

```powershell
python scripts/security_audit.py
cd server
npm audit --omit=dev --audit-level=high
npm run check
cd ..
python scripts/package_plugin.py
```

如果部署到中国大陆公网服务器，请先完成适用的备案和公开运营准备。部署说明见 [DEPLOY.md](DEPLOY.md)，第一阶段状态见 [合规清单](docs/COMPLIANCE-CHECKLIST.md)。

## 邮件订阅

当前仓库不开放公众订阅，也不包含 SMTP 授权码。未来订阅功能必须采用主动订阅、确认和一键退订流程，设计见 [EMAIL-SUBSCRIPTION-DESIGN.md](docs/EMAIL-SUBSCRIPTION-DESIGN.md)。

## 许可证

Apache License 2.0。参见 [LICENSE](LICENSE) 和 [NOTICE](NOTICE)。第三方依赖仍遵循各自许可证。
