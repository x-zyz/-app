param(
    [switch]$NoInstall,
    [string]$Device = "127.0.0.1:16416"
)

$ErrorActionPreference = 'Continue'
$root = $PSScriptRoot
$sdk = Join-Path $root 'tools\android-sdk'
$bt = Join-Path $sdk 'build-tools\35.0.0'
$jar = Join-Path $sdk 'platforms\android-35\android.jar'
$src = Join-Path $root 'tianji'
$out = Join-Path $src 'build'
$adb = 'C:\Program Files\AzurPilot\bootstrap\adb.exe'

function Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }

Step 'clean'
if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory -Force -Path "$out\classes", "$out\dex", "$out\compiled" | Out-Null

Step 'aapt2 compile'
& "$bt\aapt2.exe" compile --dir "$src\res" -o "$out\res.zip"
if ($LASTEXITCODE -ne 0) { throw 'aapt2 compile failed' }

Step 'aapt2 link'
& "$bt\aapt2.exe" link `
    -o "$out\base.apk" `
    -I $jar `
    --manifest "$src\AndroidManifest.xml" `
    --min-sdk-version 24 `
    --target-sdk-version 35 `
    --version-code 20 `
    --version-name 2.9 `
    --auto-add-overlay `
    "$out\res.zip"
if ($LASTEXITCODE -ne 0) { throw 'aapt2 link failed' }

Step 'javac'
$srcs = Get-ChildItem "$src\java" -Recurse -Filter *.java | ForEach-Object { $_.FullName }
& javac -encoding UTF-8 --release 11 -nowarn -classpath $jar -d "$out\classes" $srcs 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) { throw 'javac failed' }

Step 'd8'
$classes = Get-ChildItem "$out\classes" -Recurse -Filter *.class | ForEach-Object { $_.FullName }
& "$bt\d8.bat" --release --lib $jar --min-api 24 --output "$out\dex" $classes 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) { throw 'd8 failed' }

Step 'package dex + assets'
Copy-Item "$out\base.apk" "$out\unsigned.apk" -Force
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression
$zip = [System.IO.Compression.ZipFile]::Open("$out\unsigned.apk", 'Update')

function Add-FileToZip($zip, $entryName, $path) {
    $e = $zip.CreateEntry($entryName, [System.IO.Compression.CompressionLevel]::Optimal)
    $s = $e.Open()
    $f = [System.IO.File]::OpenRead($path)
    $f.CopyTo($s)
    $f.Dispose(); $s.Dispose()
}

Add-FileToZip $zip 'classes.dex' "$out\dex\classes.dex"

$assetsRoot = (Resolve-Path "$src\assets").Path
Get-ChildItem $assetsRoot -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($assetsRoot.Length + 1).Replace('\', '/')
    Add-FileToZip $zip "assets/$rel" $_.FullName
}
$zip.Dispose()

Step 'zipalign'
& "$bt\zipalign.exe" -f -p 4 "$out\unsigned.apk" "$out\aligned.apk"
if ($LASTEXITCODE -ne 0) { throw 'zipalign failed' }

$ks = Join-Path $root 'tianji.keystore'
if ([string]::IsNullOrWhiteSpace($env:TIANJI_KEYSTORE_PASSWORD)) {
    throw 'Set TIANJI_KEYSTORE_PASSWORD to your local signing keystore password before building.'
}
if (-not (Test-Path $ks)) {
    Step 'keytool (create keystore)'
    & keytool -genkeypair -v -keystore $ks -alias tianji -keyalg RSA -keysize 2048 `
        -validity 10000 -storepass:env TIANJI_KEYSTORE_PASSWORD -keypass:env TIANJI_KEYSTORE_PASSWORD `
        -dname "CN=Tianji, OU=Studio, O=Tianji, L=Shanghai, C=CN" 2>&1 | Out-Null
}

Step 'apksigner'
& "$bt\apksigner.bat" sign --ks $ks --ks-pass env:TIANJI_KEYSTORE_PASSWORD --key-pass env:TIANJI_KEYSTORE_PASSWORD `
    --out "$out\tianji.apk" "$out\aligned.apk"
if ($LASTEXITCODE -ne 0) { throw 'apksigner failed' }

$size = [math]::Round((Get-Item "$out\tianji.apk").Length / 1MB, 2)
Write-Host "built: $out\tianji.apk ($size MB)" -ForegroundColor Green

if (-not $NoInstall) {
    Step "install -> $Device"
    & $adb -s $Device install -r -d "$out\tianji.apk"
    if ($LASTEXITCODE -ne 0) { throw 'adb install failed' }
    Step 'launch'
    & $adb -s $Device shell am force-stop app.tianji
    & $adb -s $Device shell am start -n app.tianji/.MainActivity | Out-Null
}
