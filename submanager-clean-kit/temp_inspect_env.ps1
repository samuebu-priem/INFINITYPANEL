Get-ChildItem -Path backend -Filter ".env*" -Force | ForEach-Object {
  Write-Host ("FILE: " + $_.FullName)
  Get-Content $_.FullName | Out-Host
  Write-Host "---FILE---"
}
