# 🚀 Cloudflare Tunnel — Quick Reference Card
> Keep this open during deployment

---

## ⚡ One-Time Setup (First Time Only)

```powershell
# 1. Install
winget install --id Cloudflare.cloudflared

# 2. Login
cloudflared tunnel login

# 3. Create tunnel
cloudflared tunnel create ayursutra-prod

# 4. Copy TUNNEL_ID from output and save it

# 5. Create config file at C:\Users\YourUsername\.cloudflared\config.yml
# (Copy from CLOUDFLARE_SETUP_AYURSUTRA.md — Step 4)

# 6. Route DNS
cloudflared tunnel route dns ayursutra-prod frontend.yourdomain.com
cloudflared tunnel route dns ayursutra-prod api.yourdomain.com

# 7. Install as service
cloudflared tunnel service install --config C:\Users\YourUsername\.cloudflared\config.yml

# 8. Start service
Start-Service cloudflared
```

---

## 🎯 Daily Operations

### Start Development Mode
```powershell
# Terminal 1: Backend
cd ayursutra-backend
npm start

# Terminal 2: Frontend
cd ayursutra-react
npm run dev

# Terminal 3: Tunnel (if testing)
cloudflared tunnel run ayursutra-prod
```

### Production (Service)
```powershell
# Already running as Windows service
# Check status
Get-Service cloudflared

# View logs
Get-EventLog -LogName Application -Source cloudflared -Newest 20
```

### Test URLs
```
Frontend:  https://frontend.yourdomain.com
API:       https://api.yourdomain.com
Health:    https://api.yourdomain.com/health
```

---

## 🔧 Common Commands

| Task | Command |
|------|---------|
| **Check tunnel status** | `cloudflared tunnel list` |
| **Validate config** | `cloudflared tunnel ingress validate` |
| **View service status** | `Get-Service cloudflared` |
| **View logs** | `Get-EventLog -LogName Application -Source cloudflared -Newest 50` |
| **Restart tunnel** | `Restart-Service cloudflared` |
| **Stop tunnel** | `Stop-Service cloudflared` |
| **Start tunnel** | `Start-Service cloudflared` |
| **Test frontend URL** | `curl https://frontend.yourdomain.com` |
| **Test API URL** | `curl https://api.yourdomain.com/health` |

---

## 🆘 If Something Breaks

### Tunnel not connecting
```powershell
Stop-Service cloudflared
Start-Service cloudflared
# Wait 10 seconds
Get-Service cloudflared
```

### "Cannot reach origin service"
```powershell
# Check backend is running on port 5000
curl http://localhost:5000

# Check frontend is running on port 5173
curl http://localhost:5173

# Check config.yml has correct ports
notepad C:\Users\YourUsername\.cloudflared\config.yml
```

### DNS not resolving
```powershell
# Re-create DNS routes
cloudflared tunnel route dns ayursutra-prod frontend.yourdomain.com
cloudflared tunnel route dns ayursutra-prod api.yourdomain.com

# Wait 2-3 minutes for DNS to propagate
```

### Website shows 502 Bad Gateway
```powershell
# Restart both apps
Restart-Service cloudflared

# Restart backend
cd ayursutra-backend && npm start

# Restart frontend (in new terminal)
cd ayursutra-react && npm run dev
```

### Service won't start
```powershell
# Check for errors
Get-EventLog -LogName Application -Source cloudflared -Newest 20

# Reinstall service
cloudflared tunnel service uninstall
cloudflared tunnel service install --config C:\Users\YourUsername\.cloudflared\config.yml
Start-Service cloudflared
```

---

## 📊 What to Monitor

✅ **Good signs:**
- 4 tunnel connections in logs
- Service shows "running"
- Website loads with HTTPS
- No 502/503 errors

❌ **Bad signs:**
- 0 connections in tunnel
- Service showing "stopped"
- 502/503 errors
- Certificate errors
- Connection timeouts

---

## 🔐 Never Commit These Files

```
❌ .cloudflared/
❌ *.json (credentials)
❌ .env
❌ cert.pem
```

---

## 📞 Support Escalation

| Issue | Check | Solution |
|-------|-------|----------|
| Website down | Backend running? | `curl http://localhost:5000` |
| Slow requests | Tunnel connections? | Check logs for "connection" count |
| DNS issues | CNAME created? | Check Cloudflare dashboard → DNS |
| Auth failing | .env configured? | Verify API_URL points to HTTPS |

---

## 🎓 Full Docs

- **Full Setup Guide:** `CLOUDFLARE_SETUP_AYURSUTRA.md`
- **Complete Reference:** `cloudflare-tunnel-guide.md`
- **Cloudflare Docs:** https://developers.cloudflare.com/cloudflare-one/
