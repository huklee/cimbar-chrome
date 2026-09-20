#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "$0")/.." && pwd)"
output="$repo_dir/cimbar-text-bundle-extension.zip"
cd "$repo_dir/extension"
rm -f "$output"
zip -q -r "$output" . -x '*.DS_Store'
echo "Created $output"
