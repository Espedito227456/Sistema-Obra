# ObraBase — Automação de Mão de Obra, Materiais e PCI CAIXA

Sistema web integrado para profissionais da construção civil unificando:
- **Planilha de Cálculo de Mão de Obra** (diárias de pedreiro/servente, produtividade, R$/m² e comparação com referências 2026)
- **Calculadora de Materiais Básicos** (11 módulos com traços e perdas técnicas)
- **Proposta de Construção Individual (PCI CAIXA — AE 130 026)** com validação automática de incidências, estimador CUB e Cronograma Físico-Financeiro (Curva S).

## Executando no Termux (Android)

### 1. Instalar dependências do sistema no Termux
```bash
pkg update && pkg upgrade -y
pkg install -y nodejs-lts git esbuild
```

### 2. Clonar o repositório
```bash
git clone https://github.com/Espedito227456/Sistema-obra.git
cd Sistema-obra
```

### 3. Iniciar automaticamente
```bash
chmod +x termux-start.sh
./termux-start.sh
```
Depois, abra no navegador do celular: **http://localhost:3000**

### Observação sobre binários nativos no Android (Termux)
Algumas versões recentes do Vite/Tailwind v4 utilizam módulos nativos (`rolldown` / `@tailwindcss/oxide` / `esbuild`).
- O script `termux-start.sh` já configura `ESBUILD_BINARY_PATH=$(command -v esbuild)` usando o pacote nativo do Termux.
- Caso o `npm install` apresente erro de binário nativo para Android Bionic em algum aparelho específico, execute dentro de um container Ubuntu no próprio Termux:
  ```bash
  pkg install -y proot-distro
  proot-distro install ubuntu
  proot-distro login ubuntu
  # Dentro do Ubuntu:
  apt update && apt install -y nodejs npm git
  git clone https://github.com/Espedito227456/Sistema-obra.git
  cd Sistema-obra && npm install && npm run dev
  ```
- Para servir uma compilação já gerada (`dist/`) sem depender de ferramentas de build em execução:
  ```bash
  npm run build
  npm run start:termux
  ```
