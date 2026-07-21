# Local dev without Docker: 2 stub LLMs + gateway (ports 8896–8898).
# For real models: install Docker Desktop, then: docker compose -f AI/docker-compose.yml up --build

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$GatewayDir = Join-Path $Root "gateway"
$ScriptsDir = Join-Path $Root "scripts"

function Test-PortListen($port) {
    try {
        $c = New-Object System.Net.Sockets.TcpClient
        $c.Connect("127.0.0.1", $port)
        $c.Close()
        return $true
    } catch { return $false }
}

foreach ($p in 8896, 8897, 8898) {
    if (Test-PortListen $p) {
        Write-Host "Port $p already in use. Stop existing processes first." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Installing Python deps (gateway)..." -ForegroundColor Cyan
py -3 -m pip install -q -r (Join-Path $GatewayDir "requirements.txt")

$logDir = Join-Path $Root "scripts\.logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

Write-Host "Starting stub llm-smol on :8896 ..." -ForegroundColor Cyan
Start-Process -FilePath "py" -ArgumentList "-3", (Join-Path $ScriptsDir "dev-stub-llm.py"), "smol", "8896" `
    -WorkingDirectory $ScriptsDir -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $logDir "llm-smol.log") `
    -RedirectStandardError (Join-Path $logDir "llm-smol.err.log")

Write-Host "Starting stub llm-qwen on :8897 ..." -ForegroundColor Cyan
Start-Process -FilePath "py" -ArgumentList "-3", (Join-Path $ScriptsDir "dev-stub-llm.py"), "qwen", "8897" `
    -WorkingDirectory $ScriptsDir -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $logDir "llm-qwen.log") `
    -RedirectStandardError (Join-Path $logDir "llm-qwen.err.log")

Start-Sleep -Seconds 2

$env:PORT = "8898"
$env:AI_SERVICE_INTERNAL_API_KEY = "dev-internal-ai-key"
$env:LLM_SMOL_URL = "http://127.0.0.1:8896"
$env:LLM_QWEN_URL = "http://127.0.0.1:8897"
$env:AI_DEFAULT_LLM = "smol"

Write-Host "Starting gateway on :8898 (foreground). Ctrl+C to stop." -ForegroundColor Green
Write-Host "  Health: http://127.0.0.1:8898/health" -ForegroundColor Gray
Set-Location $GatewayDir
py -3 -m uvicorn app.main:app --host 0.0.0.0 --port 8898
