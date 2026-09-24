$ErrorActionPreference = "Stop"

function Read-SecretText([string]$Prompt) {
  $secure = Read-Host $Prompt -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  }
  finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  }
}

Write-Host ""
Write-Host "ORCAH - Migracao MySQL -> Supabase PostgreSQL"
Write-Host "Nenhum segredo sera salvo em arquivo."
Write-Host ""

$source = Read-SecretText "Cole SOURCE_DATABASE_URL (Railway MySQL)"
$target = Read-SecretText "Cole TARGET_DATABASE_URL (Supabase DIRECT_URL / 5432)"

if ([string]::IsNullOrWhiteSpace($source) -or [string]::IsNullOrWhiteSpace($target)) {
  throw "As duas URLs sao obrigatorias."
}

$confirm = Read-Host "Digite MIGRAR para confirmar a copia"
if ($confirm -ne "MIGRAR") {
  throw "Cancelado pelo usuario."
}

try {
  $env:SOURCE_DATABASE_URL = $source
  $env:TARGET_DATABASE_URL = $target
  $env:MIGRATION_CONFIRM = "YES_COPY_ORCAH_DATA"
  $env:MIGRATION_ALLOW_TARGET_RESET = "YES"

  Write-Host "Instalando drivers temporarios sem alterar package.json..."
  npm install --no-save --package-lock=false mysql2 pg
  if ($LASTEXITCODE -ne 0) { throw "Falha ao instalar drivers temporarios." }

  Write-Host "Executando copia e validacao de contagens..."
  node scripts/migrate-mysql-to-postgres.mjs
  if ($LASTEXITCODE -ne 0) { throw "Migracao falhou." }

  Write-Host ""
  Write-Host "MIGRACAO CONCLUIDA E CONTAGENS VALIDADAS."
}
finally {
  Remove-Item Env:SOURCE_DATABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:TARGET_DATABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:MIGRATION_CONFIRM -ErrorAction SilentlyContinue
  Remove-Item Env:MIGRATION_ALLOW_TARGET_RESET -ErrorAction SilentlyContinue
  $source = $null
  $target = $null
}
