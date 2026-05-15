@echo off
echo Formatting screenshots for Chrome Web Store...

:: Create folder
mkdir "WebStore_Ready" 2>nul

for %%f in (*.png *.jpg) do (
    echo Processing: %%f...
    
    REM 1. -resize 1280x800^^ (with the carets) forces it to completely fill the box.
    REM 2. -gravity center anchors the image in the middle.
    REM 3. -crop 1280x800+0+0 slices off the extra edges so there are NO black bars.
    REM 4. +repage cleans up the canvas metadata.
    magick "%%f" -resize 1280x800^^ -gravity center -crop 1280x800+0+0 +repage ".\WebStore_Ready\%%~nf_formatted.png"
)
