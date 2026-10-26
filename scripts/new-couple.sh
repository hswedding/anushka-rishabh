#!/usr/bin/env bash
# Start one family's invitation repo from invite-base-single.
#
#   ./scripts/new-couple.sh <couple-slug>-<bride|groom> [github-owner]
#   e.g. ./scripts/new-couple.sh aarav-diya-bride   (and aarav-diya-groom for the other family)
#
# Creates ../invite-<slug> as a full clone of invite-base-single (history kept, so
# `git merge upstream/main` can pull base fixes later), renames the Worker,
# writes fresh secret link ids (config.links in src/data.js), commits, and —
# if the GitHub CLI is logged in — creates the private repo
# hswedding/invite-<slug> and pushes it.
set -euo pipefail

SLUG="${1:-}"
OWNER="${2:-hswedding}"
BASE_URL="${INVITE_BASE_URL:-https://github.com/hswedding/invite-base-single}"

if [[ ! "$SLUG" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
  echo "Usage: $0 <couple-slug> [github-owner]   (lowercase letters, digits, hyphens)" >&2
  exit 1
fi

NAME="invite-$SLUG"
DEST="$(cd "$(dirname "$0")/../.." && pwd)/$NAME"

if [[ -e "$DEST" ]]; then
  echo "$DEST already exists — pick another slug or remove it." >&2
  exit 1
fi

echo "→ Cloning invite-base-single into $DEST"
git clone --quiet "$BASE_URL" "$DEST"
cd "$DEST"
git remote rename origin upstream

echo "→ Renaming the Worker and package to $NAME"
# Worker name = the site URL (https://$NAME.<subdomain>.workers.dev)
sed -i.bak -E "s/\"name\": \"[^\"]+\"/\"name\": \"$NAME\"/" wrangler.jsonc && rm wrangler.jsonc.bak
node -e "const f='package.json',p=require('./'+f);p.name='$NAME';require('fs').writeFileSync(f,JSON.stringify(p,null,2)+'\n')"

echo "→ Writing fresh secret link ids (config.links in src/data.js)"
node scripts/new-links.mjs

git add wrangler.jsonc package.json src/data.js
git commit --quiet -m "Start $NAME from invite-base-single"

if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  echo "→ Creating private repo $OWNER/$NAME and pushing"
  gh repo create "$OWNER/$NAME" --private --source=. --remote=origin --push
else
  echo
  echo "GitHub CLI not logged in. Create an EMPTY private repo $OWNER/$NAME on github.com, then run:"
  echo "  cd \"$DEST\""
  echo "  git remote add origin https://github.com/$OWNER/$NAME.git"
  echo "  git push -u origin main"
fi

cat <<EOF

Next:
  1. Edit src/data.js (content + site meta), src/styles/tokens.css (palette),
     public/ (films, music, og-image.jpg), src/custom/ (one-off sections).
  2. Cloudflare dashboard → Workers & Pages → Create → Import a repository →
     pick $OWNER/$NAME. Build command: npm run build · Deploy command: npx wrangler deploy
  3. Pull a base fix later:  git fetch upstream && git merge upstream/main
EOF
