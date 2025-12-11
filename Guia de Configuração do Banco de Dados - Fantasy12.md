# Guia de Configuração do Banco de Dados - Fantasy12

Este documento fornece instruções detalhadas para conectar a aplicação Fantasy12 a um banco de dados PostgreSQL real.

## ✅ Status da Configuração

### Arquivo `.env` - ✅ Atualizado
O arquivo `.env` foi configurado com um modelo completo de string de conexão, incluindo:
- Exemplos para diferentes ambientes (local, remoto, nuvem)
- Instruções sobre URL encoding para caracteres especiais
- Configurações adicionais opcionais
- Comentários explicativos detalhados

### Arquivo `server.ts` - ✅ Já Configurado
O arquivo `server.ts` **já possui** a importação do dotenv corretamente configurada na primeira linha:
```typescript
import 'dotenv/config';
```
Esta é a forma moderna e recomendada, que carrega automaticamente as variáveis de ambiente.

---

## 🔧 Configuração do Banco de Dados

### 1. Preparar o Banco de Dados PostgreSQL

Você precisa ter um servidor PostgreSQL rodando. Escolha uma das opções:

#### Opção A: PostgreSQL Local
```bash
# Instalar PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Iniciar o serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Acessar o PostgreSQL
sudo -u postgres psql

# Criar o banco de dados
CREATE DATABASE fantasy12_db;

# Criar um usuário (opcional)
CREATE USER fantasy12_user WITH PASSWORD 'sua_senha_segura';
GRANT ALL PRIVILEGES ON DATABASE fantasy12_db TO fantasy12_user;
```

