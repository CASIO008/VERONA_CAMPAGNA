# ============================================================
#  VERONA CAMPAGNA - preparo das imagens
#  Le as fotos de C:\Users\Vanda\Desktop\img_jewels, recorta
#  legendas embutidas, redimensiona e reencoda em JPEG/PNG,
#  gravando em images/ com nomes de produto em kebab-case.
#  Requer Windows PowerShell 5.1 (WIC/WPF). Idempotente.
# ============================================================
param(
  [string]$Source = 'C:\Users\Vanda\Desktop\img_jewels',
  [string]$Dest   = (Join-Path $PSScriptRoot '..\images')
)

Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

$ErrorActionPreference = 'Stop'
$script:ok = 0; $script:copied = 0; $script:failed = 0

function Decode([string]$path) {
  $uri = New-Object System.Uri($path)
  $dec = [System.Windows.Media.Imaging.BitmapDecoder]::Create($uri,
    [System.Windows.Media.Imaging.BitmapCreateOptions]::None,
    [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
  return $dec.Frames[0]
}

function Resize([System.Windows.Media.Imaging.BitmapSource]$src, [int]$maxW) {
  if ($src.PixelWidth -le $maxW) { return $src }
  $s = $maxW / $src.PixelWidth
  $tb = New-Object System.Windows.Media.Imaging.TransformedBitmap($src, (New-Object System.Windows.Media.ScaleTransform($s, $s)))
  $tb.Freeze()
  return $tb
}

function CropBottom([System.Windows.Media.Imaging.BitmapSource]$src, [double]$pct) {
  $keep = [int][math]::Round($src.PixelHeight * (1 - $pct))
  $crop = New-Object System.Windows.Media.Imaging.CroppedBitmap($src, (New-Object System.Windows.Int32Rect(0, 0, $src.PixelWidth, $keep)))
  $crop.Freeze()
  return $crop
}

function SaveJpg([System.Windows.Media.Imaging.BitmapSource]$src, [string]$out, [int]$quality = 88) {
  $enc = New-Object System.Windows.Media.Imaging.JpegBitmapEncoder
  $enc.QualityLevel = $quality
  $enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($src))
  $fs = [System.IO.File]::Create($out)
  try { $enc.Save($fs) } finally { $fs.Dispose() }
}

function SavePng([System.Windows.Media.Imaging.BitmapSource]$src, [string]$out) {
  $enc = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
  $enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($src))
  $fs = [System.IO.File]::Create($out)
  try { $enc.Save($fs) } finally { $fs.Dispose() }
}

# manual: crops de legenda embutida (fração da altura a remover no rodapé)
function Convert-One([string]$file, [string]$outRel, [int]$maxW = 1400, [double]$cropBottom = 0, [string]$format = 'jpg') {
  $src  = Join-Path $Source $file
  $out  = Join-Path $Dest  $outRel
  $dir  = Split-Path $out -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  if (-not (Test-Path $src)) { Write-Warning "faltando: $file"; $script:failed++; return }
  try {
    $bmp = Decode $src
    if ($cropBottom -gt 0) { $bmp = CropBottom $bmp $cropBottom }
    $bmp = Resize $bmp $maxW
    if ($format -eq 'png') { SavePng $bmp $out } else { SaveJpg $bmp $out }
    $kb = [math]::Round((Get-Item $out).Length / 1KB)
    Write-Output ("  ok  {0,-40} -> {1} ({2} KB)" -f $file, $outRel, $kb)
    $script:ok++
  } catch {
    Write-Warning "falhou $file : $($_.Exception.Message)"
    $script:failed++
  }
}

# copia crua (WebP: browser le nativo; nao reencoda)
function Copy-One([string]$file, [string]$outRel) {
  $src = Join-Path $Source $file
  $out = Join-Path $Dest  $outRel
  $dir = Split-Path $out -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  Copy-Item -LiteralPath $src -Destination $out -Force
  $kb = [math]::Round((Get-Item $out).Length / 1KB)
  Write-Output ("  cp  {0,-40} -> {1} ({2} KB)" -f $file, $outRel, $kb)
  $script:copied++
}

