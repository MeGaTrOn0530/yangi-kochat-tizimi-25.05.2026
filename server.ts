import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db.js';
import { PlantStage, TaskStatus } from './src/types';

async function startServer() {
  // Initialize and seed database
  await db.init();

  const app = express();
  const PORT = 3000;

  // Body parser for handling JSON post payloads
  app.use(express.json({ limit: '10mb' }));

  // ==================== DB STATUS API ====================
  app.get('/api/db-status', (req, res) => {
    res.json({
      mode: (db as any).dbMode,
      connected: (db as any).mysqlConnected,
      info: (db as any).mysqlInfo,
      config: {
        host: process.env.MYSQL_HOST || null,
        user: process.env.MYSQL_USER || null,
        database: process.env.MYSQL_DATABASE || null,
        port: Number(process.env.MYSQL_PORT) || 3306
      }
    });
  });

  // ==================== AUTH API ====================
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

    // Direct simple passwords corresponding to user roles for testing convenience
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
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        location_id: user.location_id,
        is_active: user.is_active
      }
    });
  });

  // ==================== USERS API ====================
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

  // ==================== LOCATIONS API ====================
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

  // Get current inventory quantities per stage inside location
  app.get('/api/locations/:id/inventory', (req, res) => {
    const id = parseInt(req.params.id);
    const plants = db.getPlants().filter(p => p.location_id === id);
    
    // Group active count by growth stage
    const summary = {
      cassette: plants.filter(p => p.stage === 'cassette').length,
      grafting: plants.filter(p => p.stage === 'grafting').length,
      seedling: plants.filter(p => p.stage === 'seedling').length,
      ready: plants.filter(p => p.stage === 'ready').length,
      defect: plants.filter(p => p.stage === 'defect' || p.is_defect).length,
      sold: plants.filter(p => p.stage === 'sold').length,
      total_active: plants.filter(p => p.stage !== 'sold' && p.stage !== 'defect' && !p.is_defect).length
    };

    res.json(summary);
  });

  // ==================== CATALOG API ====================
  // Plant Types
  app.get('/api/catalog/plant-types', (req, res) => {
    res.json(db.getPlantTypes());
  });

  app.post('/api/catalog/plant-types', (req, res) => {
    const newPt = db.addPlantType(req.body);
    res.status(201).json(newPt);
  });

  app.put('/api/catalog/plant-types/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const updated = db.updatePlantType(id, req.body);
    if (!updated) return res.status(404).json({ error: "Ko'chat turi topilmadi." });
    res.json(updated);
  });

  app.delete('/api/catalog/plant-types/:id', (req, res) => {
    const id = parseInt(req.params.id);
    db.deletePlantType(id);
    res.json({ success: true });
  });

  // Varieties
  app.get('/api/catalog/varieties', (req, res) => {
    res.json(db.getVarieties());
  });

  app.post('/api/catalog/varieties', (req, res) => {
    const newV = db.addVariety(req.body);
    res.status(201).json(newV);
  });

  app.put('/api/catalog/varieties/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const updated = db.updateVariety(id, req.body);
    if (!updated) return res.status(404).json({ error: "Nav topilmadi." });
    res.json(updated);
  });

  app.delete('/api/catalog/varieties/:id', (req, res) => {
    const id = parseInt(req.params.id);
    db.deleteVariety(id);
    res.json({ success: true });
  });

  // Graft Types
  app.get('/api/catalog/graft-types', (req, res) => {
    res.json(db.getGraftTypes());
  });

  app.post('/api/catalog/graft-types', (req, res) => {
    const newGt = db.addGraftType(req.body);
    res.status(201).json(newGt);
  });

  app.put('/api/catalog/graft-types/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const updated = db.updateGraftType(id, req.body);
    if (!updated) return res.status(404).json({ error: "Payvandlash turi topilmadi." });
    res.json(updated);
  });

  // ==================== BATCHES & PLANTS API ====================
  app.get('/api/batches', (req, res) => {
    let batches = db.getBatches();
    const locId = req.query.location_id ? parseInt(req.query.location_id as string) : null;
    const status = req.query.status as string;

    if (locId) {
      batches = batches.filter(b => b.location_id === locId);
    }
    if (status) {
      batches = batches.filter(b => b.status === status);
    }

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

  app.get('/api/batches/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const batch = db.getBatches().find(b => b.id === id);
    if (!batch) return res.status(404).json({ error: "Partiya topilmadi." });
    res.json(batch);
  });

  app.get('/api/batches/:id/plants', (req, res) => {
    const id = parseInt(req.params.id);
    const plants = db.getPlants().filter(p => p.batch_id === id);
    res.json(plants);
  });

  // ==================== SCAN AND DETECT API ====================
  // Skanerlanganda QR kodni aniqlash (Dona yoki Partiya)
  app.get('/api/plants/scan/:code', (req, res) => {
    const code = req.params.code;
    
    // First try mapping directly inside plant codes
    const plant = db.getPlants().find(p => p.plant_code === code);
    if (plant) {
      const batch = db.getBatches().find(b => b.id === plant.batch_id);
      return res.json({
        type: "plant",
        plant,
        batch
      });
    }

    // Try mapping inside batch codes
    const batch = db.getBatches().find(b => b.batch_code === code);
    if (batch) {
      const plants = db.getPlants().filter(p => p.batch_id === batch.id);
      return res.json({
        type: "batch",
        batch,
        plants
      });
    }

    return res.status(404).json({ error: "Skanerlangan QR kodga mos ma'lumot topilmadi." });
  });

  // Update plants level stage & historic records
  app.post('/api/plants/:id/stage', (req, res) => {
    const id = parseInt(req.params.id);
    const { toStage, changedBy, notes, isDefect, defectImage, approvedByHead } = req.body;
    
    const updated = db.changePlantStages([id], toStage, changedBy, notes, isDefect, defectImage, approvedByHead);
    if (updated.length === 0) return res.status(404).json({ error: "Dona o'simlik topilmadi." });
    
    res.json(updated[0]);
  });

  // Large-scale multiple plants stages modification inside batch
  app.post('/api/batches/:id/stage', (req, res) => {
    const batchId = parseInt(req.params.id);
    const { plantIds, toStage, changedBy, notes, isDefect, defectImage, approvedByHead } = req.body;
    
    // Validate if plants belong to batch
    const allPlants = db.getPlants().filter(p => p.batch_id === batchId).map(p => p.id);
    const filteredPlantIds = plantIds.filter((pid: number) => allPlants.includes(pid));

    if (filteredPlantIds.length === 0) {
      return res.status(400).json({ error: "Ushbu partiyaga tegishli o'simliklar topilmadi." });
    }

    const updated = db.changePlantStages(filteredPlantIds, toStage, changedBy, notes, isDefect, defectImage, approvedByHead);
    res.json(updated);
  });

  // Get pending level stage logs for Head Agronomist approval
  app.get('/api/stage-history/pending', (req, res) => {
    const history = db.getStageHistory().filter(h => h.status === 'pending');
    
    // Populate additional details
    const populated = history.map(h => {
      const plant = db.getPlants().find(p => p.id === h.plant_id);
      const batch = db.getBatches().find(b => b.id === h.batch_id);
      const user = db.getUsers().find(u => u.id === h.changed_by);
      return {
        ...h,
        plant_code: plant?.plant_code,
        batch_code: batch?.batch_code,
        changed_by_name: user?.name,
        plant_type_id: batch?.plant_type_id,
        variety_id: batch?.variety_id
      };
    });

    res.json(populated);
  });

  // Head Agronomist Approve/Reject stage history update
  app.post('/api/stage-history/:id/approve', (req, res) => {
    const historyId = parseInt(req.params.id);
    const { approvedBy, isApproved } = req.body;

    const result = db.approveStageHistory(historyId, approvedBy, isApproved);
    if (!result) return res.status(404).json({ error: "Tasdiqlash tarixi topilmadi." });

    res.json(result);
  });

  // Retrieve complete history logs for single plant ID or batch
  app.get('/api/plants/:id/history', (req, res) => {
    const plantId = parseInt(req.params.id);
    const logs = db.getStageHistory().filter(h => h.plant_id === plantId);
    res.json(logs);
  });

  // ==================== TRANSFERS API ====================
  app.get('/api/transfers', (req, res) => {
    const transfers = db.getTransfers();
    res.json(transfers);
  });

  app.post('/api/transfers', (req, res) => {
    try {
      const newTransfer = db.createTransfer(req.body);
      res.status(201).json(newTransfer);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put('/api/transfers/:id/approve', (req, res) => {
    const id = parseInt(req.params.id);
    const { approvedBy } = req.body;
    const approved = db.approveTransfer(id, approvedBy);
    if (!approved) return res.status(404).json({ error: "Transfer topilmadi." });
    res.json(approved);
  });

  app.put('/api/transfers/:id/reject', (req, res) => {
    const id = parseInt(req.params.id);
    const { rejectedBy } = req.body;
    const rejected = db.rejectTransfer(id, rejectedBy);
    if (!rejected) return res.status(404).json({ error: "Transfer topilmadi." });
    res.json(rejected);
  });

  app.put('/api/transfers/:id/send', (req, res) => {
    const id = parseInt(req.params.id);
    const { sentBy, plantIds } = req.body;
    const sent = db.sendTransferPlants(id, sentBy, plantIds);
    if (!sent) return res.status(404).json({ error: "Transfer topilmadi." });
    res.json(sent);
  });

  app.put('/api/transfers/:id/receive', (req, res) => {
    const id = parseInt(req.params.id);
    const { receivedBy, plantIds } = req.body;
    const received = db.receiveTransferPlants(id, receivedBy, plantIds);
    if (!received) return res.status(404).json({ error: "Transfer topilmadi." });
    res.json(received);
  });

  // ==================== SALES API ====================
  app.get('/api/sales', (req, res) => {
    res.json(db.getSales());
  });

  app.post('/api/sales', (req, res) => {
    const { saleData, plantIds } = req.body;
    const newSale = db.createSale(saleData, plantIds || []);
    res.status(201).json(newSale);
  });

  app.put('/api/sales/:id/confirm', (req, res) => {
    const id = parseInt(req.params.id);
    const { confirmedBy } = req.body;
    const confirmed = db.confirmSale(id, confirmedBy);
    if (!confirmed) return res.status(404).json({ error: "Sotuv topilmadi." });
    res.json(confirmed);
  });

  app.put('/api/sales/:id/cancel', (req, res) => {
    const id = parseInt(req.params.id);
    const cancelled = db.cancelSale(id);
    if (!cancelled) return res.status(404).json({ error: "Sotuv topilmadi." });
    res.json(cancelled);
  });

  // ==================== TASKS API ====================
  app.get('/api/tasks', (req, res) => {
    const userId = req.query.user_id ? parseInt(req.query.user_id as string) : null;
    let tasks = db.getTasks();
    if (userId) {
      tasks = tasks.filter(t => t.assigned_to === userId);
    }
    res.json(tasks);
  });

  app.post('/api/tasks', (req, res) => {
    const newTask = db.addTask(req.body);
    res.status(201).json(newTask);
  });

  app.put('/api/tasks/:id/status', (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const updated = db.updateTaskStatus(id, status as TaskStatus);
    if (!updated) return res.status(404).json({ error: "Topshiriq topilmadi." });
    res.json(updated);
  });

  // ==================== REPORTS API ====================
  app.get('/api/reports/dashboard', (req, res) => {
    const batches = db.getBatches();
    const plants = db.getPlants();
    const sales = db.getSales().filter(s => s.status === 'confirmed');

    // Totals
    const totalPlantsInDb = plants.length;
    const activeCount = plants.filter(p => p.stage !== 'sold' && p.stage !== 'defect' && !p.is_defect).length;
    const readyCount = plants.filter(p => p.stage === 'ready' && !p.is_defect).length;
    const defectCount = plants.filter(p => p.stage === 'defect' || p.is_defect).length;
    const soldCount = plants.filter(p => p.stage === 'sold').length;

    // Total income
    const totalEarnings = sales.reduce((sum, s) => sum + Number(s.total_price), 0);

    // Group active levels per location
    const locations = db.getLocations();
    const locationStats = locations.map(loc => {
      const locPlants = plants.filter(p => p.location_id === loc.id);
      return {
        id: loc.id,
        name: loc.name,
        type: loc.type,
        capacity: loc.capacity,
        active: locPlants.filter(p => p.stage !== 'sold' && p.stage !== 'defect' && !p.is_defect).length,
        ready: locPlants.filter(p => p.stage === 'ready' && !p.is_defect).length,
        defect: locPlants.filter(p => p.stage === 'defect' || p.is_defect).length,
        capacityUsedPercent: Math.round((locPlants.filter(p => p.stage !== 'sold').length / loc.capacity) * 100) || 0
      };
    });

    res.json({
      summary: {
        totalPlantsInDb,
        activeCount,
        readyCount,
        defectCount,
        soldCount,
        totalEarnings,
        activeBatches: batches.filter(b => b.status === 'in_progress').length,
      },
      locationStats
    });
  });

  // Defects Report endpoint
  app.get('/api/reports/defects', (req, res) => {
    const history = db.getStageHistory().filter(h => h.is_defect);
    
    // Map with detail objects
    const logs = history.map(h => {
      const plant = db.getPlants().find(p => p.id === h.plant_id);
      const batch = db.getBatches().find(b => b.id === h.batch_id);
      const type = batch ? db.getPlantTypes().find(t => t.id === batch.plant_type_id) : null;
      const variety = batch ? db.getVarieties().find(v => v.id === batch.variety_id) : null;
      const location = plant ? db.getLocations().find(l => l.id === plant.location_id) : null;
      const reporter = db.getUsers().find(u => u.id === h.changed_by);
      const approver = db.getUsers().find(u => u.id === h.approved_by);

      return {
        id: h.id,
        plant_code: plant?.plant_code || "Noma'lum",
        batch_code: batch?.batch_code || "Noma'lum",
        plant_type: type?.name || "Noma'lum",
        variety: variety?.name || "Noma'lum",
        location_name: location?.name || "Noma'lum",
        reporter_name: reporter?.name || "Noma'lum",
        approved_by_name: approver?.name || "Kutilmoqda",
        notes: h.notes,
        image: h.defect_image,
        date: h.changed_at
      };
    });

    res.json(logs);
  });

  // ==================== VITE CLIENT INTEGRATION ====================
  // Serve UI routes and support full stack bundling
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Greenhouse Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start greenhouse backend server:", err);
});
