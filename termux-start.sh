#!/data/data/com.termux/files/usr/bin/bash
set -e

echo "==> Verificando pacotes no Termux..."
if ! command -v node >/dev/null 2>&1 || ! command -v git >/dev/null 2>&1; then
  pkg update -y
  pkg install -y nodejs-lts git esbuild
fi

# Usa o binário nativo do esbuild do Termux caso esteja instalado (evita erro de arquitetura Android)
if command -v esbuild >/dev/null 2>&1; then
  export ESBUILD_BINARY_PATH="$(command -v esbuild)"
  echo "==> ESBUILD_BINARY_PATH configurado: $ESBUILD_BINARY_PATH"
fi

if [ ! -d "node_modules" ]; then
  echo "==> Instalando dependências..."
  npm install --no-audit --no-fund
fi

echo "==> Iniciando ObraBase em http://localhost:3000 ..."
npm run dev
