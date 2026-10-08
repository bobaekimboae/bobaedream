param(
  [string]$RepositoryRoot = (Split-Path -Parent $PSScriptRoot)
)

$fullMapPath = Join-Path $RepositoryRoot "public/data/kia-catalog-v1/generation-images.json"
$availableMapPath = Join-Path $RepositoryRoot "public/data/kia-catalog-v1/generation-images-available.json"
$assetRoot = Join-Path $RepositoryRoot "public/assets/maker-model/generations"

$fullMap = Get-Content -Raw -LiteralPath $fullMapPath | ConvertFrom-Json -AsHashtable
$available = [ordered]@{}

foreach ($entry in $fullMap.GetEnumerator()) {
  $relativePath = [string]$entry.Value
  $absolutePath = Join-Path $assetRoot ($relativePath -replace '/', [IO.Path]::DirectorySeparatorChar)
  if (Test-Path -LiteralPath $absolutePath -PathType Leaf) {
    $available[$entry.Key] = $relativePath
  }
}

$json = $available | ConvertTo-Json -Depth 4
[IO.File]::WriteAllText($availableMapPath, $json + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))

Write-Output "Full generation mappings: $($fullMap.Count)"
Write-Output "Available generation mappings: $($available.Count)"
Write-Output "Unique available assets: $(@($available.Values | Sort-Object -Unique).Count)"
