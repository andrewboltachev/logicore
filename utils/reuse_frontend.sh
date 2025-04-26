#!/bin/bash

echo 'Use the latest development frontend files for production'

[ -d frontend/dist ] || exit 1
rm -rf main/static/react/
mkdir -p static
cp -r -v frontend/dist main/static/react
mkdir -p ./main/templates/react/

find main/static/react/ -name "index-*.js" | xargs sed -e "s#/assets/#/static/react/assets/#g" -i
cat frontend/dist/index.html | sed -e "s#/assets/#/static/react/assets/#g" | grep module > ./main/templates/react/bundle_js.html
cat frontend/dist/index.html | sed -e "s#/assets/#/static/react/assets/#g" | grep stylesheet  > ./main/templates/react/bundle_css.html

echo 'Build files copied.'
