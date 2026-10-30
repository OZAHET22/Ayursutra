# 🔧 Cloudflare Tunnel — Windows Troubleshooting Guide
> Common issues and exact solutions for Ayursutra deployment

---

## 📋 Diagnostic Commands

Keep these ready to diagnose issues:

```powershell
# 1. Check tunnel service status
Get-Service cloudflared

# 2. View recent errors
Get-EventLog -LogName Application -Source cloudflared -Newest 20

# 3. Check if backend is running
curl http://localhost:5000 -ErrorAction SilentlyContinue

# 4. Check if frontend is running
curl http://localhost:5173 -ErrorAction SilentlyContinue

# 5. Verify tunnel config syntax
cloudflared tunnel ingress validate

# 6. List all tunnels
cloudflared tunnel list

# 7. Test DNS resolution
nslookup frontend.yourdomain.com
nslookup api.yourdomain.com

# 8. Check what's listening on ports
netstat -ano | findstr :5000
netstat -ano | findstr :5173
```

---

## 🆘 Issue #1: "Service cannot start"

### Symptoms
- Service status shows "Stopped" with red X
- Won't start when clicking "Start"
- Error in Event Viewer

### Diagnosis
```powershell
# Check detailed error
Get-EventLog -LogName Application -Source cloudflared -Newest 5 | Format-List

# Check if another instance is running
Get-Process cloudflared | Stop-Process -Force

# Try to run manually to see error
cloudflared tunnel run ayursutra-prod
```

### Solutions (Try in Order)

#### Solution A: Config File Path Issue
```powershell
# Verify config file exists and is readable
Test-Path "C:\Users\$env:USERNAME\.cloudflared\config.yml"

# Check the content
Get-Content "C:\Users\$env:USERNAME\.cloudflared\config.yml"

# If path wrong, reinstall service
cloudflared tunnel service uninstall
cloudflared tunnel service install --config "C:\Users\$env:USERNAME\.cloudflared\config.yml"
```

#### Solution B: Tunnel ID Mismatch
```powershell
# Get correct tunnel ID
cloudflared tunnel list

# Edit config.yml with correct ID
notepad "C:\Users\$env:USERNAME\.cloudflared\config.yml"

# Update these lines to match tunnel list output:
# tunnel: YOUR_ACTUAL_TUNNEL_ID
# credentials-file: C:\Users\YourUsername\.cloudflared\YOUR_ACTUAL_TUNNEL_ID.json

# Restart service
Restart-Service cloudflared
```

#### Solution C: Credentials File Missing
```powershell
# Check if credentials file exists
Get-ChildItem "C:\Users\$env:USERNAME\.cloudflared\" -Filter "*.json"

# If missing, recreate tunnel
cloudflared tunnel create ayursutra-prod
```

#### Solution D: Port Already in Use
```powershell
# Check if another cloudflared is running
Get-Process cloudflared

# Kill all instances
Get-Process cloudflared | Stop-Process -Force

# Wait 5 seconds
Start-Sleep 5

# Start service
Start-Service cloudflared
```

#### Solution E: Run as Administrator
```powershell
# Service must be installed by Administrator
# Uninstall and reinstall as Admin
# Right-click PowerShell → Run as Administrator

# Then run:
cloudflared tunnel service uninstall
cloudflared tunnel service install --config "C:\Users\$env:USERNAME\.cloudflared\config.yml"
Start-Service cloudflared
```

---

## 🆘 Issue #2: "Website shows 502 Bad Gateway"

### Symptoms
- Tunnel is running (service shows "Running")
- But `https://frontend.yourdomain.com` shows error
- Or API calls fail

### Diagnosis
```powershell
# Check backend running
curl http://localhost:5000
# Should return JSON, not error

# Check frontend running
curl http://localhost:5173
# Should return HTML, not error

# Check tunnel logs
Get-EventLog -LogName Application -Source cloudflared -Newest 30 | findstr "error\|ERR\|failed"

# Check tunnel connections
cloudflared tunnel list
# Should show 4 CONNECTIONS
```

### Solutions (Try in Order)

#### Solution A: Backend Not Running
```powershell
# Check if backend is actually running
Get-Process | findstr node

# If not running, start it
cd C:\path\to\ayursutra-backend
npm start

# Wait 5 seconds for it to fully start
Start-Sleep 5

# Test again
curl http://localhost:5000/health
```

#### Solution B: Backend on Wrong Port
```powershell
# Check what port backend is on
# Look at backend console output or .env file
cat .env | findstr PORT

# Update config.yml with correct port
notepad "C:\Users\$env:USERNAME\.cloudflared\config.yml"
# Change: service: http://localhost:5000 to correct port

# Restart tunnel
Restart-Service cloudflared
```

