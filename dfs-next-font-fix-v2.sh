#!/usr/bin/env bash
set -euo pipefail

[[ -f app/layout.tsx && -f package.json ]] || { echo 'Run from the hrms-flexi root.' >&2; exit 1; }

font_dir=app/fonts
font_file=$font_dir/league-spartan-variable.ttf
license_file=$font_dir/league-spartan-OFL.txt
upstream=https://raw.githubusercontent.com/google/fonts/main/ofl/leaguespartan

tmp=$(mktemp -d)
trap 'rm -f -- "$tmp/rewrite.php" "$tmp/layout.tsx" "$tmp/font.ttf" "$tmp/OFL.txt"; rmdir -- "$tmp"' EXIT

cat > "$tmp/rewrite.php" <<'PHP'
<?php

function stop(string $message): never
{
    fwrite(STDERR, $message . PHP_EOL);
    exit(1);
}

$layout = file_get_contents($argv[1]);
if ($layout === false) {
    stop('Cannot read app/layout.tsx.');
}

if (str_contains($layout, './fonts/league-spartan-variable.ttf') && preg_match('~["\x27]next/font/local["\x27]~', $layout)) {
    file_put_contents($argv[2], $layout);
    exit;
}

$import = '~^([ \t]*)import\s*\{\s*League_Spartan(?:\s+as\s+([A-Za-z_$][\w$]*))?\s*,?\s*\}\s*from\s*(["\x27])next/font/google\3[ \t]*;?~m';
if (preg_match_all($import, $layout, $found, PREG_SET_ORDER) !== 1) {
    stop('Expected one League_Spartan import in app/layout.tsx. No changes applied.');
}

$symbol = $found[0][2] ?: 'League_Spartan';
$local = 'localLeagueSpartanFont';
if (preg_match('~\b' . $local . '\b~', $layout)) {
    stop('The local font import name is already used. No changes applied.');
}
$identifier = preg_quote($symbol, '~');
$call = '~(\b(?:const|let)\s+[A-Za-z_$][\w$]*\s*=\s*)' . $identifier . '\s*\(\s*\{([^{}]*)\}\s*\)~s';
if (preg_match_all($call, $layout) !== 1) {
    stop('Expected one League Spartan initializer. No changes applied.');
}

$updated = preg_replace_callback($call, static function (array $parts) use ($local): string {
    $options = preg_replace('~(?:^|(?<=,))\s*(?:subsets|weight)\s*:\s*(?:\[[^\]]*\]|"[^"]*"|\x27[^\x27]*\x27)\s*(?:,|$)~', '', $parts[2]);
    $options = rtrim(trim($options), ',');
    if (preg_match('~\b(?:subsets|weight|src)\s*:~', $options)) {
        stop('Unexpected League Spartan options. No changes applied.');
    }
    $newline = str_contains($parts[0], "\r\n") ? "\r\n" : "\n";
    return $parts[1] . $local . '({' . $newline
        . '  src: "./fonts/league-spartan-variable.ttf",' . $newline
        . '  weight: "100 900",' . $newline
        . ($options === '' ? '' : '  ' . $options . ',' . $newline)
        . '})';
}, $layout, 1);

$updated = preg_replace_callback($import, static fn (array $parts): string => $parts[1] . 'import ' . $local . ' from "next/font/local";', $updated, 1);
if ($updated === null || file_put_contents($argv[2], $updated) === false) {
    stop('Could not prepare the updated layout.');
}
PHP

php "$tmp/rewrite.php" app/layout.tsx "$tmp/layout.tsx"
if cmp -s app/layout.tsx "$tmp/layout.tsx" && [[ -s $font_file && -s $license_file ]]; then
  echo 'Local League Spartan is already installed.'
  exit 0
fi

if [[ ! -s $font_file || ! -s $license_file ]]; then
  curl -fsSL --retry 2 --max-time 30 "$upstream/LeagueSpartan%5Bwght%5D.ttf" -o "$tmp/font.ttf"
  curl -fsSL --retry 2 --max-time 30 "$upstream/OFL.txt" -o "$tmp/OFL.txt"
  php -r '$font=file_get_contents($argv[1]); if (!str_starts_with($font,"\x00\x01\x00\x00") || !str_contains($font,"fvar")) { fwrite(STDERR,"Expected a variable TrueType font.\n"); exit(1); }' "$tmp/font.ttf"
  grep -Fq 'SIL OPEN FONT LICENSE' "$tmp/OFL.txt"
  mkdir -p -- "$font_dir"
  [[ -s $font_file ]] || install -m 0644 -- "$tmp/font.ttf" "$font_file"
  [[ -s $license_file ]] || install -m 0644 -- "$tmp/OFL.txt" "$license_file"
fi

if ! cmp -s app/layout.tsx "$tmp/layout.tsx"; then
  cat "$tmp/layout.tsx" > app/layout.tsx
fi
echo 'Local League Spartan installed. Run npm run build.'
