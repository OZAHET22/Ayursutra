# 🚀 Cloudflare Tunnel Setup — Ayursutra Project
> Step-by-step implementation for Ayursutra React Frontend + Node.js Backend

---

## 📋 Quick Overview

| Component | Current Setup | Tunnel Configuration |
|-----------|--------------|----------------------|
| Frontend | React (Vite) | `frontend.yourdomain.com` → `localhost:5173` |
| Backend | Node.js/Express | `api.yourdomain.com` → `localhost:5000` |
| Admin Panel | Future | `admin.yourdomain.com` → `localhost:9000` |

---

## ✅ Prerequisite Checklist

Before starting, verify:

```
✅ Cloudflare account created (free tier OK)
✅ Your domain added to Cloudflare (nameservers pointing there)
✅ Ayursutra backend running: npm start (check port in .env)
✅ Ayursutra frontend running: npm run dev (should be localhost:5173)
✅ Both apps accessible locally without errors
✅ Git is initialized with .gitignore configured
```

---

## 🔧 Step 1: Install cloudflared (Windows)

### Option A: Windows Package Manager (Easiest)

```powershell
# Run PowerShell as Administrator
winget install --id Cloudflare.cloudflared

# Verify installation
cloudflared --version
```

### Option B: Manual Download

1. Download latest release: https://github.com/cloudflare/cloudflared/releases
2. Look for: `cloudflared-windows-amd64.exe`
3. Add to `C:\Program Files\Cloudflare\Tunnel\` or add to PATH
4. Verify:
   ```powershell
   cloudflared --version
   ```

---

## 🔐 Step 2: Login to Cloudflare

```powershell
cloudflared tunnel login
```

**Process:**
1. Browser opens automatically
2. Log in to your Cloudflare account
3. Select your domain
4. Certificate saved automatically

**Certificate location:**
```
C:\Users\{YourUsername}\.cloudflared\cert.pem
```

---

## 🌐 Step 3: Create Tunnel

```powershell
cloudflared tunnel create ayursutra-prod
```

**Output will show:**
```
Tunnel credentials written to: C:\Users\{YourUsername}\.cloudflared\{TUNNEL_ID}.json
Created tunnel ayursutra-prod with id {TUNNEL_ID}
```

**⚠️ CRITICAL: Save this TUNNEL_ID — you'll need it next**

Verify tunnel created:
```powershell
cloudflared tunnel list
```

---

## 📝 Step 4: Create config.yml

### Location
```
C:\Users\{YourUsername}\.cloudflared\config.yml
```

### Content for Ayursutra

```yaml
# ═══════════════════════════════════════════════════════════
# AYURSUTRA TUNNEL CONFIGURATION
# ═══════════════════════════════════════════════════════════

tunnel: YOUR_TUNNEL_ID_HERE
credentials-file: C:\Users\{YourUsername}\.cloudflared\YOUR_TUNNEL_ID_HERE.json

# Logging configuration
loglevel: info                    # info | debug | warn | error
logfile: C:\logs\cloudflared.log  # Create C:\logs folder first

# Metrics for monitoring (optional)
metrics: localhost:2000

# Disable auto-update in production
no-autoupdate: true

# ═══════════════════════════════════════════════════════════
# INGRESS RULES (order matters — first match wins)
# ═══════════════════════════════════════════════════════════

ingress:
  
  # ── REACT FRONTEND ───────────────────────────────────────
  - hostname: frontend.yourdomain.com
    service: http://localhost:5173
    originRequest:
      connectTimeout: 30s
      tcpKeepAlive: 15s
      keepAliveConnections: 100
      keepAliveTimeout: 90s
      noTLSVerify: false

  # ── NODE.JS BACKEND API ──────────────────────────────────
  - hostname: api.yourdomain.com
    service: http://localhost:5000
    originRequest:
      connectTimeout: 30s
      tcpKeepAlive: 15s
      keepAliveConnections: 100
      keepAliveTimeout: 90s
      noTLSVerify: false

  # ── PATH-BASED ROUTING (API under main domain) ──────────
  # Uncomment if you want api.yourdomain.com/api/* to route to backend
  # - hostname: frontend.yourdomain.com
  #   path: /api/.*
  #   service: http://localhost:5000
  #   originRequest:
  #     connectTimeout: 30s

  # ── CATCH-ALL (REQUIRED - must be last) ──────────────────
  - service: http_status:404
```

### Replace the Tunnel ID

Replace `YOUR_TUNNEL_ID_HERE` with the actual ID from Step 3:

```powershell
# Get your tunnel ID
cloudflared tunnel list

# Then update config.yml with the ID shown
# Example ID: abc123de-5678-abcd-ef12-345678901234
```

---

## ✔️ Step 5: Validate Configuration

```powershell
cloudflared tunnel ingress validate
```

**Expected output:**
```
✓ Configuration is valid
```

**If errors appear, fix config.yml and revalidate.**

---

## 🌍 Step 6: Route DNS

Create DNS CNAME records in Cloudflare automatically:

```powershell
# Frontend
cloudflared tunnel route dns ayursutra-prod frontend.yourdomain.com