#### Solution C: Frontend Not Running
```powershell
# Check if frontend is running
Get-Process | findstr node

# Start frontend
cd C:\path\to\ayursutra-react
npm run dev

# Wait 10 seconds for Vite to start
Start-Sleep 10

# Test
curl http://localhost:5173
```

#### Solution D: Tunnel Not Connected
```powershell
# Check if tunnel is really running
Get-Service cloudflared

# Check connections
Get-EventLog -LogName Application -Source cloudflared -Newest 10 | findstr "connection\|registered"

# Should see 4 connections. If not:
Restart-Service cloudflared
Start-Sleep 10
Get-EventLog -LogName Application -Source cloudflared -Newest 10
```

#### Solution E: Origin Request Timeout
```yaml
# Edit config.yml and increase timeouts
# Add this to your ingress rules:

- hostname: frontend.yourdomain.com
  service: http://localhost:5173
  originRequest:
    connectTimeout: 60s
    tcpKeepAlive: 30s
    keepAliveConnections: 100
    keepAliveTimeout: 120s

- hostname: api.yourdomain.com
  service: http://localhost:5000
  originRequest:
    connectTimeout: 60s
    tcpKeepAlive: 30s
    keepAliveConnections: 100
    keepAliveTimeout: 120s
```

Then restart service.

---

## 🆘 Issue #3: "DNS not resolving"

### Symptoms
- `nslookup frontend.yourdomain.com` returns "Non-existent domain"
- Website shows "Can't reach this site"
- Browser says "ERR_NAME_NOT_RESOLVED"

### Diagnosis
```powershell
# Check if DNS CNAME was created
nslookup frontend.yourdomain.com 1.1.1.1
nslookup api.yourdomain.com 1.1.1.1

# Check what DNS records exist
# Or go to Cloudflare Dashboard → DNS → Records
```

### Solutions

#### Solution A: DNS Routes Not Created
```powershell
# Create DNS routes
cloudflared tunnel route dns ayursutra-prod frontend.yourdomain.com
cloudflared tunnel route dns ayursutra-prod api.yourdomain.com

# Output should say:
# "Added CNAME frontend.yourdomain.com..."
# "Added CNAME api.yourdomain.com..."

# Wait 2-5 minutes for DNS propagation
Start-Sleep 180

# Test
nslookup frontend.yourdomain.com
```

#### Solution B: DNS Not Propagated
```powershell
# DNS can take 2-5 minutes to propagate
# Verify in Cloudflare Dashboard:
# 1. Go to yourdomain.com → DNS → Records
# 2. Look for frontend.yourdomain.com CNAME record
# 3. Should show: CNAME → xxxxxxxx.cfargotunnel.com
# 4. Should say "Proxied" (orange cloud)

# If not there:
cloudflared tunnel route dns ayursutra-prod frontend.yourdomain.com

# If CNAME is wrong or not proxied, delete and recreate:
# In Cloudflare Dashboard, delete the record
# Then run route dns command again
```

#### Solution C: Wrong Nameservers
```powershell
# Check if domain uses Cloudflare nameservers
nslookup -type=NS yourdomain.com

# Should return Cloudflare nameservers, e.g.:
# ns1.cloudflare.com
# ns2.cloudflare.com

# If not, update nameservers at your registrar to point to Cloudflare
# This can take 24-48 hours to propagate
```

#### Solution D: Clear DNS Cache
```powershell
# Clear Windows DNS cache
ipconfig /flushdns

# Wait 5 seconds
Start-Sleep 5

# Try again
nslookup frontend.yourdomain.com 1.1.1.1

# Or try from Command Prompt:
cmd /c ipconfig /flushdns
```

---

## 🆘 Issue #4: "Certificate Errors" (HTTPS Issues)

### Symptoms
- Browser shows red lock / "Not Secure"
- Certificate name mismatch
- "NET::ERR_CERT_AUTHORITY_INVALID"

### Diagnosis
```powershell
# Check certificate validity (in browser)
# URL bar → click lock icon → Certificate

# Should show:
# - Issued to: yourdomain.com
# - Issued by: Cloudflare
# - Status: Valid
```

### Solutions

#### Solution A: Cloudflare Not Proxying
```powershell
# In Cloudflare Dashboard → DNS → Records
# Check frontend.yourdomain.com and api.yourdomain.com

# Both should show:
# Type: CNAME
# Status: "Proxied" (orange cloud) ← NOT "DNS only"

# If showing "DNS only", click to change to "Proxied"
```

#### Solution B: SSL/TLS Settings
```
Go to Cloudflare Dashboard:
1. yourdomain.com → SSL/TLS → Overview
2. Change mode to "Full" or "Full (Strict)"
3. Wait 2-5 minutes

Mode Guide:
- Flexible: for HTTP origins (not recommended)
- Full: for HTTPS origins with self-signed certs
- Full (Strict): for HTTPS with valid certs
```

