# ✅ Cloudflare Tunnel — Deployment Verification Checklist

> Follow this checklist before declaring Ayursutra deployment complete

---

## Phase 1: Prerequisites (Do First)

- [ ] Cloudflare account created and active
- [ ] Domain added to Cloudflare (nameservers pointing there)
- [ ] Git repository initialized with `.gitignore` configured
- [ ] `.cloudflared` folder added to `.gitignore`
- [ ] All credentials stored securely (NOT in Git)

---

## Phase 2: Installation & Setup

### cloudflared Installation
- [ ] `cloudflared --version` returns a version number
- [ ] On Windows: `winget install` succeeded OR manual installation verified
- [ ] Executable in PATH: `where cloudflared` returns path

### Authentication
- [ ] `cloudflared tunnel login` completed
- [ ] Certificate saved: `cert.pem` exists in `C:\Users\{Username}\.cloudflared\`
- [ ] Browser authorization successful (no errors during login)

### Tunnel Creation
- [ ] Tunnel created: `cloudflared tunnel create ayursutra-prod`
- [ ] Tunnel ID saved in secure location
- [ ] Tunnel listed: `cloudflared tunnel list` shows "ayursutra-prod"
- [ ] Status shows: `CONNECTIONS` column not empty (should show locations)

---

## Phase 3: Configuration

### config.yml File
- [ ] File created: `C:\Users\{Username}\.cloudflared\config.yml`
- [ ] Tunnel ID correctly set in config
- [ ] Credentials file path matches your tunnel ID
- [ ] Frontend hostname: `frontend.yourdomain.com` → `http://localhost:5173`
- [ ] Backend hostname: `api.yourdomain.com` → `http://localhost:5000`
- [ ] Catch-all rule present: `- service: http_status:404`
- [ ] File permissions secure (Windows: read/write for user only)

### Configuration Validation
- [ ] `cloudflared tunnel ingress validate` returns "✓ Configuration is valid"
- [ ] No warnings or errors in output
- [ ] Test routing: `cloudflared tunnel ingress rule https://frontend.yourdomain.com` matches rule #1
- [ ] Test routing: `cloudflared tunnel ingress rule https://api.yourdomain.com` matches rule #2

---

## Phase 4: DNS Routes

### Creating Routes
- [ ] `cloudflared tunnel route dns ayursutra-prod frontend.yourdomain.com` succeeds
- [ ] `cloudflared tunnel route dns ayursutra-prod api.yourdomain.com` succeeds
- [ ] Output confirms CNAME records created

### Verifying in Cloudflare Dashboard
1. Go to **Cloudflare Dashboard** → your domain → **DNS** → **Records**
   - [ ] `frontend.yourdomain.com` shows as `CNAME` record
   - [ ] `api.yourdomain.com` shows as `CNAME` record
   - [ ] Both marked as "Proxied" ✅ (not "DNS only")
   - [ ] Target: `*.cfargotunnel.com`

2. DNS Propagation (wait 2-5 minutes)
   - [ ] `ping frontend.yourdomain.com` resolves to IP (not your server IP)
   - [ ] `ping api.yourdomain.com` resolves to IP (not your server IP)
   - [ ] ⚠️ If fails, try: `nslookup frontend.yourdomain.com` (use Cloudflare DNS: 1.1.1.1)

---

## Phase 5: Local Service Testing

### Backend Service
```powershell
# Terminal 1
cd ayursutra-backend
npm install
npm start
```
- [ ] Backend starts without errors
- [ ] Logs show: "Server running on port 5000" (or configured port)
- [ ] Health check works: `curl http://localhost:5000/health` or your health endpoint
- [ ] No error messages in console

### Frontend Service
```powershell
# Terminal 2
cd ayursutra-react
npm install
npm run dev
```
- [ ] Frontend starts without errors
- [ ] Logs show: "Local: http://localhost:5173" (or configured port)
- [ ] No error messages in console
- [ ] React app loads in browser at `http://localhost:5173`

---

## Phase 6: Tunnel Testing (Foreground Mode)

### Start Tunnel Manually
```powershell
# Terminal 3
cloudflared tunnel run ayursutra-prod
```

- [ ] Tunnel starts without errors
- [ ] Output shows "INF Starting tunnel..."
- [ ] Wait 5-10 seconds for connections to register
- [ ] See 4 connection lines:
  ```
  INF Registered tunnel connection connIndex=0 location=SJC
  INF Registered tunnel connection connIndex=1 location=SJC
  INF Registered tunnel connection connIndex=2 location=LAX
  INF Registered tunnel connection connIndex=3 location=LAX
  ```
- [ ] No "ERR" lines in output

### Test Frontend Access (HTTPS)
```powershell
# Terminal 4 (PowerShell or browser)
curl https://frontend.yourdomain.com
```
- [ ] No certificate warnings (HTTPS valid)
- [ ] Returns HTML content (not 502/503/504)
- [ ] React app loads in browser
- [ ] No CORS errors

### Test Backend Access (HTTPS)
```powershell
curl https://api.yourdomain.com/health
# or your endpoint
```
- [ ] Returns JSON response (not error)
- [ ] Status code 200 OK
- [ ] No certificate warnings

