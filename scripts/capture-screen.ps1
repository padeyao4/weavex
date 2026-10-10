<#
.SYNOPSIS
  捕获真实桌面截图（AI 虚拟桌面 GUI 与真实桌面隔离，用本脚本截取真实桌面）

.DESCRIPTION
  通过 .NET System.Drawing 直接截取真实桌面（非沙箱虚拟桌面）。
  支持全屏截图，以及"裁剪指定区域 + 放大"用于精确定位小元素（如托盘图标）。

.PARAMETER Out
  输出 PNG 路径，默认 desktop.png

.PARAMETER CropX / CropY / CropW / CropH
  裁剪区域（物理像素）。CropW/CropH 为 0 时不裁剪（全屏）。

.PARAMETER Scale
  裁剪后放大倍数（默认 1；定位小图标建议 2-6，使用最近邻插值保持像素清晰）

.EXAMPLE
  .\capture-screen.ps1 -Out desktop.png
  .\capture-screen.ps1 -CropX 2300 -CropY 1400 -CropW 145 -CropH 35 -Scale 6 -Out tray-icons.png
#>
param(
  [string]$Out = "desktop.png",
  [int]$CropX = 0,
  [int]$CropY = 0,
  [int]$CropW = 0,
  [int]$CropH = 0,
  [int]$Scale = 1
)

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
try {
  $w = [System.Windows.Forms.SystemInformation]::VirtualScreen.Width
  $h = [System.Windows.Forms.SystemInformation]::VirtualScreen.Height
  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CopyFromScreen(0, 0, 0, 0, (New-Object System.Drawing.Size($w, $h)))

  if ($CropW -gt 0 -and $CropH -gt 0) {
    $rect = New-Object System.Drawing.Rectangle($CropX, $CropY, $CropW, $CropH)
    $crop = $bmp.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $outW = [int]($CropW * $Scale)
    $outH = [int]($CropH * $Scale)
    $scaled = New-Object System.Drawing.Bitmap($outW, $outH)
    $sg = [System.Drawing.Graphics]::FromImage($scaled)
    $sg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $sg.DrawImage($crop, 0, 0, $outW, $outH)
    $scaled.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
    $sg.Dispose(); $crop.Dispose(); $scaled.Dispose()
    Write-Output "SAVED=$Out CROP=($CropX,$CropY,$CropW,$CropH) SCALE=${Scale}x"
  } else {
    $bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Output "SAVED=$Out FULL=${w}x${h}"
  }
  $g.Dispose(); $bmp.Dispose()
} catch {
  Write-Error "ERR: $($_.Exception.Message)"
  exit 1
}
