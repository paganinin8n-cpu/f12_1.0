import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Configuração de CORS para Produção
const allowedOrigins = [
  'http://localhost:5173', // Local Frontend
  'http://localhost:3000', // Local Alternative
  'https://www.fantasy12.com', // Production Domain
  'https://fantasy12.com' // Production Domain (no-www)
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(null, true); // Temporariamente permitindo tudo
    }
    return callback(null, true);
  }
}));

app.use(express.json());

// --- HELPER: FORMAT USER ---
// Converte o usuário do formato Prisma (colunas planas) para o formato Frontend (objeto inventory)
const formatUser = (user: any) => {
  if (!user) return null;
  return {
    ...user,
    inventory: {
      doubles: user.doubles || 0,
      superDoubles: user.superDoubles || 0
    },
    // Removemos os campos planos para não confundir, se quiser
    doubles: undefined,
    superDoubles: undefined
  };
};

// --- AUTH ROUTES ---

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user && user.password === password) {
      res.json(formatUser(user));
    } else {
      res.status(401).json({ error: "Credenciais inválidas" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Erro ao fazer login" });
  }
});

// Register
app.post('/api/register', async (req, res) => {
  const { name, email, cpf, password, phone, role } = req.body;
  try {
    const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { cpf }] }
    });
    
    if (existing) {
        return res.status(400).json({ error: "Email ou CPF já cadastrados." });
    }

    const user = await prisma.user.create({
      data: {
        name, email, cpf, password, phone,
        role: role || 'user',
        balance: 0,
        doubles: 0,
        superDoubles: 0
      }
    });
    res.json(formatUser(user));
  } catch (error) {
    console.error("Register error:", error);
    res.status(400).json({ error: "Erro ao criar usuário" });
  }
});

// --- USER ROUTES ---

app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
        orderBy: { name: 'asc' }
    });
    res.json(users.map(formatUser));
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  
  const { inventory, ...cleanData } = data;
  
  let updateData: any = { ...cleanData };
  
  // Se inventory vier no payload, mapear para colunas planas
  if (inventory) {
      updateData.doubles = inventory.doubles;
      updateData.superDoubles = inventory.superDoubles;
  }

  // Proteção: não permitir alterar ID
  delete updateData.id;

  try {
    const user = await prisma.user.update({
      where: { id },
      data: updateData
    });
    res.json(formatUser(user));
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
});

// --- ROUNDS ROUTES ---

app.get('/api/rounds', async (req, res) => {
  try {
    // Buscar rodadas e seus jogos
    const rounds = await prisma.round.findMany({
      include: { 
        games: {
          orderBy: { order: 'asc' }
        } 
      },
      orderBy: { startDate: 'asc' }
    });
    
    // Mapear campos snake_case do banco para camelCase do front se necessário
    // Prisma já faz isso se usarmos @map no schema, mas garantindo aqui
    res.json(rounds);
  } catch (error) {
    console.error("Get rounds error:", error);
    res.status(500).json({ error: "Erro ao buscar rodadas" });
  }
});

app.post('/api/rounds', async (req, res) => {
  const { title, startDate, endDate, status, games } = req.body;
  try {
    const round = await prisma.round.create({
      data: {
        title,
        startDate,
        endDate,
        status: status || 'draft',
        games: {
          create: games.map((g: any) => ({
            teamA: g.teamA,
            teamB: g.teamB,
            date: g.date,
            status: g.status || 'scheduled',
            order: g.order,
            scoreA: g.scoreA,
            scoreB: g.scoreB
          }))
        }
      },
      include: { games: true }
    });
    res.json(round);
  } catch (error) {
    console.error("Create round error:", error);
    res.status(500).json({ error: "Erro ao criar rodada" });
  }
});

app.put('/api/rounds/:id', async (req, res) => {
  const { id } = req.params;
  const { title, startDate, endDate, status, games } = req.body;

  try {
    // Atualiza dados básicos da rodada
    const round = await prisma.round.update({
      where: { id },
      data: {
        title,
        startDate,
        endDate,
        status
      }
    });

    // Atualiza jogos individualmente
    // Em produção, isso deveria ser uma transaction ou upsert
    if (games && Array.isArray(games)) {
      for (const game of games) {
        if (game.id.startsWith('g-new-')) {
            // Criar novo jogo se ID for temporário
            await prisma.game.create({
                data: {
                    roundId: id,
                    teamA: game.teamA,
                    teamB: game.teamB,
                    date: game.date,
                    status: game.status,
                    order: game.order,
                    scoreA: game.scoreA,
                    scoreB: game.scoreB
                }
            });
        } else {
            // Atualizar jogo existente
            await prisma.game.update({
                where: { id: game.id },
                data: {
                    teamA: game.teamA,
                    teamB: game.teamB,
                    date: game.date,
                    status: game.status,
                    scoreA: game.scoreA,
                    scoreB: game.scoreB
                }
            });
        }
      }
    }

    // Retorna a rodada atualizada com jogos
    const updatedRound = await prisma.round.findUnique({
      where: { id },
      include: { games: { orderBy: { order: 'asc' } } }
    });
    
    res.json(updatedRound);
  } catch (error) {
    console.error("Update round error:", error);
    res.status(500).json({ error: "Erro ao atualizar rodada" });
  }
});

