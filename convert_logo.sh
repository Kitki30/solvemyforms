#!/bin/bash
echo "Converting files..."
mkdir -p "src/assets"
npx sharp resize 256 256 -i assets/logo.svg -o src/assets/logo_256.png
npx sharp resize 128 128 -i assets/logo.svg -o src/assets/logo_128.png
npx sharp resize 48 48 -i assets/logo_no_text.svg -o src/assets/logo_48.png
npx sharp resize 32 32 -i assets/logo_no_text.svg -o src/assets/logo_32.png
npx sharp resize 16 16 -i assets/logo_no_text.svg -o src/assets/logo_16.png
echo "Done"