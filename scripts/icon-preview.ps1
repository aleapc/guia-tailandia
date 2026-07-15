# Gera 3 conceitos de ícone do Guia Uruguai lado a lado para escolha rápida.
# Saída: scripts/icon-preview.png (768x256: A | B | C com rótulos).
Add-Type -AssemblyName System.Drawing
$out = Join-Path $PSScriptRoot "icon-preview.png"

# Paleta inspirada na bandeira uruguaia
$CELESTE = [System.Drawing.Color]::FromArgb(255, 116, 172, 223)   # #74ACDF azul-celeste oficial
$DOURADO = [System.Drawing.Color]::FromArgb(255, 252, 191, 73)    # #FCBF49 sol
$DOURADO_C = [System.Drawing.Color]::FromArgb(255, 247, 161, 28)  # #F7A11C contorno do sol
$BRANCO = [System.Drawing.Color]::White
$AZUL_PROFUNDO = [System.Drawing.Color]::FromArgb(255, 11, 36, 71) # #0B2447 noite
$RIO = [System.Drawing.Color]::FromArgb(255, 156, 124, 84)        # #9C7C54 Rio da Prata (cor barrenta real)

$W = 256; $H = 256
$canvas = New-Object System.Drawing.Bitmap (($W * 3) + 24), ($H + 40)
$cg = [System.Drawing.Graphics]::FromImage($canvas)
$cg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$cg.Clear([System.Drawing.Color]::FromArgb(255, 245, 245, 247))

function Draw-SolDeMayo($g, $cx, $cy, $r, $brush, $rayLen = 1.9, $rayWidth = 0.17) {
  # 16 raios triangulares + círculo central — Sol de Mayo simplificado
  $rOuter = $r * $rayLen
  for ($i = 0; $i -lt 16; $i++) {
    $a = $i * (2 * [Math]::PI / 16) - ([Math]::PI / 2)
    $ax = $cx + [Math]::Cos($a) * $rOuter
    $ay = $cy + [Math]::Sin($a) * $rOuter
    $w = $r * $rayWidth
    $b1x = $cx + [Math]::Cos($a + [Math]::PI / 2) * $w
    $b1y = $cy + [Math]::Sin($a + [Math]::PI / 2) * $w
    $b2x = $cx + [Math]::Cos($a - [Math]::PI / 2) * $w
    $b2y = $cy + [Math]::Sin($a - [Math]::PI / 2) * $w
    $tri = [System.Drawing.PointF[]]@(
      (New-Object System.Drawing.PointF ([single]$ax), ([single]$ay)),
      (New-Object System.Drawing.PointF ([single]$b1x), ([single]$b1y)),
      (New-Object System.Drawing.PointF ([single]$b2x), ([single]$b2y))
    )
    $g.FillPolygon($brush, $tri)
  }
  $g.FillEllipse($brush, ($cx - $r), ($cy - $r), ($r * 2), ($r * 2))
}

function New-Concept-A([int]$size) {
  # A — Sol de Mayo em celeste (clássico, identidade da bandeira)
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear($CELESTE)
  $sun = New-Object System.Drawing.SolidBrush $DOURADO
  Draw-SolDeMayo $g ($size / 2.0) ($size / 2.0) ($size * 0.20) $sun
  $sun.Dispose(); $g.Dispose()
  return $bmp
}

function New-Concept-B([int]$size) {
  # B — Sol de Mayo dourado em céu noturno (mais sofisticado, contrasta com o do PV)
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear($AZUL_PROFUNDO)
  $sun = New-Object System.Drawing.SolidBrush $DOURADO
  Draw-SolDeMayo $g ($size / 2.0) ($size / 2.0) ($size * 0.20) $sun
  $sun.Dispose(); $g.Dispose()
  return $bmp
}

function New-Concept-C([int]$size) {
  # C — Pôr do sol sobre o Rio da Prata (guia de viagem; "Uruguai" + "verão" + horizonte)
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

  # Gradiente vertical céu (celeste → dourado no horizonte)
  $rect = New-Object System.Drawing.Rectangle 0, 0, $size, ($size * 0.72)
  $lgb = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, $CELESTE, $DOURADO, 90.0
  $g.FillRectangle($lgb, $rect); $lgb.Dispose()
  # Rio (Rio da Prata é marrom-barrento de verdade)
  $rio = New-Object System.Drawing.SolidBrush $RIO
  $g.FillRectangle($rio, 0, ($size * 0.72), $size, ($size * 0.28))
  $rio.Dispose()
  # Sol descendo no horizonte
  $sun = New-Object System.Drawing.SolidBrush $DOURADO
  $sunR = $size * 0.18
  $g.FillEllipse($sun, (($size / 2.0) - $sunR), (($size * 0.72) - $sunR), ($sunR * 2), ($sunR * 2))
  $sun.Dispose()
  $g.Dispose()
  return $bmp
}

# Compõe as 3 lado a lado com rótulos
$a = New-Concept-A $W
$b = New-Concept-B $W
$c = New-Concept-C $W
$cg.DrawImage($a, 0, 0)
$cg.DrawImage($b, $W + 12, 0)
$cg.DrawImage($c, ($W * 2) + 24, 0)

$font = New-Object System.Drawing.Font ('Segoe UI', 14, [System.Drawing.FontStyle]::Bold)
$txt = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 30, 30, 40))
$cg.DrawString("A · Sol de Mayo (celeste)", $font, $txt, 8, $H + 8)
$cg.DrawString("B · Sol de Mayo (noturno)", $font, $txt, $W + 20, $H + 8)
$cg.DrawString("C · Sol sobre Rio da Prata", $font, $txt, ($W * 2) + 32, $H + 8)

$canvas.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$cg.Dispose(); $canvas.Dispose(); $a.Dispose(); $b.Dispose(); $c.Dispose()
Write-Host "OK: $out ($([math]::Round((Get-Item $out).Length/1KB)) KB)"
