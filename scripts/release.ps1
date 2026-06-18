# ============================================================
#  release.ps1 — Publica una nueva versión en GitHub Releases.
#
#  Hace: build → zip → release "r-<sha7>" con AgendaCobranza.zip.
#  La app de los usuarios (sin Git) compara su version.json contra
#  el último release y se actualiza descargando ese zip.
#
#  Uso: npm run release   (o doble clic en publicar-version.bat)
# ============================================================

$ErrorActionPreference = 'Stop'
$REPO = 'SebastianGarciaGuerrero/agenda-cobranza'
Set-Location (Split-Path $PSScriptRoot -Parent)
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# ── 1. Verificaciones previas ────────────────────────────────
# Solo bloquea por cambios en archivos versionados (ignora archivos sueltos no rastreados)
if (git status --porcelain --untracked-files=no) {
    Write-Host "X Hay cambios sin commitear. Commitea y pushea antes de publicar." -ForegroundColor Red
    exit 1
}
if ((git status -sb) -match '\[ahead') {
    Write-Host "X Hay commits sin pushear. Hace git push antes de publicar." -ForegroundColor Red
    exit 1
}

$sha  = (git rev-parse HEAD).Trim()
$sha7 = $sha.Substring(0, 7)
$tag  = "r-$sha7"
$msg  = (git log -1 --pretty=%s | Out-String).Trim()

# ── 2. Token desde el credential helper de git (nunca se imprime) ──
Set-Content -Path "$env:TEMP\credq.txt" -Value "protocol=https`nhost=github.com`n" -Encoding ascii
$cred = cmd /c "git credential fill < %TEMP%\credq.txt 2>nul"
Set-Content -Path "$env:TEMP\credq.txt" -Value "x"
$token = (($cred | Where-Object { $_ -like 'password=*' }) -replace 'password=', '').Trim()
if (-not $token) {
    Write-Host "X No se encontro la credencial de GitHub. Hace un git push manual primero." -ForegroundColor Red
    exit 1
}
$headers = @{ Authorization = "token $token"; Accept = 'application/vnd.github+json'; 'User-Agent' = 'AgendaCobranza-release' }

# ── 3. ¿Ya existe un release de este commit? ─────────────────
$exists = $false
try {
    Invoke-RestMethod -Uri "https://api.github.com/repos/$REPO/releases/tags/$tag" -Headers $headers | Out-Null
    $exists = $true
} catch {}
if ($exists) {
    Write-Host "X Ya existe un release para este commit ($tag). No hay nada nuevo que publicar." -ForegroundColor Red
    exit 1
}

# ── 4. Build + zip ───────────────────────────────────────────
Write-Host "-> Compilando..." -ForegroundColor Cyan
cmd /c "npm run build:win"
if ($LASTEXITCODE -ne 0) { Write-Host "X Fallo el build." -ForegroundColor Red; exit 1 }

Write-Host "-> Comprimiendo..." -ForegroundColor Cyan
Compress-Archive -Path 'dist\AgendaCobranza-win32-x64' -DestinationPath 'dist\AgendaCobranza.zip' -Force

# ── 5. Crear el release ──────────────────────────────────────
Write-Host "-> Creando release en GitHub..." -ForegroundColor Cyan
$fecha = Get-Date -Format 'dd/MM/yyyy'
$body = @{
    tag_name         = $tag
    target_commitish = $sha
    name             = "Agenda Cobranza - $fecha ($sha7)"
    body             = $msg
} | ConvertTo-Json
# Codificar a UTF-8 explícito: las tildes del mensaje de commit rompen el parseo si no
$bodyBytes = [Text.Encoding]::UTF8.GetBytes($body)
$rel = Invoke-RestMethod -Method Post -Uri "https://api.github.com/repos/$REPO/releases" -Headers $headers -Body $bodyBytes -ContentType 'application/json; charset=utf-8'

# ── 6. Subir el zip ──────────────────────────────────────────
Write-Host "-> Subiendo AgendaCobranza.zip (puede tardar)..." -ForegroundColor Cyan
$asset = Invoke-RestMethod -Method Post `
    -Uri "https://uploads.github.com/repos/$REPO/releases/$($rel.id)/assets?name=AgendaCobranza.zip" `
    -Headers @{ Authorization = "token $token"; 'User-Agent' = 'AgendaCobranza-release' } `
    -ContentType 'application/zip' -InFile 'dist\AgendaCobranza.zip' -TimeoutSec 600

Write-Host ""
Write-Host "OK Version publicada: $($rel.html_url)" -ForegroundColor Green
Write-Host "   Los usuarios veran el aviso de actualizacion al abrir la app."