// --- POOLS ROUTES ---

app.get('/api/pools', async (req, res) => {
  try {
    const pools = await prisma.pool.findMany({
      include: {
        participants: true // Isso trará a relação PoolParticipant
      }
    });
    
    // Formatar para o frontend (que espera um array de IDs em 'participants')
    const formattedPools = pools.map(p => ({
      ...p,
      participants: p.participants.map((pp: any) => pp.userId)
    }));
    
    res.json(formattedPools);
  } catch (error) {
    console.error("Get pools error:", error);
    res.status(500).json({ error: "Erro ao buscar bolões" });
  }
});

app.post('/api/pools', async (req, res) => {
  const { title, entryFee, creatorId, startDate, endDate, description } = req.body;
  
  try {
    // Buscar nome do criador
    const creator = await prisma.user.findUnique({ where: { id: creatorId } });
    
    const pool = await prisma.pool.create({
      data: {
        title,
        creatorName: creator?.name || 'Admin',
        entryFee,
        participantsCount: 1,
        prizePool: entryFee, // Inicial
        status: 'open',
        startDate,
        endDate,
        description,
        participants: {
          create: {
            userId: creatorId,
            paid: true
          }
        }
      }
    });

    // Debitar valor da entrada se necessário (lógica simplificada)
    // Em produção, criaríamos Transaction

    const formattedPool = {
        ...pool,
        participants: [creatorId]
    };

    res.json(formattedPool);
  } catch (error) {
    console.error("Create pool error:", error);
    res.status(500).json({ error: "Erro ao criar bolão" });
  }
});

app.post('/api/pools/:id/join', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    // Verificar se já participa
    const existing = await prisma.poolParticipant.findUnique({
        where: {
            poolId_userId: {
                poolId: id,
                userId: userId
            }
        }
    });

    if (existing) {
        return res.status(400).json({ error: "Usuário já participa deste bolão" });
    }

    // Adicionar participante
    await prisma.poolParticipant.create({
        data: {
            poolId: id,
            userId: userId,
            paid: true
        }
    });

    // Atualizar contadores do bolão
    const pool = await prisma.pool.findUnique({ where: { id } });
    if (pool) {
        await prisma.pool.update({
            where: { id },
            data: {
                participantsCount: { increment: 1 },
                prizePool: { increment: pool.entryFee }
            }
        });
    }

    // Retornar bolão atualizado
    const updatedPool = await prisma.pool.findUnique({
        where: { id },
        include: { participants: true }
    });

    const formatted = {
        ...updatedPool,
        participants: updatedPool?.participants.map((p: any) => p.userId) || []
    };

    res.json(formatted);

  } catch (error) {
    console.error("Join pool error:", error);
    res.status(500).json({ error: "Erro ao entrar no bolão" });
  }
});

// --- LOGS ROUTES ---

app.get('/api/logs', async (req, res) => {
  try {
    const logs = await prisma.log.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100
    });
    res.json(logs);
  } catch (error) {
    console.error("Get logs error:", error);
    res.status(500).json({ error: "Erro ao buscar logs" });
  }
});

app.post('/api/logs', async (req, res) => {
  const data = req.body;
  try {
    const log = await prisma.log.create({
      data: {
        userId: data.userId,
        userName: data.userName,
        action: data.action,
        details: data.details,
        type: data.type,
        timestamp: data.timestamp || new Date()
      }
    });
    res.json(log);
  } catch (error) {
    console.error("Create log error:", error);
    // Não retornar 500 para não quebrar fluxo principal se log falhar
    res.json({ success: false }); 
  }
});

// --- PAYMENT ROUTES ---

app.post('/api/payments/process', async (req, res) => {
  const { userId, packageType, priceCents, fichasAdded } = req.body;

  try {
    // 1. Registrar Compra
    const purchase = await prisma.purchase.create({
      data: {
        userId,
        packageType,
        priceCents,
        fichasAdded,
        status: 'CONFIRMED'
      }
    });

    // 2. Criar Transação de Crédito
    await prisma.transaction.create({
      data: {
        userId,
        type: 'PURCHASE',
        fichasAmount: fichasAdded,
        referenceId: purchase.id,
        status: 'CONFIRMED'
      }
    });

    // 3. Atualizar Saldo do Usuário
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        balance: { increment: fichasAdded }
      }
    });

    // 4. Log do Sistema
    await prisma.log.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'Compra Realizada',
        details: `Comprou ${packageType} (+${fichasAdded} Fichas)`,
        type: 'success',
        timestamp: new Date()
      }
    });

    res.json(formatUser(user));
  } catch (error) {
    console.error("Payment process error:", error);
    res.status(500).json({ error: "Erro ao processar pagamento" });
  }
});

// Mock Stripe Webhook
app.post('/api/payments/stripe', async (req, res) => {
  // Em produção, verificar assinatura do Stripe aqui
  console.log("Stripe Webhook received:", req.body);
  res.json({ received: true });
});


// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});