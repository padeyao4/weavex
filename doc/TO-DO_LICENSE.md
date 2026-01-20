# TO-DO: 许可与发布准备（Weavex）

下面是为完成 Weavex 授权与发布所需的事项清单。你可以按优先级逐项处理，我也可以代为修改对应文件（在你确认内容/占位值后）。每项包含目标、建议操作、关联文件/命令与优先级。

---

## 1. 填写并确认 LICENSE.md 的占位信息（必须）
- 目标：把 `LICENSE.md` 中的占位联系信息、购买链接以及司法辖区替换为正式信息。
- 操作：
  - 替换 `your-contact@example.com` 为你的官方联系邮箱。
  - 替换 `https://example.com/buy-weavex` 为实际购买/展示页面（或临时指向 GitHub Releases / Stripe Checkout 页面）。
  - 在 “适用法律与争议解决” 部分指定司法辖区（例如 `中华人民共和国` 或 `英国` 等）。
- 相关文件：`possible/LICENSE.md`
- 优先级：高
- 建议执行命令（示例，仅作说明）：手工编辑文件或使用编辑器打开并替换。

---

## 2. 在 README 顶部与 About 页面显示短声明（建议立即完成）
- 目标：在用户可见位置明确告知“个人免费；商业需购”。
- 操作：
  - 在 `possible/README.md` 顶部加入短声明（中/英双语）。
  - 在应用 About 窗口或安装界面加入同样说明。
- 相关文件：`possible/README.md`，应用的 About/窗口代码（例如 `src/components/About.vue` 或等效文件）
- 推荐文案：
  - 英文：`Weavex — Free for personal use. Commercial use requires a paid license.`
  - 中文：`Weavex — 个人免费使用；商业使用需购买许可证。`
- 优先级：高

---

## 3. 在 `package.json` 添加 license 字段（方便识别）
- 目标：使包管理器/用户能迅速知道许可信息。
- 操作：在 `possible/package.json` 顶级添加：
  - `"license": "SEE LICENSE IN LICENSE.md"`
- 相关文件：`possible/package.json`
- 优先级：中

---

## 4. 商业许可证模板（创建 `COMMERCIAL_LICENSE_TEMPLATE.md`）
- 目标：准备一份商业许可合同草案，用于与客户/企业签约时引用。
- 操作：
  - 生成包含：授权范围（seat-based / site license / enterprise）、费用、支持 SLA、续费/终止、保密条款、担保/责任限制、支付条款、适用法律与争议解决。
  - 保留可修改的占位字段（价格、联系人、期限）。
- 相关文件：`possible/COMMERCIAL_LICENSE_TEMPLATE.md`
- 优先级：中高
- 建议：请律师审阅文本后定稿。

---

## 5. 第三方依赖许可证合规检查（确认商业可用性）
- 目标：确保项目中第三方库的许可证允许你在商业环境中分发/使用。
- 操作：
  - 运行依赖许可扫描工具（例如 `license-checker`, `licensee`, `npm-license-crawler` 等）或手动检查 `package.json` 依赖的许可证。
  - 列出可能限制商业分发的依赖（如 GPL/AGPL 条款）并评估替换或获得例外的必要性。
- 相关文件：`possible/package.json`
- 优先级：高（在正式商业化前必须完成）
- 建议命令（本地运行）：
  - `npx license-checker --json > license-report.json`（示例）

---

## 6. 图标与打包配置确认（影响桌面发行）
- 目标：确保 Tauri 打包时图标、productName、identifier 等信息完整正确。
- 操作：
  - 在 `possible/src-tauri/icons` 中准备必要尺寸的图标（ico、icns、PNG 多尺寸）。
  - 确认 `possible/src-tauri/tauri.conf.json` 中 `productName`、`identifier`、`app.windows[0].title` 显示为 `Weavex` 与你的规范 `identifier`（建议使用 `com.<yourname>.weavex`）。
- 相关文件：`possible/src-tauri/icons/*`，`possible/src-tauri/tauri.conf.json`
- 优先级：中

---

## 7. 域名 / 商标 / GitHub 名称可用性（品牌保护）
- 目标：确认域名与品牌是否可注册/使用，避免侵权。
- 操作：
  - 查询域名（`weavex.com`, `weavex.dev` 等）是否可用并考虑注册。
  - 做基础商标检索（根据目标市场）。
  - 考虑在 GitHub 使用 `weavex` 作为仓库名或组织名（注意 `github.com/weavex` 已被占用，考虑 `weavex-app` / `weavex-desktop`）。
- 优先级：中（发布前建议完成）
- 备注：需要外部网络/服务查询（我可以帮你整理要检查的列表，但你需要用域名注册服务或商标律师完成注册/核查）。

---

