import express from 'express';
import dotenv from 'dotenv';
import { db } from './src/server/db.js';
import { TaskStatus } from './src/types.js';

dotenv.config();

async function startServer() {
  await db.init();

  const app = express();
  const PORT = process.env.PORT || 5000;

  // Enable CORS so the separate React frontend can cross-origin request this API
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json({ limit: '10mb' }));

  // ==================== API ENDPOINTS ====================

  app.get('/api/db-status', (req, res) => {
    res.json({
      mode: (db as any).dbMode,
      connected: (db as any).mysqlConnected,
      info: (db as any).mysqlInfo,
      config: {
        host: process.env.MYSQL_HOST || null,
        user: process.env.MYSQL_USER || null
      }
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email va parol kiritilishi shart." });
    }

    const users = db.getUsers();
    const user = users.find(u => u.email === email && u.is_active);

    if (!user) {
      return res.status(401).json({ error: "Foydalanuvchi topilmadi yoki faol emas." });
    }

    const rolePasswords: Record<string, string> = {
      director: 'director',
      admin: 'admin',
      head_agronomist: 'head',
      agronomist: 'agronomist',
      laborant: 'laborant',
      accountant: 'accountant'
    };

    const expectedPassword = rolePasswords[user.role] || 'pass';
    if (password !== expectedPassword) {
      return res.status(401).json({ error: "Parol noto'g'ri." });
    }

    return res.json({
      message: "Tizimga muvaffaqiyatli kirildi.",
      user
    });
  });

  app.get('/api/users', (req, res) => {
    res.json(db.getUsers());
  });

  app.post('/api/users', (req, res) => {
    try {
      const newUser = db.addUser(req.body);
      res.status(201).json(newUser);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put('/api/users/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const updated = db.updateUser(id, req.body);
    if (!updated) return res.status(404).json({ error: "Foydalanuvchi topilmadi." });
    res.json(updated);
  });

  app.delete('/api/users/:id', (req, res) => {
    const id = parseInt(req.params.id);
    db.deleteUser(id);
    res.json({ success: true });
  });

  app.get('/api/locations', (req, res) => {
    res.json(db.getLocations());
  });

  app.post('/api/locations', (req, res) => {
    const newLoc = db.addLocation(req.body);
    res.status(201).json(newLoc);
  });

  app.put('/api/locations/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const updated = db.updateLocation(id, req.body);
    if (!updated) return res.status(404).json({ error: "Lokatsiya topilmadi." });
    res.json(updated);
  });

  app.get('/api/locations/:id/inventory', (req, res) => {
    const id = parseInt(req.params.id);
    const plants = db.getPlants().filter(p => p.location_id === id);
    res.json({
      cassette: plants.filter(p => p.stage === 'cassette').length,
      grafting: plants.filter(p => p.stage === 'grafting').length,
      seedling: plants.filter(p => p.stage === 'seedling').length,
      ready: plants.filter(p => p.stage === 'ready').length,
      defect: plants.filter(p => p.stage === 'defect' || p.is_defect).length,
      sold: plants.filter(p => p.stage === 'sold').length,
      total_active: plants.filter(p => p.stage !== 'sold' && p.stage !== 'defect' && !p.is_defect).length
    });
  });

  app.get('/api/catalog/plant-types', (req, res) => res.json(db.getPlantTypes()));
  app.post('/api/catalog/plant-types', (req, res) => res.status(201).json(db.addPlantType(req.body)));
  app.put('/api/catalog/plant-types/:id', (req, res) => {
    const updated = db.updatePlantType(parseInt(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Tur topilmadi" });
    res.json(updated);
  });
  app.delete('/api/catalog/plant-types/:id', (req, res) => {
    db.deletePlantType(parseInt(req.params.id));
    res.json({ success: true });
  });

  app.get('/api/catalog/varieties', (req, res) => res.json(db.getVarieties()));
  app.post('/api/catalog/varieties', (req, res) => res.status(201).json(db.addVariety(req.body)));
  app.put('/api/catalog/varieties/:id', (req, res) => {
    const updated = db.updateVariety(parseInt(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Nav topilmadi" });
    res.json(updated);
  });
  app.delete('/api/catalog/varieties/:id', (req, res) => {
    db.deleteVariety(parseInt(req.params.id));
    res.json({ success: true });
  });

  app.get('/api/catalog/graft-types', (req, res) => res.json(db.getGraftTypes()));
  app.post('/api/catalog/graft-types', (req, res) => res.status(201).json(db.addGraftType(req.body)));

  app.get('/api/batches', (req, res) => {
    let batches = db.getBatches();
    const locId = req.query.location_id ? parseInt(req.query.location_id as string) : null;
    if (locId) batches = batches.filter(b => b.location_id === locId);
    res.json(batches);
  });

  app.post('/api/batches', async (req, res) => {
    try {
      const newBatch = await db.createBatch(req.body);
      res.status(201).json(newBatch);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get('/api/batches/:id/plants', (req, res) => {
    res.json(db.getPlants().filter(p => p.batch_id === parseInt(req.params.id)));
  });

  app.get('/api/plants/scan/:code', (req, res) => {
    const code = req.params.code;
    const plant = db.getPlants().find(p => p.plant_code === code);
    if (plant) {
      const batch = db.getBatches().find(b => b.id === plant.batch_id);
      return res.json({ type: "plant", plant, batch });
    }
    const batch = db.getBatches().find(b => b.batch_code === code);
    if (batch) {
      return res.json({ type: "batch", batch, plants: db.getPlants().filter(p => p.batch_id === batch.id) });
    }
    res.status(404).json({ error: "QR kod topilmadi" });
  });

  app.post('/api/plants/:id/stage', (req, res) => {
    const id = parseInt(req.params.id);
    const { toStage, changedBy, notes, isDefect, defectImage, approvedByHead } = req.body;
    const updated = db.changePlantStages([id], toStage, changedBy, notes, isDefect, defectImage, approvedByHead);
    if (updated.length === 0) return res.status(404).json({ error: "Topilmadi." });
    res.json(updated[0]);
  });

  app.get('/api/transfers', (req, res) => res.json(db.getTransfers()));
  app.post('/api/transfers', (req, res) => res.status(201).json(db.createTransfer(req.body)));

  app.put('/api/transfers/:id/approve', (req, res) => {
    const updated = db.approveTransfer(parseInt(req.params.id), req.body.approvedBy);
    res.json(updated);
  });

  app.put('/api/transfers/:id/reject', (req, res) => {
    res.json(db.rejectTransfer(parseInt(req.params.id), req.body.rejectedBy));
  });

  app.put('/api/transfers/:id/send', (req, res) => {
    res.json(db.sendTransferPlants(parseInt(req.params.id), req.body.sentBy, req.body.plantIds));
  });

  app.put('/api/transfers/:id/receive', (req, res) => {
    res.json(db.receiveTransferPlants(parseInt(req.params.id), req.body.receivedBy, req.body.plantIds));
  });

  app.get('/api/sales', (req, res) => res.json(db.getSales()));
  app.post('/api/sales', (req, res) => res.status(201).json(db.createSale(req.body.saleData, req.body.plantIds)));
  app.put('/api/sales/:id/confirm', (req, res) => res.json(db.confirmSale(parseInt(req.params.id), req.body.confirmedBy)));
  app.put('/api/sales/:id/cancel', (req, res) => res.json(db.cancelSale(parseInt(req.params.id))));

  app.get('/api/tasks', (req, res) => res.json(db.getTasks()));
  app.post('/api/tasks', (req, res) => res.status(201).json(db.addTask(req.body)));
  app.put('/api/tasks/:id/status', (req, res) => res.json(db.updateTaskStatus(parseInt(req.params.id), req.body.status)));

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Standalone API Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Server boot failure:", err);
});