# AVIF (arquivos .png que na verdade sao ftypavif): converte p/ JPEG via
# Pillow quando o Python existe; senao copia cru com extensao .avif.
function Convert-Avif([string]$file, [string]$outRel, [int]$maxW = 1200) {
  $src = Join-Path $Source $file
  $out = Join-Path $Dest  $outRel
  $dir = Split-Path $out -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  $py = Get-Command python -ErrorAction SilentlyContinue
  if ($py) {
    $fwdSrc = $src.Replace('\', '/'); $fwdOut = $out.Replace('\', '/')
    $code = "from PIL import Image; im=Image.open(r'$fwdSrc').convert('RGB'); im.thumbnail(($maxW,$maxW)); im.save(r'$fwdOut','JPEG',quality=88)"
    & $py.Source -c $code 2>$null
    if ($LASTEXITCODE -eq 0 -and (Test-Path $out)) {
      $kb = [math]::Round((Get-Item $out).Length / 1KB)
      Write-Output ("  ok  {0,-40} -> {1} ({2} KB)" -f $file, $outRel, $kb)
      $script:ok++; return
    }
  }
  $alt = [System.IO.Path]::ChangeExtension($out, '.avif')
  Copy-Item -LiteralPath $src -Destination $alt -Force
  Write-Output ("  cp  {0,-40} -> {1} (sem Python/Pillow)" -f $file, [System.IO.Path]::GetFileName($alt))
  $script:copied++
}

Write-Output '--- aneis ---'
Convert-One 'anel_garra.jpg'      'aneis/anel-garra-1.jpg'
Convert-One 'anel_garra_1.jpg'    'aneis/anel-garra-2.jpg'
Convert-One 'anel_shape.jpg'      'aneis/anel-onda-1.jpg'
Convert-One 'anel_shape_1.jpg'    'aneis/anel-onda-2.jpg'
Convert-One 'anel_shape_2.png'    'aneis/anel-onda-3.png' 900 0 png
Convert-One 'anel_anjo.jpg'       'aneis/anel-asa-1.jpg'
Convert-One 'anel_anjo_1.jpg'     'aneis/anel-asa-2.jpg'
Copy-One    'anel_rainha.webp'    'aneis/anel-coroa-rainha-1.webp'
Copy-One    'anel_rainha_1.webp'  'aneis/anel-coroa-rainha-2.webp'
Copy-One    'anel_rainha_2.webp'  'aneis/anel-coroa-rainha-3.webp'
Copy-One    'anel_rei.webp'       'aneis/anel-coroa-espinhos-1.webp'
Copy-One    'anel_rei_1.webp'     'aneis/anel-coroa-espinhos-2.webp'
Copy-One    'anel_rei_2.webp'     'aneis/anel-coroa-espinhos-3.webp'
Copy-One    'anel_rei_3.webp'     'aneis/anel-coroa-espinhos-4.webp'
Copy-One    'anel_anjo_2.webp'    'aneis/anel-asa-3.webp'
Convert-Avif 'anel_anjo3.png'     'aneis/anel-asa-4.jpg'    # arquivo real: AVIF
Convert-Avif 'anel_7.png'         'aneis/anel-sarca-1.jpg'  # arquivo real: AVIF

Write-Output '--- brincos ---'
Convert-One 'brinco_2.png' 'brincos/brinco-halo-1.jpg' 1200
Convert-One 'brinco_3.png' 'brincos/brinco-argola-1.jpg' 1400

Write-Output '--- colares ---'
Convert-One 'colar.png'   'colares/colar-starlit-1.jpg' 1200 0.10   # remove legenda inferior
Convert-One 'colar_1.png' 'colares/colar-starlit-2.jpg' 1400

Write-Output '--- pingentes ---'
Convert-One 'pingente.jpg'   'pingentes/pingente-esmeralda-1.jpg' 1000
Convert-One 'pingente_1.jpg' 'pingentes/pingente-esmeralda-2.jpg' 1000

Write-Output '--- pulseiras ---'
Convert-One 'pulseira.png'   'pulseiras/pulseira-tennis-1.jpg' 1200 0.10  # remove legenda inferior
Convert-One 'pulseira_1.png' 'pulseiras/pulseira-tennis-2.jpg' 1400

Write-Output '--- editorial ---'
Convert-One 'modelo.jpg'    'editorial/modelo-1.jpg' 1000
Convert-One 'modelo_1.png'  'editorial/modelo-2.jpg' 1000
Convert-One 'modelo_2.jpg'  'editorial/modelo-3.jpg' 1000
Convert-One 'modelo_3.jpg'  'editorial/modelo-4.jpg' 1400
Convert-One 'modelo_4.jpg'  'editorial/modelo-5.jpg' 1000

Write-Output ''
Write-Output ("prontas: {0} | copiadas: {1} | falhas: {2}" -f $script:ok, $script:copied, $script:failed)
