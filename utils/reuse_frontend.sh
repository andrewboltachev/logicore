#!/bin/bash

echo 'Use the latest development frontend files for production'

[ -d frontend/dist ] || exit 1
rm -rf main/static/react/
cp -r -v frontend/dist/ main/static/react/
rm -rf ./main/templates/react/
mkdir -p ./main/templates/react/
cat main/static/react/index.html | grep module | sed -e "s#assets#static/react/assets#" > ./main/templates/react/bundle_js.html
cat main/static/react/index.html | grep stylesheet | sed -e "s#assets#static/react/assets#" > ./main/templates/react/bundle_css.html

echo 'Build files copied.'
