#!/usr/bin/env bash
set -Eeuo pipefail

RELEASE_ROOT=${DEPLOY_RELEASE_ROOT:?DEPLOY_RELEASE_ROOT is required}
REPOSITORY_URL=${REPOSITORY_URL:?REPOSITORY_URL is required}
DEPLOY_REF=${DEPLOY_REF:?DEPLOY_REF is required}
case "$RELEASE_ROOT" in
  /*) ;;
  *) echo "DEPLOY_RELEASE_ROOT must be absolute" >&2; exit 2 ;;
esac
STAGING_DIR="$RELEASE_ROOT/.project-os.staging.$$"
RELEASE_DIR=
CANDIDATE_NAME=
CURRENT_DIR=$(pm2 jlist | node -e '
  let input = "";
  process.stdin.on("data", (chunk) => input += chunk);
  process.stdin.on("end", () => {
    const processInfo = JSON.parse(input).find((item) => item.name === "project-os");
    if (!processInfo?.pm2_env?.pm_cwd) process.exit(1);
    process.stdout.write(processInfo.pm2_env.pm_cwd);
  });
')
SWAPPED=false

rollback() {
  status=$?
  pm2 delete "$CANDIDATE_NAME" >/dev/null 2>&1 || true
  if [ "$SWAPPED" = true ]; then
    pm2 delete project-os >/dev/null 2>&1 || true
    pm2 start /usr/bin/npm --name project-os --cwd "$CURRENT_DIR" -- start -- -p 3000 -H 127.0.0.1 >/dev/null 2>&1 || true
    pm2 save >/dev/null 2>&1 || true
  fi
  case "$STAGING_DIR" in
    "$RELEASE_ROOT"/.project-os.staging.*) rm -rf -- "$STAGING_DIR" ;;
  esac
  exit "$status"
}
trap rollback EXIT

test -d "$CURRENT_DIR"
mkdir -p "$RELEASE_ROOT"
git clone --no-checkout "$REPOSITORY_URL" "$STAGING_DIR"
git -C "$STAGING_DIR" fetch --depth 1 origin "$DEPLOY_REF"
git -C "$STAGING_DIR" checkout --detach FETCH_HEAD
COMMIT_REF=$(git -C "$STAGING_DIR" rev-parse HEAD)
SHORT_REF=${COMMIT_REF:0:12}
RELEASE_DIR="$RELEASE_ROOT/${SHORT_REF}-prod"
CANDIDATE_NAME="project-os-candidate-${SHORT_REF}"
test ! -e "$RELEASE_DIR"

if [ -f "$CURRENT_DIR/.env.local" ]; then
  cp "$CURRENT_DIR/.env.local" "$STAGING_DIR/.env.local"
fi

cd "$STAGING_DIR"
npm ci --no-audit --no-fund
npm run build

pm2 start /usr/bin/npm --name "$CANDIDATE_NAME" --cwd "$STAGING_DIR" -- start -- -p 3001 -H 127.0.0.1 >/dev/null
for _ in $(seq 1 30); do
  if curl -fsS --max-time 3 http://127.0.0.1:3001/login >/dev/null; then
    break
  fi
  sleep 1
done
curl -fsS --max-time 3 http://127.0.0.1:3001/login >/dev/null
pm2 delete "$CANDIDATE_NAME" >/dev/null

mv "$STAGING_DIR" "$RELEASE_DIR"
pm2 delete project-os >/dev/null
SWAPPED=true
pm2 start /usr/bin/npm --name project-os --cwd "$RELEASE_DIR" -- start -- -p 3000 -H 127.0.0.1 >/dev/null
for _ in $(seq 1 30); do
  if curl -fsS --max-time 3 http://127.0.0.1:3000/login >/dev/null; then
    break
  fi
  sleep 1
done
curl -fsS --max-time 3 http://127.0.0.1:3000/login >/dev/null
pm2 save >/dev/null
printf '%s\n' "$(git rev-parse HEAD)" > "$RELEASE_ROOT/.current-frontend-release"
trap - EXIT
echo "Frontend release $(git rev-parse --short HEAD) is healthy"
