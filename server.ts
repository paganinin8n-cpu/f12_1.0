import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- AUTH ROUTES ---

// Login (Simples - Em produção use JWT)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user && user.password === password) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Credenciais inválidas" });
    }
  } catch (error) {
    res.status(500).json({ error: "Erro ao fazer login" });
  }
});

// Register
app.post('/api/register', async (req, res) => {
  const { name, email, cpf, password, phone } = req.body;
  try {
    const user = await prisma.user.create({
      data: {
        name, email, cpf, password, phone,
        role: 'user',
        balance: 0,
        doubles: 0,
        superDoubles: 0
      }
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: "Erro ao criar usuário (Email ou CPF já existem?)" });
  }
});

// --- USER ROUTES ---

app.get('/api/users', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    const user = await prisma.user.update({
      where: { id },
      data: data
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
});

// --- ROUNDS ROUTES ---

app.get('/api/rounds', async (req, res) => {
  const rounds = await prisma.round.findMany({
    include: { games: { orderBy: { order: 'asc' } } },
    orderBy: { startDate: 'desc' }
  });
  res.json(rounds);
});

app.post('/api/rounds', async (req, res) => {
  const { title, startDate, endDate, status, games } = req.body;
  try {
    const round = await prisma.round.create({
      data: {
        title, startDate, endDate, status,
        games: {
          create: games.map((g: any) => ({
            teamA: g.teamA,
            teamB: g.teamB,
            date: g.date,
            status: g.status,
            order: g.order
          }))
        }
      },
      include: { games: true }
    });
    res.json(round);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar rodada" });
  }
});

// --- POOLS ROUTES ---

app.get('/api/pools', async (req, res) => {
  const pools = await prisma.pool.findMany({
    include: { participants: true }
  });
  
  // Formatando para o frontend (array de strings de IDs)
  const formattedPools = pools.map(p => ({
    ...p,
    participants: p.participants.map(pp => pp.userId)
  }));
  
  res.json(formattedPools);
});

app.post('/api/pools', async (req, res) => {
  const { title, creatorName, entryFee, startDate, endDate, description, creatorId } = req.body;
  
  try {
    const pool = await prisma.pool.create({
      data: {
        title, creatorName, entryFee, startDate, endDate, description,
        participantsCount: 1,
        prizePool: entryFee,
        status: 'open',
        participants: {
          create: { userId: creatorId }
        }
      }
    });
    res.json(pool);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar bolão" });
  }
});

app.post('/api/pools/:id/join', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    // Transaction: Add participant, Update Pool count/prize, Deduct User Balance
    const result = await prisma.$transaction(async (tx) => {
      const pool = await tx.pool.findUnique({ where: { id } });
      if (!pool) throw new Error("Bolão não encontrado");

      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || user.balance < pool.entryFee) throw new Error("Saldo insuficiente");

      // Deduct balance
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: pool.entryFee } }
      });

      // Add participant
      await tx.poolParticipant.create({
        data: { poolId: id, userId }
      });

      // Update pool stats
      const updatedPool = await tx.pool.update({
        where: { id },
        data: {
          participantsCount: { increment: 1 },
          prizePool: { increment: pool.entryFee }
        }
      });

      return updatedPool;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Erro ao entrar no bolão" });
  }
});

// --- LOGS ---
app.post('/api/logs', async (req, res) => {
  const data = req.body;
  await prisma.log.create({ data });
  res.sendStatus(201);
});

app.get('/api/logs', async (req, res) => {
  const logs = await prisma.log.findMany({ orderBy: { timestamp: 'desc' } });
  res.json(logs);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
