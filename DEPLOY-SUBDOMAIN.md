# Deploy to new.policestationrepuk.com

## Status

- **Deployed to Vercel:** https://policestationrepuk-new.vercel.app  
- **Custom domain added:** `new.policestationrepuk.com` (pending DNS)

## Finish subdomain setup (DNS)

Your main site uses **Wix DNS** (ns0.wixdns.net, ns1.wixdns.net). To make `new.policestationrepuk.com` point to this deployment:

1. Log in to wherever **policestationrepuk.com** DNS is managed (e.g. Wix Domains, or the registrar if DNS is there).
2. Add **one** of these records for the **subdomain** `new`:

   **Option A – A record (recommended)**  
   - Type: **A**  
   - Name/Host: **new** (or `new.policestationrepuk.com` if the UI asks for full name)  
   - Value/Points to: **76.76.21.21**  
   - TTL: 3600 (or default)

   **Option B – CNAME** (if your provider allows CNAME for subdomains)  
   - Type: **CNAME**  
   - Name: **new**  
   - Value: **cname.vercel-dns.com**

3. Save and wait 5–60 minutes for DNS to propagate.  
4. Vercel will verify automatically; you may get an email when it’s active.  
5. Visit **https://new.policestationrepuk.com** – it should serve this project.

## Optional: correct URLs on the subdomain

So that sitemap, canonicals, and schema use `https://new.policestationrepuk.com` when users are on the subdomain:

1. In Vercel: **Project** → **Settings** → **Environment Variables**
2. Add:  
   - **Name:** `NEXT_PUBLIC_SITE_URL`  
   - **Value:** `https://new.policestationrepuk.com`  
   - **Environments:** Production (and Preview if you want)
3. Redeploy (e.g. **Deployments** → … → **Redeploy**), or push a new commit.

If you leave this unset, the app will keep using `https://policestationrepuk.com` in links and schema (fine for a temporary mirror).

## Redeploy from this repo

```bash
npm run build
npx vercel --prod
```

Or connect the repo in Vercel and use automatic deployments on push.
