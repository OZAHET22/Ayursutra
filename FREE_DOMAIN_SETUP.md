# 🎁 Free Domain Setup — Step by Step
> Using Freenom .tk domain + Cloudflare (100% Free)

---

## 📋 Quick Overview

| Service | Cost | Time |
|---------|------|------|
| Domain (.tk) | FREE | 2 min |
| Cloudflare | FREE | 1 min |
| Total | **$0** | **3 min** |

---

## Step 1: Get Free Domain from Freenom

### Go to Freenom
1. Open: https://www.freenom.com/
2. Click **"Find your new FREE domain"**

### Search Domain
1. In the search box, type: `ayursutra` (or any name you want)
2. Add **.tk** extension
3. Click **"Check Availability"**

### Register Domain
1. Select the free domain year
2. Click **"Get it now!"**
3. Complete checkout (FREE)
4. Accept terms
5. **Verify email address**

**Your domain:** `ayursutra.tk` (or similar)

✅ **Domain obtained!** - Move to Step 2

---

## Step 2: Add Domain to Cloudflare

### Go to Cloudflare Dashboard
1. Open: https://dash.cloudflare.com/
2. Sign up if needed (FREE account)

### Add Your Domain
1. Click **"Add a Site"**
2. Enter your domain: `ayursutra.tk`
3. Click **"Add site"**
4. Choose **FREE plan** (bottom)
5. Click **"Confirm plan"**

### Update Nameservers in Freenom

Cloudflare will show you **2 nameservers**, like:
```
iris.ns.cloudflare.com
noah.ns.cloudflare.com
```

**Copy these!**

Then go back to Freenom:
1. Log in to Freenom
2. Navigate to **"My Domains"**
3. Find `ayursutra.tk` → Click **"Manage Domain"**
4. Go to **"Management Tools"** → **"Nameservers"**
5. Select **"Use custom nameservers"**
6. Paste the Cloudflare nameservers
7. Save

### Wait for DNS Propagation
- ⏳ Takes 5-60 minutes (usually 10-15 min)
- Check status here: https://dns-propagation.com
- Search for your domain

✅ **When propagated, move to Step 3**

---

## Step 3: Verify Domain in Cloudflare

1. Go to https://dash.cloudflare.com/
2. Click on your domain (`ayursutra.tk`)
3. If Cloudflare says "Nameserver check in progress" → **Wait**
4. When nameservers verified, you'll see checkmark ✅

### SSL/TLS Settings

Go to **SSL/TLS** → **Overview**
- Change mode to: **"Full"** or **"Full (Strict)"**
- Cloudflare will auto-issue certificate ✅

✅ **Ready for Cloudflare Tunnel!**

---

## Done! Your Free Setup

```
Domain: ayursutra.tk (FREE)
Nameservers: Cloudflare (FREE)
SSL/TLS: Automatic (FREE)
Tunnel: Cloudflare Tunnel (FREE)
```

**Total Cost: $0**

---

## Next Steps

Once your domain is active in Cloudflare:

1. Return to Cloudflare Tunnel setup
2. Complete `cloudflared tunnel login`
3. Create tunnel with your domain
4. Configure frontend + backend routing

---

## 🆘 Troubleshooting

### Nameservers not updating?
- Freenom might have delay (up to 24 hours)
- Use DNS checker: https://mxtoolbox.com/nslookup.aspx
- Search your domain
- Should show Cloudflare nameservers

### Domain not working in Cloudflare?
- Go back to Freenom
- Verify Cloudflare nameservers are set correctly
- Wait 30 minutes
- Refresh Cloudflare dashboard

### Still stuck?
- Try different domain name (ayursutra2.tk)
- Make sure email is verified at Freenom
- Double-check nameserver spelling

---

## 📞 Next Action

Once your domain is active in Cloudflare dashboard ✅

**Return to this message and we'll continue with tunnel setup!**
