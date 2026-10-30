#!/bin/sh
# nuxt-site 자기 파일의 형식 오류만 보여 준다(공유하는 src/ 리액트 파일의 오류는 빼고).
cd "$(dirname "$0")/.." && npx vue-tsc --noEmit 2>&1 | grep "error TS" | grep -v '^\.\./src/' ; echo "own-errors: $(npx vue-tsc --noEmit 2>&1 | grep 'error TS' | grep -vc '^\.\./src/')"
