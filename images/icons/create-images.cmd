@echo off
echo Generating Chrome Extension icons...

set SOURCE_FULL=logo.svg
set SOURCE_16=logo-16x16.svg

:: Generate the 16 and 32 icons using the stripped-down, bold Stopwatch SVG
magick -background none -density 300 %SOURCE_16% -resize 16x16 PNG32:icon16.png
magick -background none -density 300 %SOURCE_16% -resize 32x32 PNG32:icon32.png
magick -background none -density 300 %SOURCE_16% -resize 48x48 PNG32:icon48.png

:: Generate the 128 icons using the full, complex logo
magick -size 128x128 canvas:none ( -background none -density 300 %SOURCE_FULL% -resize 96x96 ) -gravity center -composite PNG32:icon128.png

:: Promo Tile
magick -size 440x280 canvas:#212121 ( -background none -density 300 %SOURCE_FULL% -resize 180x180 ) -gravity center -composite PNG32:promo_tile_440x280.png
:: Generate the 1400x560 Marquee Promo Image
magick -size 1400x560 canvas:#212121 ( -background none -density 300 %SOURCE_FULL% -resize 400x400 ) -gravity center -composite PNG32:marquee_1400x560.png
