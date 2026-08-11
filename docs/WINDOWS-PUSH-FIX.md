# Push sibling security hardening (easiest path)

Stop fighting PowerShell. Use GitHub Actions once:

## One-click (recommended)

1. Create a classic PAT with **repo** scope (must write both GitHub accounts):  
   https://github.com/settings/tokens/new?scopes=repo&description=portfolio-security-push
2. Add it as a repo secret:  
   https://github.com/robertcashman-bit/Policestationrepuk/settings/secrets/actions  
   - Name: `PORTFOLIO_PUSH_PAT`  
   - Value: your `ghp_...` token
3. Run the workflow:  
   https://github.com/robertcashman-bit/Policestationrepuk/actions/workflows/portfolio-security-push.yml  
   - Click **Run workflow** → **Run workflow**

That applies the sibling patches and pushes branches (and opens draft PRs unless you tick skip).

## Optional: from this PC (CMD, no PowerShell)

Double-click or run in **Command Prompt**:

```bat
cd %USERPROFILE%\Documents\Policestationrepuk
git fetch origin cursor/security-hardening-uplift-34ef
git reset --hard origin/cursor/security-hardening-uplift-34ef
scripts\windows-push-hardening.cmd
```

## Why PowerShell kept failing

Older helper scripts turned normal `git fetch` messages into fatal errors, then failed
before they could update themselves. Prefer Actions or the `.cmd` helper above.