### Test API Communication
1. Frontend should load at `https://frontend.yourdomain.com`
2. Open browser DevTools → Network tab
3. Try an API call from frontend
4. Check:
   - [ ] API request goes to `https://api.yourdomain.com` (not localhost)
   - [ ] Request succeeds (200 response)
   - [ ] No CORS errors
   - [ ] Response has correct data

---

## Phase 7: Windows Service Installation

### Install Service
```powershell
# Run as Administrator
cloudflared tunnel service install --config C:\Users\YourUsername\.cloudflared\config.yml
```
- [ ] Command completes without errors
- [ ] Output confirms installation
- [ ] No permission errors

### Verify Service
```powershell
Get-Service cloudflared
```
- [ ] Status: `Running` or `Stopped`
- [ ] Startup Type: `Automatic`
- [ ] Display Name: `cloudflared`

### Start Service
```powershell
Start-Service cloudflared
```
- [ ] Service starts without errors
- [ ] `Get-Service cloudflared` shows `Running`

### Check Logs
```powershell
Get-EventLog -LogName Application -Source cloudflared -Newest 20
```
- [ ] No ERROR entries
- [ ] Shows successful tunnel registration
- [ ] Shows 4 active connections

---

## Phase 8: Reboot Test (Critical!)

### Reboot Machine
```powershell
Restart-Computer
# Wait for machine to restart (2-3 minutes)
```

### After Reboot
```powershell
Get-Service cloudflared
```
- [ ] Service auto-started (Status = Running)
- [ ] No manual intervention needed

### Test Access After Reboot
```powershell
curl https://frontend.yourdomain.com
curl https://api.yourdomain.com/health
```
- [ ] Both work immediately (no waiting)
- [ ] Tunnel reconnected automatically
- [ ] All 4 connections registered

---

## Phase 9: Security Verification

### Git Configuration
```bash
cd your-project-root
git status
```
- [ ] No `.cloudflared/` folder listed
- [ ] No `*.json` files listed
- [ ] No `.env` file listed
- [ ] `.gitignore` contains:
  ```
  .cloudflared/
  .env
  *.json
  cert.pem
  ```

### File Permissions
```powershell
# Check credentials file
Get-Item C:\Users\YourUsername\.cloudflared\*.json | Get-Acl
```
- [ ] Only your user has read/write permissions
- [ ] Administrators group listed (expected)
- [ ] No "Everyone" or public permissions

### Environment Variables
```powershell
ls -la $env:USERPROFILE\.cloudflared\
```
- [ ] Credentials .json file present and readable
- [ ] cert.pem present and readable
- [ ] config.yml contains no hardcoded secrets (if using token, it's in .env)

---

## Phase 10: Monitoring Setup

### Check Metrics (Optional but Recommended)
```powershell
curl http://localhost:2000/healthcheck
```
- [ ] Returns healthy status
- [ ] No connection errors

### View Logs
```powershell
Get-EventLog -LogName Application -Source cloudflared -Newest 50 | Format-Table
```
- [ ] No recent ERROR entries
- [ ] Shows periodic activity (connections maintained)
- [ ] Last entry recent (not old)

---

## Phase 11: Production Readiness

### Performance
- [ ] Website loads in < 2 seconds
- [ ] API responses < 500ms
- [ ] No timeout errors
- [ ] No 503/504 errors under normal load

### Security
- [ ] HTTPS everywhere (no mixed content warnings)
- [ ] Certificate valid and trusted
- [ ] No certificate warnings in browser
- [ ] All sensitive endpoints secured

### Monitoring
- [ ] Logs checked for errors
- [ ] Team notified of URLs
- [ ] Backup plan documented (tunnel recreation steps)
- [ ] Alert system configured (optional: if cloudflared stops)

---

## Phase 12: Documentation

- [ ] This checklist completed and signed
- [ ] `CLOUDFLARE_SETUP_AYURSUTRA.md` shared with team
- [ ] `CLOUDFLARE_QUICK_REFERENCE.md` shared with team
- [ ] Public URLs documented:
  - Frontend: `https://frontend.yourdomain.com`
  - API: `https://api.yourdomain.com`
- [ ] Deployment runbook updated
- [ ] Team training completed

---

## Sign-Off

| Role | Name | Date | Status |
|------|------|------|--------|
| Developer | _____________ | _____ | ✅ Pass / ❌ Fail |
| Lead | _____________ | _____ | ✅ Approved / ❌ Review |
| Ops | _____________ | _____ | ✅ Ready / ❌ Issue |

---

## 🆘 If Any Checks Fail

### For Failed Checks:
1. Note which phase/check failed
2. Go to **CLOUDFLARE_SETUP_AYURSUTRA.md** → Troubleshooting section
3. Follow fix steps
4. Re-run check
5. If still failing, escalate with full logs

### Collect Logs Before Escalating
```powershell
# Save logs to file
Get-EventLog -LogName Application -Source cloudflared -Newest 100 | Out-File cloudflared_logs.txt

# Save config (without secrets)
Copy-Item C:\Users\YourUsername\.cloudflared\config.yml config_backup.yml

# Save tunnel info
cloudflared tunnel list > tunnel_info.txt
```

---

## ✅ Final Sign-Off

- [ ] All phases passed ✅
- [ ] Website accessible at public URLs ✅
- [ ] No errors in logs ✅
- [ ] Team can access and use Ayursutra ✅
- [ ] Deployment complete! 🎉

---

**Print this checklist. Check off each item. Sign when complete.**
