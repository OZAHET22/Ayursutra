# 🚇 Cloudflare Tunnel — Complete Senior Developer Guide
> Zero open ports. Free HTTPS. No public IP required.  
> Written from 10 years of production experience.

---

## 📌 Table of Contents

1. [What is Cloudflare Tunnel & Why Use It](#1-what-is-cloudflare-tunnel--why-use-it)
2. [Architecture — How It Actually Works](#2-architecture--how-it-actually-works)
3. [Prerequisites](#3-prerequisites)
4. [Install cloudflared](#4-install-cloudflared)
5. [Login to Cloudflare](#5-login-to-cloudflare)
6. [Create a Tunnel](#6-create-a-tunnel)
7. [Write config.yml](#7-write-configyml)
8. [Route DNS to Tunnel](#8-route-dns-to-tunnel)
9. [Run the Tunnel (Test Mode)](#9-run-the-tunnel-test-mode)
10. [Run as System Service (Production)](#10-run-as-system-service-production)
11. [Docker — Single Container](#11-docker--single-container)
12. [Docker Compose — Full Stack](#12-docker-compose--full-stack)
13. [Multiple Apps / Subdomains (One Tunnel)](#13-multiple-apps--subdomains-one-tunnel)
14. [WebSocket Support](#14-websocket-support)
15. [SSH Access via Tunnel](#15-ssh-access-via-tunnel)
16. [HTTPS & TLS Settings](#16-https--tls-settings)
17. [Zero Trust Access (Auth Protection)](#17-zero-trust-access-auth-protection)
18. [Useful CLI Commands](#18-useful-cli-commands)
19. [Logs & Monitoring](#19-logs--monitoring)
20. [Troubleshooting (Real Problems)](#20-troubleshooting-real-problems)
21. [Security Hardening](#21-security-hardening)
22. [Production Checklist](#22-production-checklist)

---

## 1. What is Cloudflare Tunnel & Why Use It

Cloudflare Tunnel creates an **encrypted outbound connection** from your server to Cloudflare's edge network. Public traffic enters via Cloudflare and flows back through this tunnel to your app.

### You get this for FREE:
- ✅ No public IP needed (works behind NAT, router, university network)
- ✅ No open inbound ports (no port forwarding, no firewall holes)
- ✅ Automatic HTTPS with valid TLS cert
- ✅ DDoS protection via Cloudflare
- ✅ Hide your real server IP from the internet
- ✅ Works on any machine: VPS, Raspberry Pi, local laptop, Docker container

### vs Alternatives

| Method | Public IP | Open Ports | Free HTTPS | Easy |
|--------|-----------|------------|------------|------|
| Direct VPS | ✅ | ❌ Must open | ❌ Manual | Medium |
| Nginx + Certbot | ✅ | ❌ Must open 80/443 | ✅ | Hard |
| **Cloudflare Tunnel** | ❌ Not needed | ❌ Zero ports | ✅ Auto | **Easy** |
| ngrok | ❌ Not needed | ❌ Zero ports | ✅ | Easy |

> **Senior Dev Note:** I use Cloudflare Tunnel for every project that needs public HTTPS access without the headache of managing SSL certs, nginx configs, or exposing ports. It is production-grade infrastructure.

---

## 2. Architecture — How It Actually Works

```
┌──────────────────────────────────────┐
│         YOUR SERVER / MACHINE        │
│                                      │
│   ┌─────────────┐                    │
│   │  Your App   │  localhost:3000    │
│   │ (Node/React │◄──────────────┐   │
│   │  /Django)   │               │   │
│   └─────────────┘               │   │
│                                  │   │
│   ┌──────────────────┐           │   │
│   │  cloudflared     │───────────┘   │
│   │  (daemon)        │               │
│   └────────┬─────────┘               │
│            │  Outbound HTTPS         │
│            │  (no inbound ports)     │
└────────────┼────────────────────────┘
             │
             ▼
    ┌─────────────────┐
    │  Cloudflare     │
    │  Edge Network   │  (200+ cities)
    └────────┬────────┘
             │
             ▼
    https://app.yourdomain.com
         (Public Internet)
```

- `cloudflared` dials **outbound** to Cloudflare. No one can connect to your server directly.
- Cloudflare proxies public requests **back through** this persistent tunnel.
- 4 parallel connections are maintained for reliability.

---

## 3. Prerequisites

Before starting, confirm you have:

```
✅ Cloudflare account (free at cloudflare.com)
✅ A domain added to Cloudflare (nameservers pointing to Cloudflare)
✅ Your app running locally (example: http://localhost:3000)
✅ Linux / macOS / Windows machine OR Docker
```

> Your domain's DNS must be **managed by Cloudflare** (not GoDaddy DNS, not Namecheap DNS — just point nameservers to Cloudflare and manage DNS there).

---

## 4. Install cloudflared

### Ubuntu / Debian

```bash
# Download latest .deb package
curl -L --output cloudflared.deb \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb

# Install
sudo dpkg -i cloudflared.deb

# Verify
cloudflared --version
```

### CentOS / RHEL / Fedora

```bash
curl -L --output cloudflared.rpm \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-x86_64.rpm

sudo rpm -ivh cloudflared.rpm

cloudflared --version
```

### macOS

```bash
brew install cloudflare/cloudflare/cloudflared
```

### Windows (PowerShell as Admin)

```powershell
winget install --id Cloudflare.cloudflared
```

### ARM / Raspberry Pi

```bash
curl -L --output cloudflared.deb \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb

sudo dpkg -i cloudflared.deb
```

### Check Version

```bash
cloudflared --version
# cloudflared version 202X.X.X
```

---

## 5. Login to Cloudflare

```bash
cloudflared tunnel login
```

**What happens:**
1. A URL appears in the terminal
2. Open that URL in your browser
3. Log in to Cloudflare
4. Select which domain to authorize
5. Certificate is saved automatically

```
# Certificate saved to:
~/.cloudflared/cert.pem
```

### On a headless server (no browser)?

The command will print a URL like:
```
Please open the following URL and log in with your Cloudflare account:
https://dash.cloudflare.com/argotunnel?aud=...
```

Copy that URL → open it on your local machine browser → authorize → done.

---

## 6. Create a Tunnel

```bash
cloudflared tunnel create <TUNNEL_NAME>
```

**Example:**

```bash
cloudflared tunnel create my-app
```

**Output:**

```
Tunnel credentials written to /root/.cloudflared/abc123de-xxxx-xxxx-xxxx-xxxxxxxxxxxx.json
Created tunnel my-app with id abc123de-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

The `.json` file = your tunnel's **identity credentials**.

> 🔐 **Never commit this `.json` file to Git. Ever.**

### Add to .gitignore immediately:

```bash
echo "*.json" >> ~/.cloudflared/.gitignore
echo ".env" >> .gitignore
```

### List your tunnels:

```bash
cloudflared tunnel list
```

```
ID                                   NAME     CREATED              CONNECTIONS
abc123de-xxxx-xxxx-xxxx-xxxxxxxxxxxx my-app   2024-01-15T10:00:00Z 4xSIN, 4xBOM
```

---

## 7. Write config.yml

```bash
nano ~/.cloudflared/config.yml
```

### Minimal Working Config

```yaml
tunnel: abc123de-xxxx-xxxx-xxxx-xxxxxxxxxxxx
credentials-file: /root/.cloudflared/abc123de-xxxx-xxxx-xxxx-xxxxxxxxxxxx.json

ingress:
  - hostname: app.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

> ⚠️ **The last ingress rule MUST be a catch-all.** Cloudflare will error without it.

### Full Config with All Options

```yaml
# Tunnel ID — copy from: cloudflared tunnel list
tunnel: abc123de-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Credentials file path
credentials-file: /root/.cloudflared/abc123de-xxxx-xxxx-xxxx-xxxxxxxxxxxx.json

# Log settings
loglevel: info          # debug | info | warn | error
logfile: /var/log/cloudflared.log

# Metrics (Prometheus format) — for monitoring
metrics: localhost:2000

# Auto-update (disable in production — use pinned versions)
no-autoupdate: true

# Ingress rules — matched top to bottom, first match wins
ingress:
  # Your main app
  - hostname: app.yourdomain.com
    service: http://localhost:3000
    originRequest:
      connectTimeout: 30s
      tcpKeepAlive: 15s
      noTLSVerify: false          # set true if origin uses self-signed cert
      http2Origin: false          # set true if origin supports HTTP/2
      keepAliveConnections: 100
      keepAliveTimeout: 90s

  # Catch-all — REQUIRED as last rule
  - service: http_status:404
```

### Validate Your Config

```bash
cloudflared tunnel ingress validate
# OK
```

### Test Which Rule Matches a URL

```bash
cloudflared tunnel ingress rule https://app.yourdomain.com/api/users
# Matched rule #1
# service: http://localhost:3000
```

---

## 8. Route DNS to Tunnel

This creates a CNAME record in Cloudflare DNS automatically:

```bash
cloudflared tunnel route dns <TUNNEL_NAME> <HOSTNAME>
```

**Example:**

```bash
cloudflared tunnel route dns my-app app.yourdomain.com
```

**Output:**

```
Added CNAME app.yourdomain.com which will route to this tunnel tunnelID=abc123de...
```

**What it creates in Cloudflare DNS:**

```
app.yourdomain.com  →  CNAME  →  abc123de-xxxx.cfargotunnel.com  (Proxied ✅)
```

> You can verify this in **Cloudflare Dashboard → your domain → DNS → Records**

---

## 9. Run the Tunnel (Test Mode)

```bash
cloudflared tunnel run my-app
```

Or explicitly point to config:

```bash
cloudflared tunnel --config ~/.cloudflared/config.yml run my-app
```

### Healthy Output Looks Like:

```
INF Starting tunnel tunnelID=abc123de...
INF Registered tunnel connection connIndex=0 location=SIN
INF Registered tunnel connection connIndex=1 location=SIN
INF Registered tunnel connection connIndex=2 location=BOM
INF Registered tunnel connection connIndex=3 location=BOM
```

✅ 4 connections = tunnel is running perfectly

Now visit: `https://app.yourdomain.com` → your app loads with HTTPS ✅

Press `Ctrl+C` to stop. Then set up as a system service for production.

---

## 10. Run as System Service (Production)

### Install as systemd Service

```bash
sudo cloudflared --config /root/.cloudflared/config.yml service install
```

### Enable & Start

```bash
sudo systemctl enable cloudflared    # auto-start on boot
sudo systemctl start cloudflared     # start now
sudo systemctl status cloudflared    # check status
```

**Healthy status:**

```
● cloudflared.service - cloudflared
   Loaded: loaded (/etc/systemd/system/cloudflared.service; enabled)
   Active: active (running) since ...
```

### Service Commands

```bash
sudo systemctl start cloudflared      # start
sudo systemctl stop cloudflared       # stop
sudo systemctl restart cloudflared    # restart
sudo systemctl status cloudflared     # check
sudo systemctl enable cloudflared     # enable on boot
sudo systemctl disable cloudflared    # disable on boot

# Live logs
sudo journalctl -u cloudflared -f
```

### Uninstall Service

```bash
sudo cloudflared service uninstall
```

---

## 11. Docker — Single Container

### Option A: Using Tunnel Token (Recommended)

Get your tunnel token:

```bash
cloudflared tunnel token my-app
# Prints: eyJhIjoiO...  (long token string)
```

Run container:

```bash
docker run -d \
  --name cloudflared \
  --restart unless-stopped \
  cloudflare/cloudflared:latest \
  tunnel --no-autoupdate run \
  --token eyJhIjoiO_YOUR_TOKEN_HERE
```

### Option B: Mount Credentials File

```bash
docker run -d \
  --name cloudflared \
  --restart unless-stopped \
  -v ~/.cloudflared:/etc/cloudflared \
  cloudflare/cloudflared:latest \
  tunnel --config /etc/cloudflared/config.yml run
```

### Check Container Logs

```bash
docker logs -f cloudflared
```

---

## 12. Docker Compose — Full Stack

This is the setup I use in every real project.

### Project Structure

```
my-project/
├── docker-compose.yml
├── .env                    ← never commit this
├── .env.example            ← commit this (no real secrets)
├── .gitignore
└── app/
    └── ... your app files
```

### .gitignore

```
.env
*.json
*.pem
```

### .env

```env
TUNNEL_TOKEN=eyJhIjoiO_YOUR_ACTUAL_TOKEN_HERE
```

### .env.example

```env
TUNNEL_TOKEN=your_cloudflare_tunnel_token_here
```

### docker-compose.yml

```yaml
version: "3.8"

services:

  # ── Your Application ───────────────────────────────────────
  app:
    build: ./app          # or use image: node:20-alpine
    container_name: my_app
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3000
    networks:
      - tunnel_net
    # Do NOT expose ports to host — tunnel handles traffic

  # ── Cloudflare Tunnel ──────────────────────────────────────
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: cloudflared
    restart: unless-stopped
    command: tunnel --no-autoupdate run
    environment:
      - TUNNEL_TOKEN=${TUNNEL_TOKEN}
    networks:
      - tunnel_net
    depends_on:
      - app

networks:
  tunnel_net:
    driver: bridge
```

> ⚠️ **Docker Critical Rule:** Inside Docker, cloudflared reaches the app via **service name**, not `localhost`.

### config.yml for Docker Compose (if not using token)

```yaml
tunnel: abc123de-xxxx-xxxx-xxxx-xxxxxxxxxxxx
credentials-file: /etc/cloudflared/abc123de-xxxx-xxxx-xxxx-xxxxxxxxxxxx.json

ingress:
  - hostname: app.yourdomain.com
    service: http://app:3000        # ← "app" is the Docker service name
  - service: http_status:404
```

### Start Everything

```bash
docker compose up -d

# Check logs
docker compose logs -f cloudflared
docker compose logs -f app

# Stop everything
docker compose down
```

---

## 13. Multiple Apps / Subdomains (One Tunnel)

One tunnel can route to many apps on different subdomains.

### config.yml

```yaml
tunnel: abc123de-xxxx-xxxx-xxxx-xxxxxxxxxxxx
credentials-file: /root/.cloudflared/abc123de-xxxx-xxxx-xxxx-xxxxxxxxxxxx.json

ingress:
  # React / Next.js frontend
  - hostname: app.yourdomain.com
    service: http://localhost:3000

  # Express / Django API
  - hostname: api.yourdomain.com
    service: http://localhost:5000

  # Admin panel (e.g., Grafana, Portainer)
  - hostname: admin.yourdomain.com
    service: http://localhost:9000

  # Staging environment
  - hostname: staging.yourdomain.com
    service: http://localhost:4000

  # Path-based routing on same hostname
  - hostname: app.yourdomain.com
    path: /api/.*
    service: http://localhost:5000

  # Catch-all — REQUIRED
  - service: http_status:404
```

### Route DNS for Each Hostname

```bash
cloudflared tunnel route dns my-app app.yourdomain.com
cloudflared tunnel route dns my-app api.yourdomain.com
cloudflared tunnel route dns my-app admin.yourdomain.com
cloudflared tunnel route dns my-app staging.yourdomain.com
```

Restart tunnel:

```bash
sudo systemctl restart cloudflared
```

---

## 14. WebSocket Support

WebSockets work out of the box, but add these settings for stability:

```yaml
ingress:
  - hostname: ws.yourdomain.com
    service: http://localhost:4000    # ws:// or http:// both work
    originRequest:
      connectTimeout: 30s
      tcpKeepAlive: 15s
      keepAliveConnections: 1024
      keepAliveTimeout: 90s
      noTLSVerify: true
```

> Cloudflare automatically upgrades HTTP → WebSocket when the client sends an upgrade request.

---

## 15. SSH Access via Tunnel

Access your server via SSH with **zero open ports**.

### Server: Add to config.yml

```yaml
ingress:
  - hostname: ssh.yourdomain.com
    service: ssh://localhost:22
  - service: http_status:404
```

### Route DNS

```bash
cloudflared tunnel route dns my-app ssh.yourdomain.com
sudo systemctl restart cloudflared
```

### Client: One-time Setup (your local machine)

Install `cloudflared` locally, then edit `~/.ssh/config`:

```
Host ssh.yourdomain.com
    ProxyCommand cloudflared access ssh --hostname %h
    User your_linux_username
    IdentityFile ~/.ssh/id_rsa
```

### Connect

```bash
ssh ssh.yourdomain.com
```

No open port 22 on the server. No VPN. Full SSH access. ✅

---

## 16. HTTPS & TLS Settings

### What Cloudflare Handles Automatically
- Public side: HTTPS with valid Cloudflare-issued cert ✅
- Browser padlock: Always green ✅

### Origin (Your App) Side Options

```yaml
originRequest:
  # Your origin uses plain HTTP (most common)
  noTLSVerify: false     # default — leave as is

  # Your origin uses HTTPS with self-signed cert
  noTLSVerify: true      # skip cert verification for origin

  # Your origin uses HTTPS with valid cert
  noTLSVerify: false     # strict — verify cert

  # Custom CA certificate for origin
  caPool: /path/to/your/ca.pem
```

### Cloudflare SSL Mode (Set in Dashboard)

Go to: **Cloudflare Dashboard → yourdomain.com → SSL/TLS → Overview**

| Mode | Origin Protocol | Use When |
|------|----------------|----------|
| Flexible | HTTP | Origin has no SSL (quick setup, not ideal) |
| Full | HTTPS (any cert) | Origin has self-signed cert |
| Full (Strict) | HTTPS (valid cert) | Origin has proper cert (most secure) |

> **Senior Recommendation:** Use **Full** mode with `noTLSVerify: true` in your tunnel config for simplicity, or **Full (Strict)** if your origin has a proper cert.

---

## 17. Zero Trust Access (Auth Protection)

Protect sensitive subdomains (admin panels, internal tools) with Cloudflare's free auth layer.

### Setup Steps

1. Go to **Cloudflare Dashboard → Zero Trust** (one.dash.cloudflare.com)
2. Navigate to **Access → Applications → Add an Application**
3. Choose **Self-hosted**
4. Fill in:
   - **Application name:** My Admin Panel
   - **Subdomain:** `admin.yourdomain.com`
5. Add a **Policy:**

### Policy Examples

**Allow specific emails:**
```
Rule: Allow
Selector: Email
Value: het@yourdomain.com, admin@company.com
```

**Allow entire email domain:**
```
Rule: Allow
Selector: Emails ending in
Value: @yourcompany.com
```

**Allow via GitHub org:**
```
Rule: Allow
Selector: GitHub organization
Value: your-github-org-name
```

### How it works for users:
1. User visits `admin.yourdomain.com`
2. Cloudflare intercepts → shows login page
3. User enters email → receives one-time PIN
4. Enters PIN → gets access
5. Session valid for 24 hours (configurable)

> No password to manage. No VPN. Works on any device. Free. ✅

---

## 18. Useful CLI Commands

```bash
# ── Tunnel Management ──────────────────────────────────────────

# List tunnels
cloudflared tunnel list

# Tunnel details + active connections
cloudflared tunnel info my-app

# Delete tunnel (stop it first)
cloudflared tunnel delete my-app

# Clean up stale connections
cloudflared tunnel cleanup my-app

# Get tunnel token
cloudflared tunnel token my-app

# ── Config & Ingress ──────────────────────────────────────────

# Validate config.yml
cloudflared tunnel ingress validate

# Test which ingress rule matches a URL
cloudflared tunnel ingress rule https://app.yourdomain.com/api/test

# ── DNS Routes ────────────────────────────────────────────────

# Add DNS route
cloudflared tunnel route dns my-app app.yourdomain.com

# List all DNS routes
cloudflared tunnel route dns list

# ── Running ───────────────────────────────────────────────────

# Run with default config
cloudflared tunnel run my-app

# Run with specific config file
cloudflared tunnel --config /path/to/config.yml run my-app

# Run with debug logs
cloudflared tunnel --loglevel debug run my-app

# ── Service ───────────────────────────────────────────────────

# Install as systemd service
sudo cloudflared --config /root/.cloudflared/config.yml service install

# Uninstall service
sudo cloudflared service uninstall
```

---

## 19. Logs & Monitoring

### Real-Time Logs

```bash
# systemd service logs
sudo journalctl -u cloudflared -f

# With timestamps
sudo journalctl -u cloudflared -f --output=short-precise

# Last 100 lines
sudo journalctl -u cloudflared -n 100

# Logs from last hour
sudo journalctl -u cloudflared --since "1 hour ago"
```

### Log to File

```yaml
# In config.yml
logfile: /var/log/cloudflared.log
loglevel: info
```

```bash
tail -f /var/log/cloudflared.log
```

### Metrics (Prometheus)

```yaml
# In config.yml
metrics: localhost:2000
```

```bash
# Check tunnel health
curl http://localhost:2000/healthcheck

# Prometheus metrics
curl http://localhost:2000/metrics
```

**Useful metric names:**
```
cloudflared_tunnel_total_requests      # total requests
cloudflared_tunnel_request_errors      # failed requests
cloudflared_tunnel_active_streams      # active connections
```

### Docker Logs

```bash
docker logs -f cloudflared
docker logs --tail 50 cloudflared
```

---

## 20. Troubleshooting (Real Problems)

---

### ❌ Problem: Tunnel connects but site shows "502 Bad Gateway"

**Cause:** cloudflared can't reach your origin app.

```bash
# Check if your app is actually running
curl http://localhost:3000
# Should return your app's response

# Check if port is correct in config.yml
# Check if app crashed
pm2 status         # if using PM2
docker ps          # if using Docker
systemctl status your-app
```

---

### ❌ Problem: "Unable to reach the origin service" in logs

```bash
# Verify the service URL in config.yml matches your app
# In Docker — use service name, NOT localhost:
service: http://app:3000        # ✅ Docker
service: http://localhost:3000  # ❌ Docker (won't work)
service: http://localhost:3000  # ✅ bare metal / systemd
```

---

### ❌ Problem: "x509: certificate signed by unknown authority"

**Cause:** Your origin uses a self-signed cert.

```yaml
# Add to ingress in config.yml
originRequest:
  noTLSVerify: true
```

---

### ❌ Problem: Tunnel not starting after server reboot

```bash
# Enable auto-start
sudo systemctl enable cloudflared

# Check if it failed
sudo systemctl status cloudflared
sudo journalctl -u cloudflared -n 50
```

---

### ❌ Problem: Multiple cloudflared processes running / conflicts

```bash
# Find all running processes
ps aux | grep cloudflared

# Kill all cloudflared
sudo pkill -f cloudflared

# Stop the service too
sudo systemctl stop cloudflared

# Start fresh
sudo systemctl start cloudflared
```

---

### ❌ Problem: "config file not found"

```bash
# Always specify config path explicitly
cloudflared tunnel --config /root/.cloudflared/config.yml run my-app

# Verify the file exists
ls -la ~/.cloudflared/
cat ~/.cloudflared/config.yml
```

---

### ❌ Problem: DNS not resolving

```bash
# Check CNAME was created
dig app.yourdomain.com

# Should return something like:
# app.yourdomain.com. 300 IN CNAME abc123de-xxxx.cfargotunnel.com.

# If not, re-run:
cloudflared tunnel route dns my-app app.yourdomain.com
```

---

### ❌ Problem: WebSocket disconnects frequently

```yaml
originRequest:
  tcpKeepAlive: 15s
  keepAliveConnections: 1024
  keepAliveTimeout: 90s
  connectTimeout: 30s
```

---

### ❌ Problem: "failed to sufficiently increase receive buffer size"

```bash
sudo sysctl -w net.core.rmem_max=2500000
echo "net.core.rmem_max=2500000" | sudo tee -a /etc/sysctl.conf
```

---

### ❌ Problem: Tunnel ID mismatch in config.yml

```bash
# Get exact tunnel ID
cloudflared tunnel list

# Copy it exactly into:
# 1. tunnel: <ID> in config.yml
# 2. credentials-file path: /root/.cloudflared/<ID>.json
```

---

## 21. Security Hardening

```bash
# Lock down your server firewall — tunnel handles everything
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh       # only if you still want direct SSH access
sudo ufw enable
sudo ufw status

# Remove if using SSH via tunnel instead:
# sudo ufw delete allow ssh
```

**In config.yml:**

```yaml
# Disable auto-update in production — use controlled upgrades
no-autoupdate: true

# Set specific timeouts — prevents hanging connections
originRequest:
  connectTimeout: 10s
  tcpKeepAlive: 15s
```

**Credentials security:**

```bash
# Restrict permissions on credentials file
chmod 600 ~/.cloudflared/*.json
chmod 600 ~/.cloudflared/cert.pem
chmod 600 ~/.cloudflared/config.yml
```

---

## 22. Production Checklist

```
BEFORE GOING LIVE
─────────────────────────────────────────────────────────
[ ] cloudflared installed and version confirmed
[ ] Tunnel created and credentials .json file saved safely
[ ] config.yml written and validated (cloudflared tunnel ingress validate)
[ ] DNS CNAME created for all hostnames
[ ] Local app is running and reachable (curl localhost:PORT works)
[ ] Tunnel tested in foreground (cloudflared tunnel run)
[ ] https://app.yourdomain.com loads correctly in browser

SERVICE & RELIABILITY
─────────────────────────────────────────────────────────
[ ] cloudflared installed as systemd service
[ ] systemctl enable cloudflared (starts on server reboot)
[ ] systemctl status cloudflared shows active (running)
[ ] Tested: reboot server → tunnel comes back automatically

SECURITY
─────────────────────────────────────────────────────────
[ ] credentials .json NOT in Git (.gitignore configured)
[ ] .env file NOT in Git
[ ] Firewall: no unnecessary open inbound ports
[ ] Sensitive subdomains protected with Zero Trust Access
[ ] credentials file permissions: chmod 600

DOCKER SPECIFIC
─────────────────────────────────────────────────────────
[ ] Using service name (not localhost) in config.yml
[ ] TUNNEL_TOKEN in .env, not hardcoded in docker-compose.yml
[ ] restart: unless-stopped on cloudflared container
[ ] Docker image pinned to specific version (not :latest in prod)

MONITORING
─────────────────────────────────────────────────────────
[ ] Logs checked: journalctl -u cloudflared (no errors)
[ ] 4 tunnel connections registered in logs
[ ] Metrics endpoint enabled (optional but recommended)
[ ] Alert configured if cloudflared service dies
```

---

## 🚀 5-Minute Quick Start (Copy-Paste)

```bash
# Step 1: Install
curl -L -o cloudflared.deb \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# Step 2: Login
cloudflared tunnel login

# Step 3: Create tunnel (save the ID printed)
cloudflared tunnel create my-app

# Step 4: Write config
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: PASTE_YOUR_TUNNEL_ID_HERE
credentials-file: /root/.cloudflared/PASTE_YOUR_TUNNEL_ID_HERE.json

ingress:
  - hostname: app.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
EOF

# Step 5: Route DNS
cloudflared tunnel route dns my-app app.yourdomain.com

# Step 6: Test it
cloudflared tunnel run my-app
# Visit https://app.yourdomain.com ✅

# Step 7: Make it permanent
sudo cloudflared --config /root/.cloudflared/config.yml service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

---

## 📁 File Reference

```
~/.cloudflared/
├── cert.pem                              # Login certificate (auto-created)
├── config.yml                            # Your tunnel configuration
└── abc123de-xxxx-xxxx-xxxx-xxxx.json    # Tunnel credentials (KEEP SECRET)
```

```
/etc/systemd/system/
└── cloudflared.service                   # Created by: service install
```

```
/var/log/
└── cloudflared.log                       # If logfile set in config.yml
```

---

*Built from production experience. No shortcuts. No guesswork.*  
*Every section tested on Ubuntu 22.04 LTS, Docker 24+, cloudflared 2024.x*
