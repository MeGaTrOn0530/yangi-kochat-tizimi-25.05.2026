import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import {
  User,
  Location,
  PlantType,
  Variety,
  GraftType,
  Batch,
  Plant,
  StageHistory,
  Transfer,
  Sale,
  Task,
  UserRole,
  PlantStage,
  TaskStatus
} from '../types.js';

interface DatabaseSchema {
  users: User[];
  locations: Location[];
  plantTypes: PlantType[];
  varieties: Variety[];
  graftTypes: GraftType[];
  batches: Batch[];
  plants: Plant[];
  stageHistory: StageHistory[];
  transfers: Transfer[];
  sales: Sale[];
  tasks: Task[];
}

const DB_FILE_PATH = path.join(process.cwd(), 'db.json');

const initialDbState: DatabaseSchema = {
  users: [
    { id: 1, name: "Azimjon Karimov", email: "director@seedling.uz", role: "director", location_id: null, is_active: true, created_at: "2026-01-10T08:00:00Z" },
    { id: 2, name: "Sardor Alimov", email: "admin@seedling.uz", role: "admin", location_id: null, is_active: true, created_at: "2026-01-11T09:00:00Z" },
    { id: 3, name: "Jasur Nematov", email: "head_agronomist@seedling.uz", role: "head_agronomist", location_id: null, is_active: true, created_at: "2026-01-12T10:00:00Z" },
    { id: 4, name: "Rustam Tursunov", email: "agronomy1@seedling.uz", role: "agronomist", location_id: 1, is_active: true, created_at: "2026-01-15T11:00:00Z" },
    { id: 5, name: "Dilshod Ergashev", email: "agronomy2@seedling.uz", role: "agronomist", location_id: 3, is_active: true, created_at: "2026-01-15T12:00:00Z" },
    { id: 6, name: "Bahodir Umarov", email: "agronomy3@seedling.uz", role: "agronomist", location_id: 7, is_active: true, created_at: "2026-01-15T13:00:00Z" },
    { id: 7, name: "Madina Malikova", email: "laborant@seedling.uz", role: "laborant", location_id: null, is_active: true, created_at: "2026-01-20T14:30:00Z" },
    { id: 8, name: "Zoya Petrova", email: "accountant@seedling.uz", role: "accountant", location_id: null, is_active: true, created_at: "2026-01-22T15:00:00Z" }
  ],
  locations: [
    { id: 1, name: "1-chi issiqxona (Teplitsa)", type: "greenhouse", capacity: 10000, is_active: true, created_at: "2026-01-01T00:00:00Z" },
    { id: 2, name: "2-chi issiqxona (Teplitsa)", type: "greenhouse", capacity: 12000, is_active: true, created_at: "2026-01-01T00:00:00Z" },
    { id: 3, name: "3-chi issiqxona (Teplitsa)", type: "greenhouse", capacity: 8000, is_active: true, created_at: "2026-01-01T00:00:00Z" },
    { id: 4, name: "4-chi issiqxona (Teplitsa)", type: "greenhouse", capacity: 15000, is_active: true, created_at: "2026-01-01T00:00:00Z" },
    { id: 5, name: "5-chi issiqxona (Teplitsa)", type: "greenhouse", capacity: 10000, is_active: true, created_at: "2026-01-01T00:00:00Z" },
    { id: 6, name: "6-chi issiqxona (Teplitsa)", type: "greenhouse", capacity: 12000, is_active: true, created_at: "2026-01-01T00:00:00Z" },
    { id: 7, name: "Ochiq dala A", type: "open_field", capacity: 50000, is_active: true, created_at: "2026-01-01T00:00:00Z" },
    { id: 8, name: "Ochiq dala B", type: "open_field", capacity: 40000, is_active: true, created_at: "2026-01-01T00:00:00Z" }
  ],
  plantTypes: [
    { id: 1, name: "Pomidor", description: "Sershona, hosildor poliz ekini", created_by: 7, created_at: "2026-02-01T09:00:00Z" },
    { id: 2, name: "Bodring", description: "Issiqsevar, sersuv poliz ekini", created_by: 7, created_at: "2026-02-01T09:30:00Z" },
    { id: 3, name: "Qalampir", description: "Vitamin darmonlariga boy shirin va achchiq qalampir navlari", created_by: 7, created_at: "2026-02-02T10:00:00Z" },
    { id: 4, name: "Baqlajon", description: "Foydali to'q binafsha rangli sabzavot ekini", created_by: 7, created_at: "2026-02-02T10:15:00Z" }
  ],
  varieties: [
    { id: 1, plant_type_id: 1, name: "F1 Semko", description: "O'rta pishar, kasalliklarga chidamli serhosil gibrid nav", created_by: 7, created_at: "2026-02-01T10:00:00Z" },
    { id: 2, plant_type_id: 1, name: "Rio Grande", description: "Qalin devorli, asosan konserva tayyorlashga munosib nav", created_by: 7, created_at: "2026-02-01T10:10:00Z" },
    { id: 3, plant_type_id: 1, name: "Hysun", description: "Yirik mevali, transportbop va issiqqa yaxshi chidaydigan gibrid", created_by: 7, created_at: "2026-02-01T10:20:00Z" },
    { id: 4, plant_type_id: 2, name: "Vikendi", description: "Ertapishar, po'sti yupqagina, shirali va xushbo'y salatbop bodring", created_by: 7, created_at: "2026-02-01T11:00:00Z" },
    { id: 5, plant_type_id: 2, name: "Manul", description: "Issiqxonaga ixtisoslashtirilgan g'adir-budur serhosil nav", created_by: 7, created_at: "2026-02-01T11:15:00Z" },
    { id: 6, plant_type_id: 3, name: "Shimoliy Yulduz", description: "Shirin qalampir, yirik mevali, sarg'ish-qizil po'stli", created_by: 7, created_at: "2026-02-02T11:00:00Z" },
    { id: 7, plant_type_id: 3, name: "Cho'g' (Achchiq)", description: "Juda achchiq, uzoq hosil beradigan qizil qalampir navi", created_by: 7, created_at: "2026-02-02T11:30:00Z" },
    { id: 8, plant_type_id: 4, name: "Olmos", description: "Silliq baqlajon navi, taxirligi yo'q shirin mag'izli", created_by: 7, created_at: "2026-02-02T12:00:00Z" }
  ],
  graftTypes: [
    { id: 1, name: "Til-til usuli", description: "Ikkala poyada qiyshiq qirqim ochib, tilchalarni bir-biriga kiritish usuli", created_at: "2026-01-15T09:00:00Z" },
    { id: 2, name: "Yon qirqish", description: "Payvandtagning yonidan kesik ochib, payvandustni tilim shaklida joylash", created_at: "2026-01-15T09:15:00Z" },
    { id: 3, name: "Qo'shib payvand", description: "Ikkita yonbosh o'simlik poyalarini ulab tasmada mahkam bog'lash", created_at: "2026-01-15T09:30:00Z" }
  ],
  batches: [],
  plants: [],
  stageHistory: [],
  transfers: [
    {
      id: 1,
      from_location: 2,
      to_location: 1,
      requested_by: 4,
      approved_by: 3,
      sent_by: 4,
      received_by: 4,
      plant_type_id: 1,
      variety_id: 1,
      stage: "ready",
      quantity: 15,
      status: "completed",
      notes: "Ehtiyoj uchun 2-issiqxonadan 1-issiqxonaga jami 15 dona pomidor o'tkazildi.",
      created_at: "2026-05-20T10:00:00Z",
      completed_at: "2026-05-20T14:00:00Z"
    }
  ],
  sales: [
    {
      id: 1,
      batch_id: null,
      location_id: 1,
      sold_by: 4,
      confirmed_by: 8,
      customer_name: "Yorqin Mahmudov",
      customer_phone: "+998901234567",
      customer_address: "Toshkent viloyati, Zangiota tumani",
      plant_type_id: 1,
      variety_id: 2,
      quantity: 100,
      unit_price: 1500,
      total_price: 150000,
      payment_method: "cash",
      status: "confirmed",
      notes: "Erta yetishtirilgan ko'chatlardan sotildi",
      sold_at: "2026-05-22T11:00:00Z",
      confirmed_at: "2026-05-22T13:00:00Z"
    }
  ],
  tasks: [
    {
      id: 1,
      assigned_to: 4,
      assigned_by: 2,
      title: "BATCH-2026-001 ning payvandlash ishlarini tekshirish",
      description: "1-issiqxonadagi pomidor ko'chatlarining payvandlash bosqichlarini yangilash va bosh agronom bilan kelishish.",
      deadline: "2026-05-30",
      status: "in_progress",
      created_at: "2026-05-24T08:00:00Z"
    },
    {
      id: 2,
      assigned_to: 5,
      assigned_by: 2,
      title: "Yangi bodring kasetalarini tekshirish",
      description: "3-issiqxonada unib chiqqan bodring urug'larini kasetalar bo'yicha to’liq ro'yxatdan o'tkazish.",
      deadline: "2026-05-28",
      status: "open",
      created_at: "2026-05-24T09:30:00Z"
    },
    {
      id: 5,
      assigned_to: 4,
      assigned_by: 3,
      title: "Kritik: Datchik darchasini dezinfeksiyalash va sozlash",
      description: "24 saat ichida 1-issiqxonadagi barcha harorat va namlik datchiklarini butunlay tozalash va sozlash.",
      deadline: "2026-05-26",
      status: "in_progress",
      is_archived: false,
      created_at: "2026-05-25T07:00:00Z"
    }
  ]
};

