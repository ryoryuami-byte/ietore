#!/usr/bin/env bash
# Full build: pictograms -> bundle patches -> ietore.html + pwa/index.html
set -euo pipefail
cd "$(dirname "$0")"
node genA.mjs          # figs.mjs -> newA.js (the pictogram component)
python3 patch.py       # original bundle + patches -> repo outputs
