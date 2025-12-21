FROM node:20-alpine

WORKDIR /app

# Copiar package files
COPY package.json package-lock.json* tsconfig.json ./

# Instalar dependências
RUN npm ci

# Copiar Prisma
COPY prisma ./prisma/

# Gerar Prisma Client
RUN npx prisma generate

# Copiar código fonte
COPY src ./src/

# Compilar TypeScript
RUN npm run build

# Debug: verificar se compilou
RUN ls -la dist/ && ls -la dist/routes/ || echo "⚠️ routes/ não encontrada"

# Expor porta
EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Iniciar
CMD ["node", "dist/index.js"]