Add-Type -AssemblyName System.Drawing

$sourcePath = Join-Path $PSScriptRoot 'source-chotot-cars-pc.png'
$implementationPath = Join-Path $PSScriptRoot 'implementation-pc-1264x712.png'
$outputPath = Join-Path $PSScriptRoot 'focused-comparison.png'

$source = [System.Drawing.Image]::FromFile($sourcePath)
$implementation = [System.Drawing.Image]::FromFile($implementationPath)
$canvas = New-Object System.Drawing.Bitmap 1264, 260
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$graphics.Clear([System.Drawing.Color]::White)
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$font = New-Object System.Drawing.Font 'Segoe UI', 12, ([System.Drawing.FontStyle]::Bold)
$brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(34,34,34))

$graphics.DrawString('SOURCE - Cho Tot pill system', $font, $brush, 12, 6)
$graphics.DrawImage($source, (New-Object System.Drawing.Rectangle 0,30,1264,100), (New-Object System.Drawing.Rectangle 0,220,1264,100), [System.Drawing.GraphicsUnit]::Pixel)
$graphics.DrawString('IMPLEMENTATION - Bobaedream shared pill system', $font, $brush, 12, 136)
$graphics.DrawImage($implementation, (New-Object System.Drawing.Rectangle 0,160,1264,100), (New-Object System.Drawing.Rectangle 0,150,1264,100), [System.Drawing.GraphicsUnit]::Pixel)

$canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$brush.Dispose()
$font.Dispose()
$canvas.Dispose()
$source.Dispose()
$implementation.Dispose()
Write-Output $outputPath
