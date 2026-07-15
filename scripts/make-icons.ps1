# Gera os 3 ícones PWA do Guia Tailândia: lanterna dourada (khom loy) sobre açafrão.
# Rode com Windows PowerShell:  powershell.exe -NoProfile -File scripts/make-icons.ps1
Add-Type -AssemblyName System.Drawing
$dir = Join-Path (Split-Path $PSScriptRoot -Parent) "static"

$SAFFRON = [System.Drawing.Color]::FromArgb(255, 228, 87, 46)    # #E4572E
$CRIMSON = [System.Drawing.Color]::FromArgb(255, 163, 22, 33)    # #A31621
$GOLD    = [System.Drawing.Color]::FromArgb(255, 244, 208, 120)  # #F4D078
$GOLDHI  = [System.Drawing.Color]::FromArgb(255, 255, 236, 179)  # brilho
$DARK    = [System.Drawing.Color]::FromArgb(255, 120, 30, 20)    # detalhes

function New-Icon([int]$size, [string]$file, [double]$scale) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

  # Fundo: gradiente vertical açafrão -> carmim (festivo)
  $rect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
  $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, $SAFFRON, $CRIMSON, 90
  $g.FillRectangle($bg, $rect)

  $cx = $size / 2.0
  $cy = $size / 2.0

  # Halo de luz atrás da lanterna
  $hr = $size * 0.34 * $scale
  $pg = New-Object System.Drawing.Drawing2D.PathGradientBrush ([System.Drawing.PointF[]]@(
    (New-Object System.Drawing.PointF ([single]($cx - $hr)), ([single]($cy - $hr))),
    (New-Object System.Drawing.PointF ([single]($cx + $hr)), ([single]($cy - $hr))),
    (New-Object System.Drawing.PointF ([single]($cx + $hr)), ([single]($cy + $hr))),
    (New-Object System.Drawing.PointF ([single]($cx - $hr)), ([single]($cy + $hr)))
  ))
  $pg.CenterColor = [System.Drawing.Color]::FromArgb(150, 255, 236, 179)
  $pg.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 255, 236, 179))
  $g.FillEllipse($pg, ($cx - $hr), ($cy - $hr), ($hr * 2), ($hr * 2))

  # Corpo da lanterna (elipse vertical dourada)
  $bw = $size * 0.22 * $scale   # meia-largura
  $bh = $size * 0.28 * $scale   # meia-altura
  $body = New-Object System.Drawing.SolidBrush $GOLD
  $g.FillEllipse($body, ($cx - $bw), ($cy - $bh * 0.9), ($bw * 2), ($bh * 2))

  # Tampa superior e base
  $capW = $bw * 0.9
  $cap = New-Object System.Drawing.SolidBrush $DARK
  $g.FillRectangle($cap, [single]($cx - $capW), [single]($cy - $bh * 1.05), [single]($capW * 2), [single]($bh * 0.16))
  $g.FillRectangle($cap, [single]($cx - $capW * 0.8), [single]($cy + $bh * 0.95), [single]($capW * 1.6), [single]($bh * 0.14))

  # Nervuras verticais
  $penR = New-Object System.Drawing.Pen (([System.Drawing.Color]::FromArgb(120, 120, 30, 20))), ([single]($size * 0.006))
  foreach ($fx in @(-0.5, 0.0, 0.5)) {
    $x = $cx + $bw * $fx
    $g.DrawLine($penR, [single]$x, [single]($cy - $bh * 0.85), [single]$x, [single]($cy + $bh * 0.85))
  }

  # Brilho no corpo
  $hi = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(120, 255, 236, 179))
  $g.FillEllipse($hi, [single]($cx - $bw * 0.55), [single]($cy - $bh * 0.55), [single]($bw * 0.6), [single]($bh * 0.9))

  # Chama embaixo
  $flame = New-Object System.Drawing.SolidBrush $GOLDHI
  $g.FillEllipse($flame, [single]($cx - $size * 0.02), [single]($cy + $bh * 1.02), [single]($size * 0.04), [single]($size * 0.06 * $scale))

  $png = Join-Path $dir $file
  $bmp.Save($png, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
  Write-Host "  OK $file"
}

Write-Host "Gerando icones do Guia Tailandia..." -ForegroundColor Cyan
New-Icon 192 "icon-192.png" 1.0
New-Icon 512 "icon-512.png" 1.0
New-Icon 512 "icon-512-maskable.png" 0.78
Write-Host "Concluido" -ForegroundColor Green
