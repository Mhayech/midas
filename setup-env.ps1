# PowerShell script to set up environment variables for development
# Run this script before starting the backend

Write-Host "Setting up environment variables for development..." -ForegroundColor Green

# Set CI mode to true to use Ethereal Email for testing
$env:BC_CI = "true"

# Set other required environment variables
$env:NODE_ENV = "development"
$env:BC_HTTPS = "false"
$env:BC_DB_URI = "mongodb://admin:admin@localhost:27018/bookcars?authSource=admin"
$env:BC_DB_SSL = "false"
$env:BC_COOKIE_SECRET = "your-cookie-secret-key-here"
$env:BC_AUTH_COOKIE_DOMAIN = "localhost"
$env:BC_JWT_SECRET = "your-jwt-secret-key-here"
$env:BC_JWT_EXPIRE_AT = "86400"
$env:BC_TOKEN_EXPIRE_AT = "86400"
$env:BC_DEFAULT_LANGUAGE = "en"
$env:BC_MINIMUM_AGE = "18"
$env:BC_ADMIN_HOST = "http://localhost:3001"
$env:BC_FRONTEND_HOST = "http://localhost:8080"

# CDN paths (these will be created automatically by the application)
$env:BC_CDN_ROOT = "C:\temp\cdn\bookcars"
$env:BC_CDN_USERS = "C:\temp\cdn\bookcars\users"
$env:BC_CDN_TEMP_USERS = "C:\temp\cdn\bookcars\temp\users"
$env:BC_CDN_CARS = "C:\temp\cdn\bookcars\cars"
$env:BC_CDN_TEMP_CARS = "C:\temp\cdn\bookcars\temp\cars"
$env:BC_CDN_LOCATIONS = "C:\temp\cdn\bookcars\locations"
$env:BC_CDN_TEMP_LOCATIONS = "C:\temp\cdn\bookcars\temp\locations"
$env:BC_CDN_CONTRACTS = "C:\temp\cdn\bookcars\contracts"
$env:BC_CDN_TEMP_CONTRACTS = "C:\temp\cdn\bookcars\temp\contracts"
$env:BC_CDN_LICENSES = "C:\temp\cdn\bookcars\licenses"
$env:BC_CDN_TEMP_LICENSES = "C:\temp\cdn\bookcars\temp\licenses"

Write-Host "Environment variables set successfully!" -ForegroundColor Green
Write-Host "BC_CI is set to true - this will use Ethereal Email for testing" -ForegroundColor Yellow
Write-Host "You can now start the backend without SMTP configuration issues." -ForegroundColor Green

# Create CDN directories if they don't exist
Write-Host "Creating CDN directories..." -ForegroundColor Yellow
$cdnDirs = @(
    "C:\temp\cdn\bookcars\users",
    "C:\temp\cdn\bookcars\temp\users",
    "C:\temp\cdn\bookcars\cars",
    "C:\temp\cdn\bookcars\temp\cars",
    "C:\temp\cdn\bookcars\locations",
    "C:\temp\cdn\bookcars\temp\locations",
    "C:\temp\cdn\bookcars\contracts",
    "C:\temp\cdn\bookcars\temp\contracts",
    "C:\temp\cdn\bookcars\licenses",
    "C:\temp\cdn\bookcars\temp\licenses"
)

foreach ($dir in $cdnDirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created directory: $dir" -ForegroundColor Gray
    }
}

Write-Host "Setup complete! You can now run your backend." -ForegroundColor Green