# Backend API
cloudflared tunnel route dns ayursutra-prod api.yourdomain.com
```

**Verify in Cloudflare Dashboard:**
1. Go to your domain → DNS → Records
2. Look for CNAME entries pointing to `*.cfargotunnel.com`

---

## 🧪 Step 7: Test Tunnel (Manual Run)

### Start the tunnel

```powershell
cloudflared tunnel run ayursutra-prod
```

### Expected output

```
INF Starting tunnel tunnelID=abc123de...
INF Registered tunnel connection connIndex=0 location=SJC
INF Registered tunnel connection connIndex=1 location=SJC
INF Registered tunnel connection connIndex=2 location=LAX
INF Registered tunnel connection connIndex=3 location=LAX
```

✅ **4 connections = healthy tunnel**

### Test in browser

- Frontend: `https://frontend.yourdomain.com`
- Backend: `https://api.yourdomain.com/health` (or your health endpoint)

### If it works
Press `Ctrl+C` and proceed to Step 8

### If it fails
Check [Troubleshooting](#troubleshooting) section below

---

## 🔧 Step 8: Run as Windows Service (Production)

### Install as Service

```powershell
# Run as Administrator
cloudflared tunnel service install `
  --config C:\Users\{YourUsername}\.cloudflared\config.yml
```

### Verify Service Installed

```powershell
Get-Service cloudflared
```

### Start Service

```powershell
# Start now
Start-Service cloudflared

# Auto-start on boot (should be automatic)
Set-Service cloudflared -StartupType Automatic

# Check status
Get-Service cloudflared
```

### Check Logs

```powershell
# View recent logs
Get-EventLog -LogName Application -Source cloudflared -Newest 20

# Continuous logs (requires modern Windows 11/Server 2022)
# Or check log file if configured:
Get-Content C:\logs\cloudflared.log -Tail 20 -Wait
```

---

## 🐳 Alternative: Docker Deployment

If you're running in Docker (recommended for production):

### docker-compose.yml

```yaml
version: "3.8"

services:
  # Backend
  backend:
    build: ./ayursutra-backend
    container_name: ayursutra_backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=5000
      - DB_HOST=${DB_HOST}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
    networks:
      - ayursutra_net
    expose:
      - "5000"

  # Frontend
  frontend:
    build: ./ayursutra-react
    container_name: ayursutra_frontend
    restart: unless-stopped
    environment:
      - VITE_API_URL=https://api.yourdomain.com
    networks:
      - ayursutra_net
    expose:
      - "5173"

  # Cloudflare Tunnel
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: ayursutra_tunnel
    restart: unless-stopped
    command: tunnel --no-autoupdate run
    environment:
      - TUNNEL_TOKEN=${TUNNEL_TOKEN}
    networks:
      - ayursutra_net
    depends_on:
      - backend
      - frontend

networks:
  ayursutra_net:
    driver: bridge
```

### .env file

```env
TUNNEL_TOKEN=eyJhIjoiO_YOUR_ACTUAL_TOKEN_HERE
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
```

### .gitignore

Add these lines:
```
.env
.cloudflared/
*.json
*.pem
```

---

## 🔒 Step 9: Security Hardening

### Credentials File Permissions

```powershell
# Windows: credentials are already restricted by ACL
# Verify file exists and is readable only by your user
```

### Add to .gitignore

```bash
# In your project root
echo ".env" >> .gitignore
echo ".cloudflared/" >> .gitignore
echo "*.json" >> .gitignore
```

### Optional: Zero Trust Access (Protect Admin Panel)

If you add an admin panel later:

1. Go to Cloudflare Dashboard → Zero Trust (one.dash.cloudflare.com)
2. Navigate to Access → Applications → Add Application
3. Select **Self-hosted**
4. Set hostname to `admin.yourdomain.com`
5. Add policy: Allow specific emails (`@yourcompany.com`)
6. Users must log in via one-time PIN

---

## 📊 Step 10: Monitoring & Logs

### View Tunnel Health

```powershell
# Check service status
Get-Service cloudflared

# Check metrics (if enabled)
Invoke-WebRequest http://localhost:2000/healthcheck

# Prometheus metrics
Invoke-WebRequest http://localhost:2000/metrics
```

### Logs Location

```
C:\logs\cloudflared.log  (if configured in config.yml)
```

Monitor these:
- Connection count (should show 4 active)
- Request errors
- DNS resolution issues

---

## 🚨 Troubleshooting

### ❌ "Cannot reach origin service"

**Solution:**
```powershell
# Check if backend is running
curl http://localhost:5000/health

# Check if frontend is running
curl http://localhost:5173

# Verify config.yml ports match your .env
```

### ❌ "DNS not resolving"

**Solution:**
```powershell
# Re-create DNS routes
cloudflared tunnel route dns ayursutra-prod frontend.yourdomain.com
cloudflared tunnel route dns ayursutra-prod api.yourdomain.com

# Verify in Cloudflare dashboard
# DNS → Records → look for CNAME entries
```

### ❌ "502 Bad Gateway"

**Cause:** Tunnel running but app crashed

**Solution:**
```powershell
# Restart backend
cd ayursutra-backend
npm start

# Restart frontend
cd ayursutra-react
npm run dev

# Restart tunnel service
Restart-Service cloudflared
```

### ❌ Service won't start

**Solution:**
```powershell
# Check for errors
Get-EventLog -LogName Application -Source cloudflared -Newest 20

# Verify config file path
Test-Path C:\Users\{YourUsername}\.cloudflared\config.yml

# Manually run to see real errors
cloudflared tunnel run ayursutra-prod
```

### ❌ Multiple tunnels running

**Solution:**
```powershell
# Find all running
Get-Process cloudflared

# Kill all instances
Stop-Process -Name cloudflared -Force

# Remove service
cloudflared tunnel service uninstall

# Reinstall properly
cloudflared tunnel service install --config C:\Users\{YourUsername}\.cloudflared\config.yml
```

---

## 📋 Pre-Production Checklist

```
INSTALLATION & SETUP
─────────────────────────────────────────────────────
[ ] cloudflared installed (cloudflared --version)
[ ] Logged in to Cloudflare (cert.pem exists)
[ ] Tunnel created (ID saved safely)
[ ] config.yml created with correct paths
[ ] Configuration validated (cloudflared tunnel ingress validate)
[ ] DNS routes created for both domains

TESTING
─────────────────────────────────────────────────────
[ ] Tunnel tested in foreground (cloudflared tunnel run)
[ ] Frontend loads at https://frontend.yourdomain.com
[ ] Backend accessible at https://api.yourdomain.com
[ ] API calls work from frontend to backend
[ ] SSL/TLS certificates showing valid in browser

SERVICE SETUP
─────────────────────────────────────────────────────
[ ] Windows service installed
[ ] Service set to start automatically
[ ] Service starts without errors (Get-Service cloudflared)
[ ] Tested: reboot machine → tunnel comes back up

SECURITY & SECRETS
─────────────────────────────────────────────────────
[ ] .cloudflared directory NOT in Git
[ ] credentials .json file NOT in Git
[ ] .env file NOT in Git
[ ] .gitignore configured correctly
[ ] Credentials file permissions secure (Windows ACL)

MONITORING
─────────────────────────────────────────────────────
[ ] Logs checked for errors
[ ] 4 tunnel connections showing in logs
[ ] Both services (frontend/backend) healthy
[ ] Metrics endpoint accessible (localhost:2000)

DOCUMENTATION
─────────────────────────────────────────────────────
[ ] Team notified of public URLs
[ ] Deployment runbook updated
[ ] Credentials stored in secure vault (not Git)
[ ] Disaster recovery plan for tunnel recreation
```

---

## 🚀 Quick Command Reference

```powershell
# ── Setup ─────────────────────────────────────────
cloudflared tunnel login
cloudflared tunnel create ayursutra-prod
cloudflared tunnel list

# ── Testing ──────────────────────────────────────
cloudflared tunnel run ayursutra-prod
cloudflared tunnel ingress validate

# ── DNS ──────────────────────────────────────────
cloudflared tunnel route dns ayursutra-prod frontend.yourdomain.com
cloudflared tunnel route dns ayursutra-prod api.yourdomain.com
cloudflared tunnel route dns list

# ── Service (Windows) ────────────────────────────
cloudflared tunnel service install --config C:\Users\{Username}\.cloudflared\config.yml
Start-Service cloudflared
Stop-Service cloudflared
Restart-Service cloudflared
Get-Service cloudflared

# ── Monitoring ───────────────────────────────────
Get-EventLog -LogName Application -Source cloudflared -Newest 20
Get-Process cloudflared
Get-Content C:\logs\cloudflared.log -Tail 50 -Wait
```

---

## 📁 Final File Structure

```
C:\Users\{YourUsername}\
└── .cloudflared/
    ├── cert.pem                          # Login certificate
    ├── config.yml                        # Your tunnel config
    └── {TUNNEL_ID}.json                 # Credentials (SECRET)

Your Project Root\
├── .gitignore                            # *.json, .env, .cloudflared/
├── .env                                  # NOT committed
├── docker-compose.yml                    # (if using Docker)
├── ayursutra-backend/                    # Running on :5000
└── ayursutra-react/                      # Running on :5173
```

---

## 🔗 Useful Resources

- **Cloudflare Tunnel Docs:** https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- **Complete Guide:** See `cloudflare-tunnel-guide.md` in this project
- **Cloudflare Dashboard:** https://dash.cloudflare.com
- **Zero Trust:** https://one.dash.cloudflare.com

---

*Production-ready Ayursutra deployment with zero open ports and automatic HTTPS.*  
*Last updated: April 30, 2026*
