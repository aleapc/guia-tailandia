# Baixa as fotos escolhidas (Wikimedia Commons) para static/photos e gera photoCredits.ts.
# Entrada: JSON [{ key, ok, commonsTitle, thumbUrl, license, author }] (saída do workflow) +
#          um mapa de fallback key->termo de busca. Uso:
#   pwsh scripts/fetch-thai-photos.ps1 <picks.json> <fallback.json>
param(
  [Parameter(Mandatory)][string]$Picks,
  [Parameter(Mandatory)][string]$Fallback
)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$outDir = Join-Path $root "static\photos"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$picks = Get-Content $Picks -Raw | ConvertFrom-Json
$fallback = Get-Content $Fallback -Raw | ConvertFrom-Json
$headers = @{ "User-Agent" = "GuiaTailandia/1.0 (personal travel app)" }
$credits = @{}

function Strip-Html([string]$s) {
  if (-not $s) { return "" }
  return (($s -replace "<[^>]+>", "") -replace '\s+', ' ').Trim()
}
function Is-Free([string]$lic) {
  if (-not $lic) { return $false }
  return ($lic -match 'CC ?BY' -or $lic -match 'CC0' -or $lic -match '[Pp]ublic domain' -or $lic -match 'PD')
}

# Resolve um File: do Commons -> { thumb, license, artist } (1280px, JPEG).
function Resolve-Title([string]$title) {
  $t = [uri]::EscapeDataString($title)
  $api = "https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=$t" +
         "&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=1280"
  try { $r = Invoke-RestMethod -Uri $api -Headers $headers } catch { return $null }
  $pg = $r.query.pages.PSObject.Properties.Value | Select-Object -First 1
  if (-not $pg.imageinfo) { return $null }
  $ii = $pg.imageinfo[0]
  if ($ii.mime -ne "image/jpeg" -or -not $ii.thumburl) { return $null }
  $lic = $ii.extmetadata.LicenseShortName.value
  if (-not (Is-Free $lic)) { return $null }
  return @{ thumb = $ii.thumburl; license = $lic; artist = (Strip-Html $ii.extmetadata.Artist.value) }
}

# Busca por termo -> primeiro JPEG com licença livre.
function Search-Term([string]$term) {
  $q = [uri]::EscapeDataString($term)
  $api = "https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search" +
         "&gsrnamespace=6&gsrlimit=15&gsrsearch=$q&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=1280"
  try { $r = Invoke-RestMethod -Uri $api -Headers $headers } catch { return $null }
  if (-not $r.query.pages) { return $null }
  $pages = $r.query.pages.PSObject.Properties.Value | Sort-Object index
  foreach ($p in $pages) {
    $ii = $p.imageinfo[0]
    if ($ii -and $ii.mime -eq "image/jpeg" -and $ii.thumburl -and (Is-Free $ii.extmetadata.LicenseShortName.value)) {
      return @{ thumb = $ii.thumburl; license = $ii.extmetadata.LicenseShortName.value; artist = (Strip-Html $ii.extmetadata.Artist.value) }
    }
  }
  return $null
}

foreach ($p in $picks) {
  $key = $p.key
  $file = "$key.jpg"
  $dest = Join-Path $outDir $file
  $info = $null

  # 1) título exato do Commons
  if ($p.ok -and $p.commonsTitle -and $p.commonsTitle.StartsWith("File:")) {
    Start-Sleep -Milliseconds 900
    $info = Resolve-Title $p.commonsTitle
  }
  # 2) fallback: busca pelo termo
  if (-not $info) {
    $term = $fallback.$key
    if ($term) { Start-Sleep -Milliseconds 900; $info = Search-Term $term }
  }
  if (-not $info) { Write-Host ("  ! {0}: nao achei foto livre" -f $file) -ForegroundColor Yellow; continue }

  $ok = $false
  for ($a = 1; $a -le 2; $a++) {
    try { Invoke-WebRequest -Uri $info.thumb -OutFile $dest -Headers $headers -UseBasicParsing; $ok = $true; break }
    catch { if ($a -eq 1) { Start-Sleep -Seconds 4 } else { Write-Host ("  ! {0}: download falhou" -f $file) -ForegroundColor Yellow } }
  }
  if (-not $ok) { continue }
  $kb = [math]::Round((Get-Item $dest).Length / 1KB)
  $artist = if ($info.artist) { $info.artist } else { "Wikimedia Commons" }
  $credits[$file] = ((("{0} — {1} (Wikimedia Commons)" -f $artist, $info.license)) -replace '"', "'")
  Write-Host ("  OK {0}  {1} KB  [{2}]" -f $file, $kb, $info.license) -ForegroundColor Green
}

# Gera photoCredits.ts
$lines = ($credits.GetEnumerator() | Sort-Object Name | ForEach-Object { "  '$($_.Key)': `"$($_.Value)`"," }) -join "`n"
$ts = @"
// Auto-gerado por scripts/fetch-thai-photos.ps1 — atribuições (Wikimedia Commons).
export const photoCredits: Record<string, string> = {
$lines
};
"@
Set-Content -Path (Join-Path $root "src\lib\photoCredits.ts") -Value $ts -Encoding UTF8
Write-Host ("Concluido: {0} fotos, photoCredits.ts atualizado." -f $credits.Count) -ForegroundColor Cyan
