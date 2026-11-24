#!/bin/bash
# DeepFilterNet3 공식 실행 파일(deep-filter 0.5.6, MIT/Apache-2.0) 설치 — 딜러 육성 잡음 제거용(2026-11-25)
set -e
command -v deep-filter >/dev/null && deep-filter --version | grep -q 0.5.6 && exit 0
curl -sSL -o /tmp/deep-filter https://github.com/Rikorose/DeepFilterNet/releases/download/v0.5.6/deep-filter-0.5.6-x86_64-unknown-linux-musl
chmod +x /tmp/deep-filter && mv /tmp/deep-filter /usr/local/bin/deep-filter
deep-filter --version
