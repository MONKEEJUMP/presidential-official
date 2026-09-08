param([string]$LegacyScript)
$ErrorActionPreference='Stop'
$ast=[Management.Automation.Language.Parser]::ParseFile($LegacyScript,[ref]$null,[ref]$null)
foreach($name in @('Get-NormalizedText','ConvertTo-CityDisplay','Remove-LocationSuffix','Get-BrandIdentity')) {
  $definition=$ast.Find({param($n) $n -is [Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq $name},$true)
  if(-not $definition){throw "Missing legacy identity function: $name"}
  Invoke-Expression $definition.Extent.Text
}
$script:CityChanges=[Collections.Generic.List[object]]::new()
$script:ClusteringFlags=[Collections.Generic.List[object]]::new()
$rows=[Console]::In.ReadToEnd()|ConvertFrom-Json
$result=foreach($row in $rows){
  $row|Add-Member city_display (ConvertTo-CityDisplay $row.city $row.state)
  $identity=Get-BrandIdentity $row
  [pscustomobject]@{id=$row.id;brand=$identity.display;state=$row.state;city=$row.city_display}
}
ConvertTo-Json -InputObject @($result) -Depth 5 -Compress
