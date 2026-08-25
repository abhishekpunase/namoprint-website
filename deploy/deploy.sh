#!/usr/bin/env bash
#
# One-command deploy. Run from the project root on the server:
#
#   bash deploy/deploy.sh
#
# Every step is verified, so a half-finished deploy fails loudly instead of
# leaving pm2 running stale code against a missing build.

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

step() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }
fail() { printf '\n\033[1;31mFAILED: %s\033[0m\n' "$1" >&2; exit 1; }

step "Checking required files"
[ -f backend/.env ] || fail "backend/.env is missing. Copy backend/.env.example and fill it in."
[ -f frontend/.env.production ] || fail "frontend/.env.production is missing. Copy frontend/.env.production.example and fill it in."

for key in MONGO_URI JWT_ACCESS_SECRET JWT_REFRESH_SECRET; do
  grep -qE "^${key}=.+" backend/.env || fail "$key is not set in backend/.env"
done

for key in AWS_REGION AWS_S3_BUCKET AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY; do
  grep -qE "^${key}=.+" backend/.env || printf 'WARNING: %s not set — uploads will fall back to this server disk.\n' "$key"
done

step "Pulling latest code"
# A tracked file edited on the server aborts the merge with a confusing message.
# Nothing here should be edited on the server, so name the files and stop cleanly.
dirty="$(git status --porcelain --untracked-files=no)"
if [ -n "$dirty" ]; then
  printf 'Locally modified tracked files on this server:\n%s\n\n' "$dirty"
  fail "Discard them with 'git checkout -- .' (server-side edits are not kept) and re-run."
fi
git pull --ff-only

step "Installing dependencies"
npm run install:all

step "Building frontend"
# Vite needs more heap than the default on small instances; without this the
# build is OOM-killed and pm2 silently keeps serving a missing dist.
NODE_OPTIONS="--max-old-space-size=2048" npm run build

[ -f frontend/dist/index.html ] || fail "frontend/dist/index.html was not produced. The build likely ran out of memory — add swap and retry."

step "Restarting pm2"
pm2 flush
pm2 restart all --update-env
pm2 save

step "Verifying backend"
sleep 3
curl -fsS http://127.0.0.1:5000/api/health || fail "Backend did not answer on /api/health. Run: pm2 logs --lines 40"

printf '\n\033[1;32mDeploy complete.\033[0m Recent logs:\n\n'
pm2 logs --lines 20 --nostream