#### Solution C: Certificate Not Yet Issued
```powershell
# Cloudflare issues certs automatically
# Can take up to 15 minutes
# Wait 15 minutes, then test again

# Check cert age in browser
# URL → lock → Certificate → "Valid from" date
```

#### Solution D: Verify Origin Certificate
```yaml
# In config.yml, set:
originRequest:
  noTLSVerify: false    # Verify origin cert

# If origin uses self-signed cert:
originRequest:
  noTLSVerify: true     # Skip verification

# Then restart
Restart-Service cloudflared
```

---

## 🆘 Issue #5: "Cannot connect to the database"

### Symptoms
- Backend starts but API calls fail with "Cannot connect to database"
- Error in backend logs: "ECONNREFUSED", "connection failed"

### Solutions

#### Check Database Connection
```powershell
# In ayursutra-backend directory
cat .env | findstr "DB_"
# Check DB_HOST, DB_USER, DB_PASSWORD

# Verify database is running and accessible
# Database should be on machine or network accessible

# Test connection from local machine
ping <DB_HOST>

# Check backend can reach database
cd ayursutra-backend
npm start
# Check console for connection errors
```

#### For Windows SQL Server
```powershell
# Check SQL Server is running
Get-Service | findstr -i sql

# Should show service running, e.g.:
# MSSQL$SQLEXPRESS    Running

# Check port (default 1433)
netstat -ano | findstr :1433
```

#### For MongoDB
```powershell
# Check MongoDB is running
Get-Service | findstr -i mongo

# If not running, start it
Start-Service MongoDB

# Test connection
mongo "mongodb://localhost:27017"
```

#### Update Connection String
```bash
# In .env file:
DB_HOST=localhost          # or your DB server IP
DB_PORT=5432              # or 1433 for SQL Server
DB_USER=your_db_user
DB_PASSWORD=your_db_pass
DB_NAME=ayursutra_db

# Make sure backend .env has these set
```

---

## 🆘 Issue #6: "CORS Errors" (Frontend to Backend)

### Symptoms
- Frontend loads at `https://frontend.yourdomain.com`
- But API calls fail with "CORS policy" error
- DevTools Network tab shows error from browser

### Diagnosis
```
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try action that calls API
4. Look for red/failed request
5. Click on request → Response
6. Check if error mentions CORS or Access-Control
```

### Solutions

#### Solution A: Update Frontend API URL
```javascript
// In frontend .env or config:
VITE_API_URL=https://api.yourdomain.com

// NOT:
VITE_API_URL=http://localhost:5000  ❌ Wrong in production

// Rebuild frontend:
npm run build
```

#### Solution B: Enable CORS in Backend
```javascript
// In backend (Express example):
const cors = require('cors');

app.use(cors({
  origin: [
    'https://frontend.yourdomain.com',
    'https://yourdomain.com',
    'http://localhost:5173'  // for dev
  ],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

Then restart backend.

#### Solution C: Check API Requests
```powershell
# Frontend should call:
https://api.yourdomain.com/endpoint

# NOT:
http://localhost:5000/endpoint  ❌
http://api.yourdomain.com/endpoint  (without HTTPS) ❌
```

---

## 🆘 Issue #7: "Tunnel service keeps stopping"

### Symptoms
- Service says "Running", but stops after a few minutes
- Manual `cloudflared tunnel run` works fine
- Event Viewer shows crashes

### Diagnosis
```powershell
# Check crash logs
Get-EventLog -LogName Application -Source cloudflared -Newest 30 | Format-List

# Check if backend is crashing
# Look at backend console for errors

# Check firewall
# Windows Firewall might be killing connection
```

### Solutions

#### Solution A: Firewall Blocking
```powershell
# Add cloudflared to Windows Firewall
# Settings → Firewall & Network Protection → Allow app through firewall
# Check cloudflared is listed and enabled

# Or allow via PowerShell:
New-NetFirewallRule -DisplayName "Cloudflared" `
  -Direction Outbound -Action Allow -Program "C:\Program Files\Cloudflare\Tunnel\cloudflared.exe"
```

#### Solution B: Config File Corruption
```powershell
# Re-create config.yml
notepad "C:\Users\$env:USERNAME\.cloudflared\config.yml"

# Validate
cloudflared tunnel ingress validate

# If error, fix it
# Then restart service
Restart-Service cloudflared
```

#### Solution C: Out of Memory
```powershell
# Check memory usage
Get-Process cloudflared | Select-Object Name, WorkingSet

# Restart service
Restart-Service cloudflared

# If keeps happening, check for memory leaks in your app
```

