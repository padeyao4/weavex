# 真实桌面 GUI 验证方案

> 适用场景：AI 的虚拟桌面 GUI（截图/点击）与用户真实桌面隔离时，如何由 AI 自主完成
> 真实桌面上应用的视觉验证与操作，无需用户每次接管。

---

## 1. 背景与问题

Weavex 开发过程中，AI 助手需要验证 GUI 行为（窗口显隐、托盘交互、界面视觉等）。
但存在环境隔离：

- **AI 的截屏/点击工具（computer_use）运行在虚拟桌面**，分辨率为 1920×1080；
- **应用进程由命令行启动，运行在用户真实桌面**，分辨率 2560×1440（示例）；
- 因此 AI 在虚拟桌面中**看不到真实桌面的窗口**，也无法操作它。

过去只能由用户替 AI 完成视觉验证（"我验证一下"），效率低且打断工作流。

## 2. 解决方案原理

AI 的 **PowerShell 命令直接执行在用户真实系统**（非虚拟桌面），因此可以：

```
PowerShell 截取真实桌面（.NET System.Drawing CopyFromScreen）
        ↓
AI 用 Read 工具查看截图（确认窗口/图标/菜单等视觉状态）
        ↓
PowerShell 模拟输入（user32 SetCursorPos + mouse_event）
        ↓
再次截图确认操作结果（形成验证闭环）
```

关键点：

- **截图**：`System.Drawing.Graphics.CopyFromScreen` 截取当前交互桌面；
- **定位**：小元素（托盘图标等）通过"裁剪区域 + 放大"（NearestNeighbor）精确定位；
- **点击**：`SetCursorPos` 移动光标 + `mouse_event` 发送按下/抬起；
- **窗口操作**：`Get-Process.MainWindowHandle` 获取句柄，`PostMessage(WM_CLOSE)` 等触发应用逻辑。

## 3. 脚本清单

位于 `scripts/` 目录（PowerShell 5.1，无需额外依赖）：

| 脚本 | 用途 |
| --- | --- |
| `capture-screen.ps1` | 截取真实桌面全屏，或裁剪指定区域并放大 |
| `simulate-click.ps1` | 在真实桌面模拟左键/右键点击指定坐标 |
| `window-ops.ps1` | 按窗口标题查找窗口：查询状态 / 发 WM_CLOSE / 显示 / 隐藏 |

### 3.1 capture-screen.ps1

```powershell
# 全屏截图
.\capture-screen.ps1 -Out desktop.png

# 裁剪托盘图标区域并放大 6 倍（精确定位小图标）
.\capture-screen.ps1 -CropX 2300 -CropY 1400 -CropW 145 -CropH 35 -Scale 6 -Out tray-icons.png
```

参数：`-Out`（输出路径）、`-CropX/-CropY/-CropW/-CropH`（裁剪区域，像素）、`-Scale`（放大倍数，1-6）。

### 3.2 simulate-click.ps1

```powershell
# 左键单击
.\simulate-click.ps1 -X 2315 -Y 1417

# 右键单击（弹出托盘菜单等上下文菜单）
.\simulate-click.ps1 -X 2315 -Y 1417 -Button right
```

参数：`-X/-Y`（物理像素坐标，必填）、`-Button`（left/right）、`-HoldMs`（按下保持毫秒）。

### 3.3 window-ops.ps1

```powershell
# 查询窗口状态（PID、句柄、可见性）
.\window-ops.ps1 -Title "Weavex Dev" -Action info

# 发送关闭消息（验证"关闭进托盘"：窗口隐藏 + 进程驻留）
.\window-ops.ps1 -Title "Weavex Dev" -Action close

# 显示 / 隐藏窗口
.\window-ops.ps1 -Title "Weavex Dev" -Action show
```

参数：`-Title`（标题模糊匹配）、`-Action`（info/close/show/hide）、`-WaitMs`（等待毫秒）。

## 4. 托盘验证实录（第一版验收）

以下为系统托盘第一版（托盘图标 + 打开/退出菜单 + 关闭进托盘 + 左键唤回）
的完整自验证过程与结果：

| 步骤 | 操作 | 结果 |
| --- | --- | --- |
| 1. 编译验证 | `cargo build`（dev profile） | ✅ 编译通过，无 error |
| 2. 重启应用 | `npm run dev`（后台） | ✅ MCP 8913 拉起、dev 数据加载 1 graph |
| 3. 确认窗口 | `capture-screen.ps1` 截真实桌面 + Read | ✅ "Weavex Dev" 窗口正常显示 |
| 4. 定位托盘图标 | 裁剪右下角图标行放大 6 倍，比对 `icons/32x32.png`（红蓝 ∞） | ✅ 图标存在于屏幕 (2315, 1417) |
| 5. 关闭进托盘 | `window-ops.ps1 -Action close`（发 WM_CLOSE） | ✅ 窗口隐藏（VISIBLE True→False）、进程驻留 |
| 6. 左键唤回 | `simulate-click.ps1 -X 2315 -Y 1417` | ✅ 窗口重新显示（截图确认） |
| 7. 右键菜单 | `simulate-click.ps1 -X 2315 -Y 1417 -Button right` | ✅ 弹出菜单："打开 Weavex / 退出" |
| 8. 菜单项 | 左键点击"打开 Weavex" | ✅ 正常触发，进程无恙 |

> "退出"菜单项未实际点击（会结束应用并停止 MCP），退出行为由用户人工验证过。

## 5. 坐标换算指南

AI 查看截图时使用 0-1000 千分比坐标系；脚本使用物理像素。
换算公式（以 2560×1440 为例）：

```
像素 X = 千分比 X / 1000 × 2560
像素 Y = 千分比 Y / 1000 × 1440
```

**小元素定位法（推荐）**：不要直接在整屏图上估坐标。
1. 全屏截图；
2. 估算目标大致像素范围，用 `-Crop` + `-Scale 4~6` 裁剪放大；
3. Read 放大图，按放大图内比例反推原像素坐标：
   `像素 = CropX + (放大图内千分比 / 1000) × CropW`。

## 6. 注意事项与限制

1. **会移动用户鼠标**：模拟点击真实移动光标，操作前应提示用户；
2. **缩放/DPI**：`CopyFromScreen` 与 `SetCursorPos` 均使用物理像素，多屏/不同缩放需以
   `VirtualScreen` 为准重新计算；
3. **托盘图标位置不固定**：每次验证前重新裁剪定位，不要沿用旧坐标
   （图标顺序、折叠状态可能变化）；
4. **隐藏窗口时 MainWindowTitle 可能变空**：判断进程是否存活不要依赖标题过滤，
   直接用 `Get-Process -Name` 或记录 PID；
5. **窗口标题模糊匹配**：dev 为 "Weavex Dev"、prod 为 "Weavex"，注意区分；
6. **环境隔离前提**：PowerShell 必须运行在用户真实系统会话中，
   若命令环境与真实桌面也不通，本方案不适用（需改走用户接管）。

## 7. 托盘功能代码位置（备查）

- `src-tauri/src/lib.rs`：`setup_tray` / `show_main_window` / `on_window_event`（关闭进托盘）
- `src-tauri/Cargo.toml`：`tauri` features 含 `tray-icon`
- 托盘 ID：`weavex-tray`；菜单 ID：`open` / `quit`；窗口 label：`main`
