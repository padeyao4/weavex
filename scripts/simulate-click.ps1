<#
.SYNOPSIS
  在真实桌面上模拟鼠标点击（AI 虚拟桌面 GUI 与真实桌面隔离，用本脚本操作真实桌面）

.DESCRIPTION
  通过 user32 SetCursorPos + mouse_event 在真实桌面模拟点击。
  注意：会真实移动用户鼠标，操作前请提示用户。

.PARAMETER X / Y
  点击位置（物理像素坐标，可用 capture-screen.ps1 截图后从图像中读取）

.PARAMETER Button
  left（左键，默认）/ right（右键，用于弹出上下文菜单，如托盘菜单）

.PARAMETER HoldMs
  按下到松开之间的间隔毫秒（默认 100）

.EXAMPLE
  .\simulate-click.ps1 -X 2315 -Y 1417
  .\simulate-click.ps1 -X 2315 -Y 1417 -Button right
#>
param(
  [Parameter(Mandatory = $true)][int]$X,
  [Parameter(Mandatory = $true)][int]$Y,
  [ValidateSet("left", "right")][string]$Button = "left",
  [int]$HoldMs = 100
)

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class SimClick {
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint flags, uint dx, uint dy, uint data, UIntPtr extra);
  public const uint LEFTDOWN = 0x0002, LEFTUP = 0x0004, RIGHTDOWN = 0x0008, RIGHTUP = 0x0010;
}
"@

$down = if ($Button -eq "left") { [SimClick]::LEFTDOWN } else { [SimClick]::RIGHTDOWN }
$up   = if ($Button -eq "left") { [SimClick]::LEFTUP }   else { [SimClick]::RIGHTUP }

[SimClick]::SetCursorPos($X, $Y) | Out-Null
Start-Sleep -Milliseconds 150
[SimClick]::mouse_event($down, 0, 0, 0, [UIntPtr]::Zero)
Start-Sleep -Milliseconds $HoldMs
[SimClick]::mouse_event($up, 0, 0, 0, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 100
Write-Output "CLICKED $Button @ ($X,$Y)"