---

## 🆘 Issue #8: "Tunnel keeps disconnecting/reconnecting"

### Symptoms
- Logs show constant: "reconnecting..." or "connection lost"
- Website intermittently unavailable
- "Service unavailable" errors

### Diagnosis
```powershell
# Check logs for pattern
Get-EventLog -LogName Application -Source cloudflared -Newest 50 | grep -i "disconnect\|reconnect\|lost"

# Check network stability
# Try: ping -t 8.8.8.8
# If many timeouts, network issue

# Check if backend is slow
# Add logging to backend to see response times
```

### Solutions

#### Solution A: Network Instability
```
If your network keeps dropping:
1. Check WiFi signal strength
2. Consider wired connection
3. Restart network equipment
4. Check with ISP for outages
```

#### Solution B: Backend Hanging
```powershell
# Check if backend is responding slowly
curl http://localhost:5000
# Should respond quickly

# If slow, check backend:
# - Database queries hanging?
# - CPU maxed out?
# - Memory leak?

# Check processes
Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 5
```

#### Solution C: Increase Timeout/KeepAlive
```yaml
# In config.yml
originRequest:
  connectTimeout: 60s        # Increase timeout
  tcpKeepAlive: 30s         # More frequent keep-alive
  keepAliveConnections: 100  # More connections
  keepAliveTimeout: 120s     # Longer timeout

# Restart
Restart-Service cloudflared
```

#### Solution D: Restart Daily
```powershell
# Schedule daily restart (as temporary fix)
# Task Scheduler:
# 1. Open Task Scheduler
# 2. Create Basic Task
# 3. Name: "Restart Cloudflared"
# 4. Trigger: Daily, 2:00 AM
# 5. Action: Start a program: C:\Windows\System32\net.exe
# 6. Argument: stop cloudflared && timeout /t 5 && net start cloudflared
```

---

## 🆘 Issue #9: "Cannot find tunnels command"

### Symptoms
- `cloudflared tunnel list` returns "command not found"
- `cloudflared --version` works but tunnel commands don't

### Solutions

```powershell
# Verify installation
where cloudflared

# Reinstall
winget uninstall Cloudflare.cloudflared
winget install --id Cloudflare.cloudflared

# Restart PowerShell (might need to refresh PATH)
# Close and open new PowerShell window

# Test again
cloudflared tunnel list
```

---

## 🆘 Issue #10: "Different certificate after reboot"

### Symptoms
- Certificate is different after machine reboot
- Browser shows warning about new certificate

### Diagnosis
```powershell
# This is normal on first reboot after service install
# Cloudflare generates cert for first connection

# Should stabilize after 1-2 reboots
```

### Solution
```powershell
# Just wait. This is normal behavior.
# If persists after 3 reboots, check:
Get-EventLog -LogName Application -Source cloudflared -Newest 20
```

---

## 📞 Escalation Path

If none of these solutions work:

1. **Collect logs:**
```powershell
Get-EventLog -LogName Application -Source cloudflared -Newest 100 | Export-Csv logs.csv

# Save config (no secrets):
Copy-Item "C:\Users\$env:USERNAME\.cloudflared\config.yml" config_backup.yml
```

2. **Collect environment:**
```powershell
$env:ComputerName
$env:UserName
[System.Environment]::OSVersion
cloudflared --version
node --version
npm --version
```

3. **Collect error messages** (full text, not just first line)

4. **Contact support** with all above information

---

## ✅ Health Check Command

Run this periodically to check overall health:

```powershell
Write-Host "=== Cloudflare Tunnel Health Check ===" -ForegroundColor Green
Write-Host ""

Write-Host "1. Service Status:"
Get-Service cloudflared

Write-Host ""
Write-Host "2. Recent Errors:"
Get-EventLog -LogName Application -Source cloudflared -Newest 10 | Where-Object {$_.EntryType -eq "Error"} | Format-Table

Write-Host ""
Write-Host "3. Backend Status:"
$backend = curl http://localhost:5000 -ErrorAction SilentlyContinue
if ($backend) { Write-Host "✅ Backend running" } else { Write-Host "❌ Backend NOT running" }

Write-Host ""
Write-Host "4. Frontend Status:"
$frontend = curl http://localhost:5173 -ErrorAction SilentlyContinue
if ($frontend) { Write-Host "✅ Frontend running" } else { Write-Host "❌ Frontend NOT running" }

Write-Host ""
Write-Host "5. Tunnel Connections:"
cloudflared tunnel list

Write-Host ""
Write-Host "=== Check Complete ===" -ForegroundColor Green
```

Save as `health_check.ps1` and run daily.

---

**Last Updated:** April 30, 2026  
**Version:** 1.0  
**For Issues:** See corresponding section above