## 8. 支付 / 购买流程与许可证发放（实现商业化）
- 目标：构建商业许可证的购买与交付流程。
- 操作选项：
  - 使用第三方支付（Stripe / Paddle / Gumroad）并在购买后自动生成并发放商业许可证密钥/合同 PDF。
  - 或手动邮件/合同签署（适合早期 B2B 客户）。
- 任务：
  - 设计购买页（URL 填入 `LICENSE.md` 中）。
  - 决定许可证交付方式（自动 key + 验证后放行或人工审批）。
  - 设计许可证格式（PDF / JSON license key + 公私钥签名等）。
- 相关路径：网站/购买页（外部），或 `docs/licensing.md`
- 优先级：高（若准备对外销售）

---

## 9. 强制与合规提示（在应用内提示与条款）
- 目标：应用应在安装/首次运行、关于页或设置中提醒用户许可条款。
- 操作：
  - 在安装界面或 About 窗口放置短声明和 `LICENSE.md` 链接。
  - 在首次运行弹窗中要求用户确认接受许可（选项：个人 / 组织并提示商业联系）。
- 相关文件：`src` 中的 UI 组件（About、Installer 脚本）
- 优先级：中

---

## 10. CI / 发布脚本与元数据（便于发布）
- 目标：在打包/发布流程中包含许可文件并正确设置元数据。
- 操作：
  - CI 在构建/发布前检查 `LICENSE.md` 存在并将其打包到安装包中。
  - 在 `package.json` 填写 `author`, `repository`, `homepage`, `license` 字段。
  - 在 Release notes 中列明许可条款变化（若有）。
- 相关文件：`.github/workflows/*`（若有），`possible/package.json`
- 优先级：中

---

## 11. 准备商业许可证合同签署模板（法律文件）
- 目标：准备可用于签署/发送给商业客户的合同版本（PDF/Word）。
- 操作：
  - 基于 `COMMERCIAL_LICENSE_TEMPLATE.md` 生成可供签署的 PDF/Word 文档。
  - 在合同中插入可替换字段（公司名、授权范围、价格、有效期、签署方）。
- 优先级：中高
- 建议：请律师最终审定。

---

## 12. 日志与追踪（用于执法与支持）
- 目标：在必要时能够核实用户使用情况（但注意隐私）。
- 操作建议（可选）：
  - 对商业许可证引入唯一 license key 与基础激活/验证接口（若自动化交付）。
  - 记录购买记录与激活设备数（遵守隐私法律与 GDPR）。
- 优先级：低到中（如果选择自动许可证系统则为高）
- 注意：实现前请评估数据隐私要求与合规风险。

---

## 13. 文档与客户支持（商业用户体验）
- 目标：为商业用户提供专门文档与支持渠道。
- 操作：
  - 创建 `docs/licensing.md` 说明许可差异、购买流程、联系方式、退费政策（若有）。
  - 设置商业支持邮箱（单独于普通 issues）。
- 优先级：中

---

## 14. 发行前最终检查列表（发布前必须完成）
- [ ] `LICENSE.md` 占位信息替换为真实联系方式与购买页
- [ ] `package.json` 添加 `license` 字段并确认 `author`/`repository`/`homepage`
- [ ] 第三方依赖许可证检查完成并无冲突
- [ ] 商业许可证模板草案准备并法律审定（如进行）
- [ ] 打包图标与 `tauri.conf.json` 中的 `identifier` 与 `productName` 确认
- [ ] README、About 页面、安装界面加入短声明
- [ ] 购买/发放流程（自动或手动）设计与测试完毕
- [ ] 域名/商标基础检查（建议完成）
- [ ] CI 流程包含许可文件并在发布产物中保留 `LICENSE.md`

---

## 分配建议与时间估计（示例）
- 法律/合同审阅：律师 1–2 周（取决于沟通与修改）
- 依赖许可检查：工程师 1–2 天
- README/ABOUT/README 修改：工程师 0.5 天
- 商业购买页与许可证自动化（基础版本）：开发 3–7 天（取决集成服务）
- 打包/图标确认：工程师 0.5–1 天

---

## 我可以帮你做的具体改动（请明确选项）
- A. 直接把 `LICENSE.md` 中占位项替换为你的邮箱与购买 URL（请提供邮箱与 URL）  
- B. 在 `package.json` 中添加 `license` 字段并更新 `author`/`repository`（请提供值）  
- C. 生成 `COMMERCIAL_LICENSE_TEMPLATE.md` 初稿并放入仓库  
- D. 运行依赖许可证扫描并输出报告（需要你在本地运行或允许我联网执行）  
- E. 在 `README.md` 顶部加入短声明并在 About 组件中加入提示（请指定 About 组件路径或让我搜索）

---

如果你现在就要我做某一项，请直接回复：
- 要做的选项字母（例如 `A` 或 `B`），并提供必要的占位替换值（邮箱、购买 URL、`identifier` 的反向域名，例如 `com.alice.weavex` 等）。我会基于你提供的信息着手修改对应文件。