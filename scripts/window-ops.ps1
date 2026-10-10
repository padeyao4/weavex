<#
.SYNOPSIS
  按窗口标题查找并操作真实桌面上的应用窗口（进程/可见性查询、发送关闭、显示/隐藏）

.DESCRIPTION
  通过 Get-Process.MainWindowHandle 定位窗口（标题模糊匹配）。
  close 发送 WM_CLOSE —— 触发应用自身的关闭逻辑（如 Weavex 的"关闭进托盘"），
  并验证窗口是否隐藏、进程是否驻留。

.PARAMETER Title
  窗口标题（模糊匹配，如 "Weavex Dev"）

.PARAMETER Action
  info  —— 查询窗口状态（默认）
  close —— 发送 WM_CLOSE，随后输出窗口可见性与进程存活
  show  —— 显示并激活窗口（ShowWindow SW_SHOW）
  hide  —— 隐藏窗口（ShowWindow SW_HIDE）

.PARAMETER WaitMs
  操作后的等待毫秒数（默认 1500，给窗口事件处理留时间）

.EXAMPLE
  .\window-ops.ps1 -Title "Weavex Dev" -Action info
  .\window-ops.ps1 -Title "Weavex Dev" -Action close
#>
param(
  [Parameter(Mandatory = $true)][string]$Title,
  [ValidateSet("info", "close", "show", "hide")][string]$Action = "info",
  [int]$WaitMs = 1500
)

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WinOps {
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr hWnd, uint msg, IntPtr wp, IntPtr lp);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  public const int WM_CLOSE = 0x0010, SW_SHOW = 5, SW_HIDE = 0;
}
"@

$proc = Get-Process -ErrorAction SilentlyContinue |
  Where-Object { $_.MainWindowTitle -like "*$Title*" -and $_.MainWindowHandle -ne 0 } |
  Select-Object -First 1

if (-not $proc) {
  Write-Output "WINDOW_NOT_FOUND TITLE=[$Title]"
  exit 0
}

$hwnd = $proc.MainWindowHandle
switch ($Action) {
  "info" {
    Write-Output "PID=$($proc.Id) HWND=$hwnd TITLE=[$($proc.MainWindowTitle)] VISIBLE=$([WinOps]::IsWindowVisible($hwnd))"
  }
  "close" {
    [WinOps]::PostMessage($hwnd, [WinOps]::WM_CLOSE, [IntPtr]::Zero, [IntPtr]::Zero) | Out-Null
    Start-Sleep -Milliseconds $WaitMs
    Write-Output "WM_CLOSE_SENT VISIBLE=$([WinOps]::IsWindowVisible($hwnd)) PROC_ALIVE=$([bool](Get-Process -Id $($proc.Id) -ErrorAction SilentlyContinue))"
  }
  "show" {
    [WinOps]::ShowWindow($hwnd, [WinOps]::SW_SHOW) | Out-Null
    Start-Sleep -Milliseconds $WaitMs
    Write-Output "SW_SHOW_SENT VISIBLE=$([WinOps]::IsWindowVisible($hwnd))"
  }
  "hide" {
    [WinOps]::ShowWindow($hwnd, [WinOps]::SW_HIDE) | Out-Null
    Start-Sleep -Milliseconds $WaitMs
    Write-Output "SW_HIDE_SENT VISIBLE=$([WinOps]::IsWindowVisible($hwnd))"
  }
}
