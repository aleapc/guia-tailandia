# Builds the PWA and pushes to the gh-pages branch.
# Use: .\deploy.ps1
# Uses a dedicated git worktree so we never switch branches in the main checkout.

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# Worktree lives OUTSIDE D:\dev: Norton's folder shield blocks git.exe from writing
# inside D:\dev (the repo's .git is also kept in %LOCALAPPDATA%\gtl-git for the same reason).
$worktreePath = Join-Path $env:LOCALAPPDATA "gtl-gh-pages"
$buildPath = Join-Path $PSScriptRoot "build"

Write-Host "→ Build com BASE_PATH=/guia-tailandia ..." -ForegroundColor Cyan
$env:BASE_PATH = "/guia-tailandia"
npm run build

# Trava de segurança: nunca publicar um build sem o base path (CSS/JS quebrariam no GitHub Pages).
$indexHtml = Get-Content "build\index.html" -Raw
if ($indexHtml -notmatch '/guia-tailandia/_app') {
    throw "ABORTADO: build/index.html não contém o base path /guia-tailandia. O BASE_PATH não foi aplicado — deploy cancelado para não publicar um site quebrado."
}
Write-Host "  ✓ base path confirmado no index.html" -ForegroundColor Green

if (-not (Test-Path "build\.nojekyll")) { New-Item -ItemType File "build\.nojekyll" | Out-Null }

Write-Host "→ Preparando worktree gh-pages em $worktreePath ..." -ForegroundColor Cyan
git fetch origin gh-pages 2>&1 | Out-Null

if (Test-Path $worktreePath) {
    git worktree remove --force $worktreePath 2>&1 | Out-Null
    if (Test-Path $worktreePath) { Remove-Item $worktreePath -Recurse -Force }
}

# Create the worktree; if gh-pages doesn't exist yet on origin, start an orphan branch.
$hasRemote = (git ls-remote --heads origin gh-pages 2>$null)
if ($hasRemote) {
    git worktree add -B gh-pages $worktreePath origin/gh-pages
} else {
    git worktree add --detach $worktreePath
    Push-Location $worktreePath
    git checkout --orphan gh-pages
    git rm -rf . 2>&1 | Out-Null
    Pop-Location
}

Get-ChildItem $worktreePath -Force | Where-Object { $_.Name -ne '.git' } | Remove-Item -Recurse -Force
Copy-Item -Path "$buildPath\*" -Destination $worktreePath -Recurse -Force
Copy-Item -Path "$buildPath\.nojekyll" -Destination (Join-Path $worktreePath ".nojekyll") -Force

@"
node_modules
.svelte-kit
*.log
"@ | Set-Content (Join-Path $worktreePath ".gitignore")

Push-Location $worktreePath
try {
    git add -A
    $date = Get-Date -Format "yyyy-MM-dd HH:mm"
    git commit -m "deploy: $date" --allow-empty
    git push origin gh-pages
}
finally {
    Pop-Location
}

git worktree remove --force $worktreePath
if (Test-Path $worktreePath) { Remove-Item $worktreePath -Recurse -Force -ErrorAction SilentlyContinue }

Write-Host "✓ Deployed. https://aleapc.github.io/guia-tailandia/" -ForegroundColor Green
