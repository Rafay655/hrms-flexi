#!/usr/bin/env bash
set -euo pipefail

[[ -f app/layout.tsx && -f package.json ]] || { echo 'Run from the hrms-flexi root.' >&2; exit 1; }

font_dir=app/fonts
font_file=$font_dir/league-spartan-variable.ttf
license_file=$font_dir/league-spartan-OFL.txt
upstream=https://raw.githubusercontent.com/google/fonts/main/ofl/leaguespartan

if grep -Fq 'import localFont from "next/font/local";' app/layout.tsx &&
   grep -Fq './fonts/league-spartan-variable.ttf' app/layout.tsx &&
   [[ -s $font_file && -s $license_file ]]; then
  echo 'Local League Spartan is already installed.'
  exit 0
fi

tmp=$(mktemp -d)
trap 'rm -f -- "$tmp/layout.patch" "$tmp/font.ttf" "$tmp/OFL.txt"; rmdir -- "$tmp"' EXIT
cat >"$tmp/layout.patch" <<'PATCH'
diff --git a/app/layout.tsx b/app/layout.tsx
--- a/app/layout.tsx
+++ b/app/layout.tsx
@@ -4 +4 @@
-import { League_Spartan } from "next/font/google";
+import localFont from "next/font/local";
@@ -10,4 +10,4 @@
-const leagueSpartan = League_Spartan({
-  subsets: ["latin"],
-  weight: ["400", "500", "600", "700"],
+const leagueSpartan = localFont({
+  src: "./fonts/league-spartan-variable.ttf",
+  weight: "100 900",
   variable: "--font-league-spartan",
PATCH
git apply --check --unidiff-zero "$tmp/layout.patch"

if [[ -e $font_file || -e $license_file ]]; then
  echo 'A target font file already exists. Check it before applying the fix.' >&2
  exit 1
fi

curl -fsSL --retry 2 --max-time 30 "$upstream/LeagueSpartan%5Bwght%5D.ttf" -o "$tmp/font.ttf"
curl -fsSL --retry 2 --max-time 30 "$upstream/OFL.txt" -o "$tmp/OFL.txt"
php -r '$font=file_get_contents($argv[1]); if (!str_starts_with($font,"\x00\x01\x00\x00") || !str_contains($font,"fvar")) { fwrite(STDERR,"Expected a variable TrueType font.\n"); exit(1); }' "$tmp/font.ttf"
grep -Fq 'SIL OPEN FONT LICENSE' "$tmp/OFL.txt"

mkdir -p -- "$font_dir"
install -m 0644 -- "$tmp/font.ttf" "$font_file"
install -m 0644 -- "$tmp/OFL.txt" "$license_file"
git apply --unidiff-zero "$tmp/layout.patch"
echo 'Local League Spartan installed. Run npm run build.'
