param(
  [Parameter(Mandatory=$true)]
  [string]$BucketName,

  [Parameter(Mandatory=$true)]
  [string]$ApiUrl,

  [string]$DistributionId = ""
)

$ErrorActionPreference = "Stop"

Push-Location "$PSScriptRoot\..\frontend"
try {
  "VITE_API_URL=$ApiUrl" | Set-Content -Encoding ASCII -Path ".env.production"
  npm.cmd install
  npm.cmd run build
  aws s3 sync dist "s3://$BucketName" --delete

  if ($DistributionId -ne "") {
    aws cloudfront create-invalidation --distribution-id $DistributionId --paths "/*"
  }
}
finally {
  Pop-Location
}