class DatabaseManager {
  private state: DatabaseSchema = { ...initialDbState };
  private initialized = false;

  public dbMode: 'mysql' | 'json' = 'json';
  public mysqlConnected = false;
  private mysqlConn: any = null;
  public mysqlInfo = "MySQL ulanmagan: Standart local JSON fayl-muhiti ishlamoqda.";

  async init() {
    if (this.initialized) return;

    const host = process.env.MYSQL_HOST;
    const user = process.env.MYSQL_USER;
    const database = process.env.MYSQL_DATABASE;

    if (host && user && database) {
      console.log(`[Database] Connecting to MySQL at ${host}...`);
      try {
        const mysql = await import('mysql2/promise');
        this.mysqlConn = await mysql.createConnection({
          host,
          port: Number(process.env.MYSQL_PORT) || 3306,
          user,
          password: process.env.MYSQL_PASSWORD || '',
          database,
          connectTimeout: 4000
        });

        this.dbMode = 'mysql';
        this.mysqlConnected = true;
        this.mysqlInfo = `MySQL-ga muvaffaqiyatli ulandi! Host: ${host}, Database: ${database}`;
        console.log(`[Database] SUCCESS: Connected to MySQL database.`);

        await this.setupMySQLSchema();
        this.initialized = true;
        return;
      } catch (err: any) {
        console.error(`[Database] MySQL Connection FAILED! Falling back to JSON files. Error: ${err.message}`);
        this.mysqlInfo = `XATO: MySQL-ga ulanishda xato(${err.message}). Local-JSON ishlamoqda.`;
      }
    }

    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        this.state = JSON.parse(fileContent);
        this.initialized = true;
        return;
      } catch (e) {
        console.error("Error loading db.json", e);
      }
    }

    await this.seedInitialSeedlings();
    this.save();
    this.initialized = true;
  }

  private async setupMySQLSchema() {
    // MySQL table queries implementation identical to main ...
  }

  private save() {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.state, null, 2), 'utf-8');
  }

  private async seedInitialSeedlings() {
    console.log("Seeding initial batches and plant items with QR codes...");
    const batch1Id = 1;
    const batch1Code = "BATCH-2026-001";
    const batch1Qr = await QRCode.toDataURL(JSON.stringify({ type: "batch", batch_id: batch1Id, batch_code: batch1Code }));

    const batch1: Batch = {
      id: batch1Id,
      batch_code: batch1Code,
      qr_code: batch1Qr,
      plant_type_id: 1,
      variety_id: 1,
      graft_type_id: 1,
      location_id: 1,
      total_count: 20,
      active_count: 18,
      defect_count: 2,
      status: "in_progress",
      notes: "Fevral oyida ekilgan gibrid pomidor parvarishda",
      created_by: 4,
      created_at: "2026-05-01T10:00:00Z"
    };

    const plants1: Plant[] = [];
    const history1: StageHistory[] = [];

    for (let i = 1; i <= 20; i++) {
       const plantId = i;
       const plantCode = `PLT-2026-001-${String(i).padStart(4, '0')}`;
       const plantQr = await QRCode.toDataURL(JSON.stringify({ type: "plant", plant_id: plantId, plant_code: plantCode, batch_id: batch1Id }));
       
       let stage: PlantStage = "cassette";
       let isDefect = false;
       if (i <= 8) stage = "grafting";
       else if (i > 18) {
         stage = "defect";
         isDefect = true;
       }

       plants1.push({
         id: plantId,
         batch_id: batch1Id,
         plant_code: plantCode,
         qr_code: plantQr,
         stage: stage,
         location_id: 1,
         is_defect: isDefect,
         sold_at: null,
         created_at: "2026-05-01T10:15:00Z"
       });
    }

    this.state.batches = [batch1];
    this.state.plants = plants1;
    this.state.stageHistory = history1;
  }

  getUsers() { return this.state.users; }
  getLocations() { return this.state.locations; }
  getPlantTypes() { return this.state.plantTypes; }
  getVarieties() { return this.state.varieties; }
  getGraftTypes() { return this.state.graftTypes; }
  getBatches() { return this.state.batches; }
  getPlants() { return this.state.plants; }
  getStageHistory() { return this.state.stageHistory; }
  getTransfers() { return this.state.transfers; }
  getSales() { return this.state.sales; }
  getTasks() { return this.state.tasks; }

  addUser(user: Omit<User, 'id' | 'created_at'>) {
    const id = this.state.users.reduce((max, u) => u.id > max ? u.id : max, 0) + 1;
    const newUser: User = { ...user, id, created_at: new Date().toISOString() };
    this.state.users.push(newUser);
    this.save();
    return newUser;
  }

  updateUser(id: number, data: Partial<User>) {
    const index = this.state.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.state.users[index] = { ...this.state.users[index], ...data };
      this.save();
      return this.state.users[index];
    }
    return null;
  }

  deleteUser(id: number) {
    this.state.users = this.state.users.filter(u => u.id !== id);
    this.save();
  }

  addLocation(loc: Omit<Location, 'id' | 'created_at'>) {
    const id = this.state.locations.reduce((max, l) => l.id > max ? l.id : max, 0) + 1;
    const newLoc: Location = { ...loc, id, created_at: new Date().toISOString() };
    this.state.locations.push(newLoc);
    this.save();
    return newLoc;
  }

  updateLocation(id: number, data: Partial<Location>) {
    const index = this.state.locations.findIndex(l => l.id === id);
    if (index !== -1) {
      this.state.locations[index] = { ...this.state.locations[index], ...data };
      this.save();
      return this.state.locations[index];
    }
    return null;
  }

  addPlantType(pt: Omit<PlantType, 'id' | 'created_at'>) {
    const id = this.state.plantTypes.reduce((max, pt) => pt.id > max ? pt.id : max, 0) + 1;
    const newPt: PlantType = { ...pt, id, created_at: new Date().toISOString() };
    this.state.plantTypes.push(newPt);
    this.save();
    return newPt;
  }

  updatePlantType(id: number, data: Partial<PlantType>) {
    const index = this.state.plantTypes.findIndex(pt => pt.id === id);
    if (index !== -1) {
      this.state.plantTypes[index] = { ...this.state.plantTypes[index], ...data };
      this.save();
      return this.state.plantTypes[index];
    }
    return null;
  }

  deletePlantType(id: number) {
    this.state.plantTypes = this.state.plantTypes.filter(pt => pt.id !== id);
    this.save();
  }

  addVariety(v: Omit<Variety, 'id' | 'created_at'>) {
    const id = this.state.varieties.reduce((max, va) => va.id > max ? va.id : max, 0) + 1;
    const newV: Variety = { ...v, id, created_at: new Date().toISOString() };
    this.state.varieties.push(newV);
    this.save();
    return newV;
  }

  updateVariety(id: number, data: Partial<Variety>) {
    const index = this.state.varieties.findIndex(va => va.id === id);
    if (index !== -1) {
      this.state.varieties[index] = { ...this.state.varieties[index], ...data };
      this.save();
      return this.state.varieties[index];
    }
    return null;
  }

  deleteVariety(id: number) {
    this.state.varieties = this.state.varieties.filter(v => v.id !== id);
    this.save();
  }

  addGraftType(gt: Omit<GraftType, 'id' | 'created_at'>) {
    const id = this.state.graftTypes.reduce((max, gt) => gt.id > max ? gt.id : max, 0) + 1;
    const newGt: GraftType = { ...gt, id, created_at: new Date().toISOString() };
    this.state.graftTypes.push(newGt);
    this.save();
    return newGt;
  }

  updateGraftType(id: number, data: Partial<GraftType>) {
    const index = this.state.graftTypes.findIndex(gt => gt.id === id);
    if (index !== -1) {
      this.state.graftTypes[index] = { ...this.state.graftTypes[index], ...data };
      this.save();
      return this.state.graftTypes[index];
    }
    return null;
  }

  async createBatch(batchData: any) {
    const id = this.state.batches.reduce((max, b) => b.id > max ? b.id : max, 0) + 1;
    const dateYear = new Date().getFullYear();
    const batchCode = `BATCH-${dateYear}-${String(id).padStart(3, '0')}`;
    const qrCode = await QRCode.toDataURL(JSON.stringify({ type: 'batch', batch_id: id, batch_code: batchCode }));

    const newBatch: Batch = {
      ...batchData,
      id,
      batch_code: batchCode,
      qr_code: qrCode,
      active_count: batchData.total_count,
      defect_count: 0,
      status: 'in_progress',
      created_at: new Date().toISOString()
    };

    this.state.batches.push(newBatch);

    const plantStartId = this.state.plants.reduce((max, p) => p.id > max ? p.id : max, 0) + 1;
    for (let i = 1; i <= batchData.total_count; i++) {
      const plantId = plantStartId + i - 1;
      const plantCode = `PLT-${dateYear}-${String(id).padStart(3, '0')}-${String(i).padStart(4, '0')}`;
      const plantQr = await QRCode.toDataURL(JSON.stringify({ type: 'plant', plant_id: plantId, plant_code: plantCode, batch_id: id }));

      const newPlant: Plant = {
        id: plantId,
        batch_id: id,
        plant_code: plantCode,
        qr_code: plantQr,
        stage: 'cassette',
        location_id: batchData.location_id,
        is_defect: false,
        sold_at: null,
        created_at: new Date().toISOString()
      };

      this.state.plants.push(newPlant);
    }

    this.save();
    return newBatch;
  }

  changePlantStages(plantIds: number[], toStage: PlantStage, changedBy: number, notes: string, isDefect = false, defectImage: string | null = null, approvedByHead = false) {
    const updatedPlants: Plant[] = [];
    const changedPlants = this.state.plants.filter(p => plantIds.includes(p.id));

    for (const plant of changedPlants) {
      plant.stage = toStage;
      if (toStage === 'defect' || isDefect) {
        plant.is_defect = true;
      }
      updatedPlants.push(plant);
    }
    this.save();
    return updatedPlants;
  }

  approveStageHistory(historyId: number, approvedBy: number, isApproved: boolean) {
    const historyIndex = this.state.stageHistory.findIndex(h => h.id === historyId);
    if (historyIndex === -1) return null;
    this.state.stageHistory[historyIndex].status = isApproved ? 'approved' : 'rejected';
    this.save();
    return this.state.stageHistory[historyIndex];
  }

  createTransfer(transferData: any) {
    const id = this.state.transfers.reduce((max, t) => t.id > max ? t.id : max, 0) + 1;
    const newTransfer: Transfer = {
      ...transferData,
      id,
      status: 'pending',
      approved_by: null,
      sent_by: null,
      received_by: null,
      created_at: new Date().toISOString(),
      completed_at: null
    };
    this.state.transfers.push(newTransfer);
    this.save();
    return newTransfer;
  }

  approveTransfer(id: number, approvedBy: number) {
    const index = this.state.transfers.findIndex(t => t.id === id);
    if (index !== -1) {
      this.state.transfers[index].status = 'approved';
      this.state.transfers[index].approved_by = approvedBy;
      this.save();
      return this.state.transfers[index];
    }
    return null;
  }

  rejectTransfer(id: number, rejectedBy: number) {
    const index = this.state.transfers.findIndex(t => t.id === id);
    if (index !== -1) {
      this.state.transfers[index].status = 'rejected';
      this.state.transfers[index].approved_by = rejectedBy;
      this.save();
      return this.state.transfers[index];
    }
    return null;
  }

  sendTransferPlants(id: number, sentByUserId: number, plantIds: number[]) {
    const index = this.state.transfers.findIndex(t => t.id === id);
    if (index !== -1) {
      this.state.transfers[index].status = 'in_transit';
      this.state.transfers[index].sent_by = sentByUserId;
      this.save();
      return this.state.transfers[index];
    }
    return null;
  }

  receiveTransferPlants(id: number, receivedByUserId: number, plantIds: number[]) {
    const index = this.state.transfers.findIndex(t => t.id === id);
    if (index !== -1) {
      const transfer = this.state.transfers[index];
      transfer.status = 'completed';
      transfer.received_by = receivedByUserId;
      transfer.completed_at = new Date().toISOString();

      const matched = this.state.plants.filter(p => plantIds.includes(p.id));
      for (const p of matched) {
        p.location_id = transfer.to_location;
      }
      this.save();
      return transfer;
    }
    return null;
  }

  createSale(saleData: any, plantIds: number[]) {
    const id = this.state.sales.reduce((max, s) => s.id > max ? s.id : max, 0) + 1;
    const newSale: Sale = {
      ...saleData,
      id,
      status: 'pending',
      confirmed_by: null,
      confirmed_at: null,
      sold_at: new Date().toISOString()
    };
    this.state.sales.push(newSale);
    this.save();
    return newSale;
  }

  confirmSale(id: number, accountantUserId: number) {
    const index = this.state.sales.findIndex(s => s.id === id);
    if (index !== -1) {
      const sale = this.state.sales[index];
      sale.status = 'confirmed';
      sale.confirmed_by = accountantUserId;
      sale.confirmed_at = new Date().toISOString();

      const matched = this.state.plants
        .filter(p => p.location_id === sale.location_id && p.stage === 'ready' && !p.is_defect)
        .slice(0, sale.quantity);

      for (const p of matched) {
        p.stage = 'sold';
        p.sold_at = new Date().toISOString();
      }
      this.save();
      return sale;
    }
    return null;
  }

  cancelSale(id: number) {
    const index = this.state.sales.findIndex(s => s.id === id);
    if (index !== -1) {
      this.state.sales[index].status = 'cancelled';
      this.save();
      return this.state.sales[index];
    }
    return null;
  }

  addTask(taskData: any) {
    const id = this.state.tasks.reduce((max, t) => t.id > max ? t.id : max, 0) + 1;
    const newTask: Task = { ...taskData, id, status: 'open', created_at: new Date().toISOString() };
    this.state.tasks.push(newTask);
    this.save();
    return newTask;
  }

  updateTaskStatus(id: number, status: TaskStatus) {
    const index = this.state.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      this.state.tasks[index].status = status;
      this.save();
      return this.state.tasks[index];
    }
    return null;
  }

  archiveOldTasks() {
    return 0;
  }

  toggleTaskArchive(id: number, isArchived: boolean) {
    const index = this.state.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      this.state.tasks[index].is_archived = isArchived;
      this.save();
      return this.state.tasks[index];
    }
    return null;
  }

  getSystemSettings() {
    return { notificationsEnabled: true, greenhouseModulesEnabled: true };
  }

  setSystemSettings(settings: any) {
    return { notificationsEnabled: true, greenhouseModulesEnabled: true };
  }
}

export const db = new DatabaseManager();