#### Opção B: PostgreSQL em Nuvem
Você pode usar serviços gerenciados como:
- **Supabase** (https://supabase.com) - Gratuito até 500MB
- **Railway** (https://railway.app) - Gratuito com limites
- **Render** (https://render.com) - Plano gratuito disponível
- **Neon** (https://neon.tech) - PostgreSQL serverless gratuito

### 2. Configurar a String de Conexão

Edite o arquivo `.env` na raiz do projeto e configure a variável `DATABASE_URL`:

#### Exemplo para Banco Local:
```env
DATABASE_URL="postgresql://postgres:sua_senha@localhost:5432/fantasy12_db?schema=public"
```

#### Exemplo para Banco em Nuvem:
```env
DATABASE_URL="postgresql://usuario:senha@host.railway.app:5432/railway?schema=public"
```

#### ⚠️ IMPORTANTE: Caracteres Especiais na Senha
Se sua senha contém caracteres especiais, você deve usar **URL encoding**:

| Caractere | Codificação |
|-----------|-------------|
| @         | %40         |
| #         | %23         |
| $         | %24         |
| &         | %26         |
| :         | %3A         |
| /         | %2F         |
| ?         | %3F         |
| =         | %3D         |
| %         | %25         |

**Exemplo:**
- Senha original: `Pag@N!n1`
- Senha codificada: `Pag%40N%21n1`
- String completa: `postgresql://postgres:Pag%40N%21n1@localhost:5432/fantasy12_db?schema=public`

### 3. Criar o Schema do Prisma

O arquivo `prisma/schema.prisma` está vazio ou corrompido. Você precisa criar o schema completo. Aqui está um exemplo baseado na estrutura da aplicação:

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(uuid())
  name          String
  email         String   @unique
  cpf           String   @unique
  password      String
  phone         String?
  role          String   @default("user")
  balance       Float    @default(0)
  doubles       Int      @default(0)
  superDoubles  Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  logs          Log[]
  transactions  Transaction[]
  purchases     Purchase[]
  pools         Pool[]
  participants  PoolParticipant[]
}

model Round {
  id        String   @id @default(uuid())
  title     String
  startDate DateTime
  endDate   DateTime
  status    String   @default("draft")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  games     Game[]
}

model Game {
  id        String   @id @default(uuid())
  roundId   String
  teamA     String
  teamB     String
  date      DateTime
  status    String   @default("scheduled")
  order     Int
  scoreA    Int?
  scoreB    Int?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  round     Round    @relation(fields: [roundId], references: [id], onDelete: Cascade)
}

model Pool {
  id                String   @id @default(uuid())
  title             String
  creatorId         String
  creatorName       String
  entryFee          Float
  participantsCount Int      @default(0)
  prizePool         Float    @default(0)
  status            String   @default("open")
  startDate         DateTime
  endDate           DateTime
  description       String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  creator           User     @relation(fields: [creatorId], references: [id])
  participants      PoolParticipant[]
}

model PoolParticipant {
  id        String   @id @default(uuid())
  poolId    String
  userId    String
  paid      Boolean  @default(false)
  createdAt DateTime @default(now())
  
  pool      Pool     @relation(fields: [poolId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([poolId, userId])
}

model Log {
  id        String   @id @default(uuid())
  userId    String
  userName  String
  action    String
  details   String?
  type      String
  timestamp DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Transaction {
  id            String   @id @default(uuid())
  userId        String
  type          String
  fichasAmount  Float
  referenceId   String?
  status        String
  createdAt     DateTime @default(now())
  
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Purchase {
  id           String   @id @default(uuid())
  userId       String
  packageType  String
  priceCents   Int
  fichasAdded  Float
  status       String
  createdAt    DateTime @default(now())
  
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### 4. Aplicar as Migrações

Depois de configurar o schema e a string de conexão:

```bash
# Instalar as dependências (se ainda não instalou)
npm install

# Gerar o cliente Prisma
npx prisma generate

# Criar as tabelas no banco de dados
npx prisma db push

# OU criar uma migração (recomendado para produção)
npx prisma migrate dev --name init
```

### 5. Verificar a Conexão

Para testar se a conexão está funcionando:

```bash
# Abrir o Prisma Studio (interface visual do banco)
npx prisma studio
```

Isso abrirá uma interface web em `http://localhost:5555` onde você pode visualizar e editar os dados.

### 6. Iniciar o Servidor

```bash
# Modo desenvolvimento
npm run server

# Ou com ts-node diretamente
npx ts-node --esm server.ts
```

O servidor deve iniciar em `http://localhost:3000` (ou a porta configurada no `.env`).

---

## 🔍 Troubleshooting

### Erro: "Can't reach database server"
- Verifique se o PostgreSQL está rodando
- Confirme que o host e porta estão corretos
- Teste a conexão com: `psql -h localhost -U postgres -d fantasy12_db`

### Erro: "Authentication failed"
- Verifique usuário e senha na string de conexão
- Confirme que o usuário tem permissões no banco
- Verifique se caracteres especiais estão codificados corretamente

### Erro: "Database does not exist"
- Crie o banco de dados manualmente antes de rodar as migrações
- Use: `CREATE DATABASE fantasy12_db;` no PostgreSQL

### Erro: "SSL connection required"
- Adicione `?sslmode=require` no final da DATABASE_URL
- Ou desabilite SSL (apenas desenvolvimento): `?sslmode=disable`

---

## 🔒 Segurança

1. **NUNCA** commite o arquivo `.env` no Git
2. Adicione `.env` ao `.gitignore`:
   ```
   # .gitignore
   .env
   .env.local
   .env.production
   ```
3. Use senhas fortes para produção
4. Em produção, use variáveis de ambiente do servidor/host
5. Habilite SSL para conexões remotas

---

## 📚 Recursos Adicionais

- [Documentação do Prisma](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Guia de URL Encoding](https://www.w3schools.com/tags/ref_urlencode.asp)

---

## ✨ Resumo das Alterações Realizadas

1. ✅ Arquivo `.env` atualizado com modelo completo de string de conexão
2. ✅ Arquivo `server.ts` já possui importação do dotenv configurada
3. ✅ Documentação completa criada com instruções passo a passo
4. ⚠️ **AÇÃO NECESSÁRIA**: Criar o arquivo `prisma/schema.prisma` com o schema fornecido acima
5. ⚠️ **AÇÃO NECESSÁRIA**: Configurar sua string de conexão real no `.env`
6. ⚠️ **AÇÃO NECESSÁRIA**: Executar `npx prisma db push` para criar as tabelas

---

**Desenvolvido para Fantasy12 - Plataforma de Previsões Esportivas**
