param(
  [string]$Serial = 'ed5f279e',
  [string]$OutputDir = 'artifacts/tuhu-review-audit-20261017/tags'
)

$ErrorActionPreference = 'Stop'
$categories = @('空间', '动力', '操控', '外观', '内饰', '科技安全', '舒适性', '性价比')
$baseline = @(
  '发点评','发布','写30字可发布','可发布啦','精华点评获高曝光','我的爱车','换车','提车时间','裸车价格','真实油耗','L/100km',
  '用车满意度','我认为这款车…','超赞','不错','一般','较差','别买','爱车的亮点与槽点* 至少选择2项',
  '补充说说*','写满30字，才能发布成功哦～','内容声明','添加标题','最想吐槽','选车理由','提车过程','驾驶感受',
  '分路况油耗','亮点总结','保养心得','话题','#点评','添加照片','或视频'
) + $categories

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

function Get-Xml([string]$name) {
  $remote = "/sdcard/$name.xml"
  $local = Join-Path $OutputDir "$name.xml"
  & adb -s $Serial shell uiautomator dump $remote | Out-Null
  & adb -s $Serial pull $remote $local | Out-Null
  return [xml](Get-Content -Raw -LiteralPath $local)
}

function Get-Bounds([string]$bounds) {
  $m = [regex]::Match($bounds, '\[(\d+),(\d+)\]\[(\d+),(\d+)\]')
  return [pscustomobject]@{ X1=[int]$m.Groups[1].Value; Y1=[int]$m.Groups[2].Value; X2=[int]$m.Groups[3].Value; Y2=[int]$m.Groups[4].Value }
}

function Tap-Bounds($bounds) {
  $x = [int](($bounds.X1 + $bounds.X2) / 2)
  $y = [int](($bounds.Y1 + $bounds.Y2) / 2)
  & adb -s $Serial shell input tap $x $y | Out-Null
  Start-Sleep -Milliseconds 650
}

function Ensure-Visible([string]$category) {
  for ($attempt=0; $attempt -lt 8; $attempt++) {
    $doc = Get-Xml "locate-$($category)-$attempt"
    $node = $doc.SelectSingleNode("//node[@text='$category']")
    if (-not $node) { throw "Category not found: $category" }
    $b = Get-Bounds $node.bounds
    if ($b.Y1 -ge 520 -and $b.Y2 -le 2020 -and $b.Y2 -gt $b.Y1) { return [pscustomobject]@{ Doc=$doc; Node=$node; Bounds=$b } }
    if ($b.Y1 -lt 520 -or $b.Y2 -le $b.Y1) {
      & adb -s $Serial shell input swipe 540 650 540 1550 350 | Out-Null
    } else {
      & adb -s $Serial shell input swipe 540 1880 540 880 350 | Out-Null
    }
    Start-Sleep -Milliseconds 550
  }
  throw "Could not make category visible: $category"
}

function Get-IconBounds($labelNode, [int]$index) {
  $container = $labelNode.NextSibling
  while ($container -and $container.Name -ne 'node') { $container = $container.NextSibling }
  if (-not $container) { throw 'Icon container not found' }
  $icons = @($container.SelectNodes('./node[@clickable="true"]'))
  if ($icons.Count -lt 2) { $icons = @($container.SelectNodes('.//node[@clickable="true"]')) }
  if ($icons.Count -lt 2) { throw "Expected two icons, found $($icons.Count)" }
  return Get-Bounds $icons[$index].bounds
}

function Extract-Tags($doc) {
  $texts = @($doc.SelectNodes('//node[@text!=""]') | ForEach-Object { [string]$_.text })
  return @($texts | Where-Object {
    $_ -notin $baseline -and
    $_ -notmatch '\.(png|jpg|webp)' -and
    $_ -notmatch '^(宝马|2023款|车友们都关心的话题)' -and
    $_ -notmatch '^\*+$'
  } | Select-Object -Unique)
}

$results = @()
foreach ($category in $categories) {
  $located = Ensure-Visible $category
  $positive = Get-IconBounds $located.Node 0
  Tap-Bounds $positive
  $posDoc = Get-Xml "$category-positive"
  $posTags = Extract-Tags $posDoc
  cmd /c "adb -s $Serial exec-out screencap -p > `"$OutputDir\$category-positive.png`""

  $located = Ensure-Visible $category
  $negative = Get-IconBounds $located.Node 1
  Tap-Bounds $negative
  $negDoc = Get-Xml "$category-negative"
  $negTags = Extract-Tags $negDoc
  cmd /c "adb -s $Serial exec-out screencap -p > `"$OutputDir\$category-negative.png`""

  $located = Ensure-Visible $category
  $negative = Get-IconBounds $located.Node 1
  Tap-Bounds $negative

  $results += [pscustomobject]@{ category=$category; positive=$posTags; negative=$negTags }
}

$results | ConvertTo-Json -Depth 6 | Set-Content -Encoding utf8 (Join-Path $OutputDir 'tag-matrix.json')
$results | ConvertTo-Json -Depth 6
