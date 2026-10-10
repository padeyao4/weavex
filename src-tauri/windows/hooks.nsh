; ============================================================================
; Weavex NSIS installer hooks
; 目标：安装时把 $INSTDIR\bin（仅含 weavex.exe）加入【用户级】PATH（HKCU\Environment），
;       使任何新开终端可直接调用 `weavex`；卸载时移除该 PATH 条目并删除 bin 目录。
;       uninstall.exe 位于 $INSTDIR 根目录，不进入 PATH。
;
; 重要：PATH 读写改用 PowerShell 实现，而不是 NSIS 原生宏——
;       NSIS 字符串默认上限 1024 字符，而真实用户 PATH 常远超（本项目实测 1554 字符），
;       NSIS ReadRegStr 对超长值会失败并导致覆盖丢失；PowerShell 无此限制，
;       且 [Environment]::SetEnvironmentVariable('...','User') 正确处理
;       REG_EXPAND_SZ 并广播环境变更。
;
; 说明：$INSTDIR 是 NSIS 变量（安装目录，宏内展开）；$p/$n/$_ 不是 NSIS 变量，
;       原样传给 PowerShell 由其解析。
; ============================================================================

!macro NSIS_HOOK_POSTINSTALL
  ; 1) 建 bin 目录并复制主程序（PATH 只暴露 weavex.exe）
  CreateDirectory "$INSTDIR\bin"
  CopyFiles /SILENT "$INSTDIR\weavex.exe" "$INSTDIR\bin\weavex.exe"
  ; 2) 把 $INSTDIR\bin 追加到用户 PATH（幂等：已包含则跳过）
  nsExec::ExecToLog "powershell -NoProfile -ExecutionPolicy Bypass -Command $\"$p=[Environment]::GetEnvironmentVariable('Path','User'); if($p -and $p.Contains('$INSTDIR\bin')){exit 0}; $n=if($p){$p.TrimEnd(';')+';'+'$INSTDIR\bin'}else{'$INSTDIR\bin'}; [Environment]::SetEnvironmentVariable('Path',$n,'User')$\""
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  ; 1) 从用户 PATH 移除 $INSTDIR\bin（精确按分号条目匹配，其余条目原样保留）
  nsExec::ExecToLog "powershell -NoProfile -ExecutionPolicy Bypass -Command $\"$p=[Environment]::GetEnvironmentVariable('Path','User'); if(-not $p){exit 0}; $n=($p.Split(';') | Where-Object { $_ -and $_ -ne '$INSTDIR\bin' }) -join ';'; [Environment]::SetEnvironmentVariable('Path',$n,'User')$\""
  ; 2) 删除 bin 目录
  Delete "$INSTDIR\bin\weavex.exe"
  RMDir "$INSTDIR\bin"
!macroend
