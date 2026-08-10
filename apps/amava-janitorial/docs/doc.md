
## ===== DEPLOY SCRIPT - FIRST TIME =====
https://github.com/new 
git remote add my-site https://github.com/brianwhaley/my-site.git
git branch -M dev
git push -u origin dev
git branch -M main
git push -u origin main


## ===== DEPLOY SCRIPT - ALL OTHER TIMES
echo "Updating packages..." && npm outdated | awk 'NR>1 {print $1"@"$4}' | while read pkg; do echo "$pkg" >> /tmp/npm-updates.log && printf "." && npm install --force --save "$pkg" > /dev/null 2>&1; done && echo "\n\n✓ Updated packages:" && cat /tmp/npm-updates.log && rm /tmp/npm-updates.log
npm audit fix --force
npm version patch --force
git add * -v
git commit -m "initial build"
git push -u my-site dev --tags
git push my-site dev:main


## ===== DEPLOY SCRIPT - FOR THE TEMPLATE
echo "Updating packages..." && npm outdated | awk 'NR>1 {print $1"@"$4}' | while read pkg; do echo "$pkg" >> /tmp/npm-updates.log && printf "." && npm install --force --save "$pkg" > /dev/null 2>&1; done && echo "\n\n✓ Updated packages:" && cat /tmp/npm-updates.log && rm /tmp/npm-updates.log
npm audit fix --force
npm version patch --force
git add * -v
git commit -m "https://www.cve.org/CVERecord?id=CVE-2025-55184"
git push -u pixelatedtemplate dev --tags
git push pixelatedtemplate dev:main
