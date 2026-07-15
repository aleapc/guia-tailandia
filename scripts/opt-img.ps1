# Otimiza uma imagem do Downloads -> static/photos/<nome>.jpg (1280px de largura, qualidade 82).
# Uso:  pwsh scripts/opt-img.ps1 <nome-sem-extensao>
param([Parameter(Mandatory)][string]$Name, [int]$MaxW = 1280, [int]$Quality = 82)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$dl = "$env:USERPROFILE\Downloads"
$dst = Join-Path $PSScriptRoot "..\static\photos"
if (-not (Test-Path $dst)) { New-Item -ItemType Directory -Force $dst | Out-Null }
$src = Join-Path $dl "$Name.png"
if (-not (Test-Path $src)) { $src = Join-Path $dl "$Name.jpg" }
if (-not (Test-Path $src)) { Write-Host "NAO achei $Name.(png|jpg) em $dl"; exit 1 }
$img = [System.Drawing.Image]::FromFile($src)
try {
  $w = $img.Width; $h = $img.Height
  if ($w -gt $MaxW) { $nw = $MaxW; $nh = [int]($h * $MaxW / $w) } else { $nw = $w; $nh = $h }
  $bmp = New-Object System.Drawing.Bitmap $nw, $nh
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($img, 0, 0, $nw, $nh)
  $enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $ep = New-Object System.Drawing.Imaging.EncoderParameters 1
  $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)
  $out = Join-Path $dst "$Name.jpg"
  $bmp.Save($out, $enc, $ep); $g.Dispose(); $bmp.Dispose()
  Write-Host "OK: static/photos/$Name.jpg ($([math]::Round((Get-Item $out).Length/1KB)) KB, $nw x $nh)"
} finally { $img.Dispose() }
