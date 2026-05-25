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
} from '../types';

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

// Base/seeded database
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
    }
  ]
};

// Singleton DB Class
class DatabaseManager {
  private state: DatabaseSchema = { ...initialDbState };
  private initialized = false;

  async init() {
    if (this.initialized) return;

    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        this.state = JSON.parse(fileContent);
        // Make sure fields match format
        if (!this.state.batches) this.state.batches = [];
        if (!this.state.plants) this.state.plants = [];
        this.initialized = true;
        console.log(`Database loaded successfully from ${DB_FILE_PATH}.`);
        return;
      } catch (e) {
        console.error("Error loading db.json, generating a new one instead", e);
      }
    }

    // Generate seeded batches & plants
    await this.seedInitialSeedlings();
    this.save();
    this.initialized = true;
  }

  private save() {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.state, null, 2), 'utf-8');
  }

  private async seedInitialSeedlings() {
    console.log("Seeding initial batches and plant items with QR codes...");
    
    // Seed BATCH-2026-001 (Pomidor - F1 Semko - Til-til [1] - Greenhouse 1)
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
      location_id: 1, // Greenhouse 1
      total_count: 20,
      active_count: 18,
      defect_count: 2,
      status: "in_progress",
      notes: "Fevral oyida ekilgan gibrid pomidor parvarishda",
      created_by: 4, // Rustam
      created_at: "2026-05-01T10:00:00Z"
    };

    // Plants for BATCH-001
    const plants1: Plant[] = [];
    const history1: StageHistory[] = [];

    for (let i = 1; i <= 20; i++) {
      const plantId = i;
      const plantCode = `PLT-2026-001-${String(i).padStart(4, '0')}`;
      const plantQr = await QRCode.toDataURL(JSON.stringify({ type: "plant", plant_id: plantId, plant_code: plantCode, batch_id: batch1Id }));
      
      // First 8 grafting, next 10 cassette, last 2 defect
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

      // Seeding histories
      history1.push({
        id: history1.length + 1,
        plant_id: plantId,
        batch_id: batch1Id,
        from_stage: null,
        to_stage: "cassette",
        changed_by: 4,
        approved_by: 3,
        notes: "Urug' ekildi, kasetaga qo'yildi",
        defect_image: null,
        is_defect: false,
        status: "approved",
        changed_at: "2026-05-01T10:20:00Z"
      });

      if (stage === "grafting") {
        history1.push({
          id: history1.length + 1,
          plant_id: plantId,
          batch_id: batch1Id,
          from_stage: "cassette",
          to_stage: "grafting",
          changed_by: 4,
          approved_by: 3,
          notes: "Payvandlash o'tkazildi (Til-til usulida)",
          defect_image: null,
          is_defect: false,
          status: "approved",
          changed_at: "2026-05-15T11:00:00Z"
        });
      }

      if (isDefect) {
        history1.push({
          id: history1.length + 1,
          plant_id: plantId,
          batch_id: batch1Id,
          from_stage: "cassette",
          to_stage: "defect",
          changed_by: 4,
          approved_by: 3,
          notes: "Ildizi burishgan va qurigan nuqsonlar sezildi",
          defect_image: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?q=80&w=400",
          is_defect: true,
          status: "approved",
          changed_at: "2026-05-18T15:30:00Z"
        });
      }
    }

    // Seed BATCH-2026-002 (Bodring - Vikendi [4] - Graft: null - Greenhouse 3)
    const batch2Id = 2;
    const batch2Code = "BATCH-2026-002";
    const batch2Qr = await QRCode.toDataURL(JSON.stringify({ type: "batch", batch_id: batch2Id, batch_code: batch2Code }));

    const batch2: Batch = {
      id: batch2Id,
      batch_code: batch2Code,
      qr_code: batch2Qr,
      plant_type_id: 2,
      variety_id: 4,
      graft_type_id: null,
      location_id: 3, // Greenhouse 3
      total_count: 15,
      active_count: 15,
      defect_count: 0,
      status: "ready",
      notes: "Sotishga shay bo'lgan yuqori hosilli bodring ko'chatlari",
      created_by: 5, // Dilshod
      created_at: "2026-05-05T09:00:00Z"
    };

    const plants2: Plant[] = [];
    for (let i = 1; i <= 15; i++) {
      const plantId = 20 + i; // Offset IDs
      const plantCode = `PLT-2026-002-${String(i).padStart(4, '0')}`;
      const plantQr = await QRCode.toDataURL(JSON.stringify({ type: "plant", plant_id: plantId, plant_code: plantCode, batch_id: batch2Id }));

      plants2.push({
        id: plantId,
        batch_id: batch2Id,
        plant_code: plantCode,
        qr_code: plantQr,
        stage: "ready", // All are ready!
        location_id: 3,
        is_defect: false,
        sold_at: null,
        created_at: "2026-05-05T09:15:00Z"
      });

      history1.push({
        id: history1.length + 1,
        plant_id: plantId,
        batch_id: batch2Id,
        from_stage: null,
        to_stage: "cassette",
        changed_by: 5,
        approved_by: 3,
        notes: "Urug'lik yerga qadaldi",
        defect_image: null,
        is_defect: false,
        status: "approved",
        changed_at: "2026-05-05T09:30:00Z"
      });

      history1.push({
        id: history1.length + 1,
        plant_id: plantId,
        batch_id: batch2Id,
        from_stage: "cassette",
        to_stage: "seedling",
        changed_by: 5,
        approved_by: 3,
        notes: "Urug'lar muvaffaqiyatli unib chiqqan",
        defect_image: null,
        is_defect: false,
        status: "approved",
        changed_at: "2026-05-12T08:00:00Z"
      });

      history1.push({
        id: history1.length + 1,
        plant_id: plantId,
        batch_id: batch2Id,
        from_stage: "seedling",
        to_stage: "ready",
        changed_by: 5,
        approved_by: 3,
        notes: "O'stirildi, ildiz mustahkamlangan, sotuvga ruxsat",
        defect_image: null,
        is_defect: false,
        status: "approved",
        changed_at: "2026-05-22T10:00:00Z"
      });
    }

    this.state.batches = [batch1, batch2];
    this.state.plants = [...plants1, ...plants2];
    this.state.stageHistory = history1;
    console.log("Seeding complete. Saved to dbSchema memory.");
  }

  // Auth Operations
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

  // User Actions
  addUser(user: Omit<User, 'id' | 'created_at'>) {
    const id = this.state.users.reduce((max, u) => u.id > max ? u.id : max, 0) + 1;
    const newUser: User = {
      ...user,
      id,
      created_at: new Date().toISOString()
    };
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

  // Location Actions
  addLocation(loc: Omit<Location, 'id' | 'created_at'>) {
    const id = this.state.locations.reduce((max, l) => l.id > max ? l.id : max, 0) + 1;
    const newLoc: Location = {
      ...loc,
      id,
      created_at: new Date().toISOString()
    };
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

  // Catalog Actions (PlantTypes)
  addPlantType(pt: Omit<PlantType, 'id' | 'created_at'>) {
    const id = this.state.plantTypes.reduce((max, pt) => pt.id > max ? pt.id : max, 0) + 1;
    const newPt: PlantType = {
      ...pt,
      id,
      created_at: new Date().toISOString()
    };
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
    // Check if being used before delete, or filter out
    this.state.plantTypes = this.state.plantTypes.filter(pt => pt.id !== id);
    this.save();
  }

  // Variety Actions
  addVariety(v: Omit<Variety, 'id' | 'created_at'>) {
    const id = this.state.varieties.reduce((max, va) => va.id > max ? va.id : max, 0) + 1;
    const newV: Variety = {
      ...v,
      id,
      created_at: new Date().toISOString()
    };
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

  // GraftType Actions
  addGraftType(gt: Omit<GraftType, 'id' | 'created_at'>) {
    const id = this.state.graftTypes.reduce((max, gt) => gt.id > max ? gt.id : max, 0) + 1;
    const newGt: GraftType = {
      ...gt,
      id,
      created_at: new Date().toISOString()
    };
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

  // Create Batch & Automatically Generate Plant Items + QR Codes
  async createBatch(batchData: Omit<Batch, 'id' | 'batch_code' | 'qr_code' | 'defect_count' | 'active_count' | 'status' | 'created_at'>) {
    const id = this.state.batches.reduce((max, b) => b.id > max ? b.id : max, 0) + 1;
    const dateYear = new Date().getFullYear();
    const batchCode = `BATCH-${dateYear}-${String(id).padStart(3, '0')}`;
    
    // Server QR generation for batch
    const qrCode = await QRCode.toDataURL(JSON.stringify({
      type: 'batch',
      batch_id: id,
      batch_code: batchCode
    }));

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

    // Auto-create individual seedlings (Plant items)
    const plantStartId = this.state.plants.reduce((max, p) => p.id > max ? p.id : max, 0) + 1;
    for (let i = 1; i <= batchData.total_count; i++) {
      const plantId = plantStartId + i - 1;
      const plantCode = `PLT-${dateYear}-${String(id).padStart(3, '0')}-${String(i).padStart(4, '0')}`;
      
      const plantQr = await QRCode.toDataURL(JSON.stringify({
        type: 'plant',
        plant_id: plantId,
        plant_code: plantCode,
        batch_id: id
      }));

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

      // Create Stage History seeding entry
      this.state.stageHistory.push({
        id: this.state.stageHistory.reduce((max, h) => h.id > max ? h.id : max, 0) + 1,
        plant_id: plantId,
        batch_id: id,
        from_stage: null,
        to_stage: 'cassette',
        changed_by: batchData.created_by,
        approved_by: null, // Pending Head Agronomist
        notes: 'Urug ekildi va ruxsat oqibatida partiya boshlandi',
        defect_image: null,
        is_defect: false,
        status: 'pending',
        changed_at: new Date().toISOString()
      });
    }

    this.save();
    return newBatch;
  }

  // Batch Updates (like changing notes or archiving)
  updateBatch(id: number, data: Partial<Batch>) {
    const index = this.state.batches.findIndex(b => b.id === id);
    if (index !== -1) {
      this.state.batches[index] = { ...this.state.batches[index], ...data };
      this.save();
      return this.state.batches[index];
    }
    return null;
  }

  // Update Individual/Multiple Plants' Growth Stage with Verification Chain (approval request)
  changePlantStages(
    plantIds: number[],
    toStage: PlantStage,
    changedBy: number,
    notes: string,
    isDefect = false,
    defectImage: string | null = null,
    approvedByHead = false // If performed by Bosh Agronom or auto-approved
  ) {
    if (plantIds.length === 0) return [];

    const updatedPlants: Plant[] = [];
    const changedPlants = this.state.plants.filter(p => plantIds.includes(p.id));

    // Agranom kiritganda, status is 'pending'. Bosh agranom kiritganda approved.
    const approvalStatus = approvedByHead ? 'approved' : 'pending';
    const approvedByUserId = approvedByHead ? changedBy : null;

    for (const plant of changedPlants) {
      const fromStage = plant.stage;

      // Create historic action log
      const historyId = this.state.stageHistory.reduce((max, h) => h.id > max ? h.id : max, 0) + 1;
      const historyEntry: StageHistory = {
        id: historyId,
        plant_id: plant.id,
        batch_id: plant.batch_id,
        from_stage: fromStage,
        to_stage: toStage,
        changed_by: changedBy,
        approved_by: approvedByUserId,
        notes,
        defect_image: defectImage,
        is_defect: isDefect,
        status: approvalStatus,
        changed_at: new Date().toISOString()
      };
      this.state.stageHistory.push(historyEntry);

      // If approved or auto-approved, deploy changes direct to Plant
      if (approvalStatus === 'approved') {
        plant.stage = toStage;
        if (toStage === 'defect') {
          plant.is_defect = true;
        } else if (isDefect) {
          plant.is_defect = true;
          plant.stage = 'defect';
        } else {
          plant.is_defect = false;
        }
        updatedPlants.push(plant);
      } else {
        // Pending state keeps plant stage intact but log is registered for Head Agronomist approval
        updatedPlants.push(plant);
      }
    }

    // Refresh batch Active/Defect calculations
    this.refreshBatchCounts();
    this.save();
    return updatedPlants;
  }

  // Bosh Agronom approves/rejects a pending Stage History update
  approveStageHistory(historyId: number, approvedBy: number, isApproved: boolean) {
    const historyIndex = this.state.stageHistory.findIndex(h => h.id === historyId);
    if (historyIndex === -1) return null;

    const history = this.state.stageHistory[historyIndex];
    history.status = isApproved ? 'approved' : 'rejected';
    history.approved_by = approvedBy;

    // Apply plant model change if approved
    if (isApproved && history.plant_id) {
      const plantIndex = this.state.plants.findIndex(p => p.id === history.plant_id);
      if (plantIndex !== -1) {
        const plant = this.state.plants[plantIndex];
        plant.stage = history.to_stage as PlantStage;
        if (history.to_stage === 'defect') {
          plant.is_defect = true;
        } else if (history.is_defect) {
          plant.is_defect = true;
          plant.stage = 'defect';
        } else {
          plant.is_defect = false;
        }
      }
    }

    this.refreshBatchCounts();
    this.save();
    return history;
  }

  // Recalculates total defect and active seedling counts across all batches
  private refreshBatchCounts() {
    for (const batch of this.state.batches) {
      const batchPlants = this.state.plants.filter(p => p.batch_id === batch.id);
      const defectCount = batchPlants.filter(p => p.stage === 'defect' || p.is_defect).length;
      const soldCount = batchPlants.filter(p => p.stage === 'sold').length;
      
      batch.defect_count = defectCount;
      batch.active_count = batch.total_count - defectCount - soldCount;

      // Auto ready status if a significant portion is ready
      const readyCount = batchPlants.filter(p => p.stage === 'ready').length;
      if (soldCount > 0 && readyCount === 0 && batch.active_count === 0) {
        batch.status = 'sold';
      } else if (readyCount > 0 && readyCount >= batch.active_count) {
        batch.status = 'ready';
      } else {
        batch.status = 'in_progress';
      }
    }
  }

  // Transfer Actions
  createTransfer(transferData: Omit<Transfer, 'id' | 'status' | 'created_at' | 'completed_at' | 'approved_by' | 'sent_by' | 'received_by'>) {
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
      this.state.transfers[index].approved_by = rejectedBy; // Saves who rejected it
      this.save();
      return this.state.transfers[index];
    }
    return null;
  }

  // Step 4 of transfer: Dispatching plants (Sent / In Transit)
  sendTransferPlants(id: number, sentByUserId: number, plantIds: number[]) {
    const transIndex = this.state.transfers.findIndex(t => t.id === id);
    if (transIndex === -1) return null;

    const transfer = this.state.transfers[transIndex];
    transfer.status = 'in_transit';
    transfer.sent_by = sentByUserId;

    // Attach plants with link table transfer_plants
    for (const pid of plantIds) {
      const linkId = this.state.transfers.reduce((max, t) => t.id > max ? t.id : max, 0) + 1; // Fake increment
      // Ensure plant exists and put in transit (we can just register in database)
    }

    this.save();
    return transfer;
  }

  // Step 5 of transfer: Receive plants & update plants location IDs!
  receiveTransferPlants(id: number, receivedByUserId: number, plantIds: number[]) {
    const transIndex = this.state.transfers.findIndex(t => t.id === id);
    if (transIndex === -1) return null;

    const transfer = this.state.transfers[transIndex];
    transfer.status = 'completed';
    transfer.received_by = receivedByUserId;
    transfer.completed_at = new Date().toISOString();

    // Re-locate all matching plants to destination location
    const matchedPlants = this.state.plants.filter(p => plantIds.includes(p.id));
    for (const plant of matchedPlants) {
      plant.location_id = transfer.to_location;
    }

    // Check if whole batch belongs to new location or if we partially re-located.
    // We just update batches based on plants or keep it clean
    this.refreshBatchCounts();
    this.save();
    return transfer;
  }

  // Sales Actions
  createSale(saleData: Omit<Sale, 'id' | 'status' | 'sold_at' | 'confirmed_by' | 'confirmed_at'>, plantIds: number[]) {
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

    // Flag sold plants
    const targetPlants = this.state.plants.filter(p => plantIds.includes(p.id));
    for (const plant of targetPlants) {
      plant.sold_at = new Date().toISOString();
      // Stage stays 'ready' or updates to 'sold' on confirmation
    }

    this.save();
    return newSale;
  }

  confirmSale(id: number, accountantUserId: number) {
    const index = this.state.sales.findIndex(s => s.id === id);
    if (index === -1) return null;

    const sale = this.state.sales[index];
    sale.status = 'confirmed';
    sale.confirmed_by = accountantUserId;
    sale.confirmed_at = new Date().toISOString();

    // Actually update seedling status to 'sold'
    // First find plants in her specific batch & location that match sold quantity
    const matchedPlants = this.state.plants
      .filter(p => p.location_id === sale.location_id && p.stage === 'ready' && !p.is_defect)
      .slice(0, sale.quantity);

    for (const plant of matchedPlants) {
      plant.stage = 'sold';
      plant.sold_at = new Date().toISOString();
      
      // Log in stage history
      this.state.stageHistory.push({
        id: this.state.stageHistory.reduce((max, h) => h.id > max ? h.id : max, 0) + 1,
        plant_id: plant.id,
        batch_id: plant.batch_id,
        from_stage: 'ready',
        to_stage: 'sold',
        changed_by: sale.sold_by,
        approved_by: accountantUserId,
        notes: `Sotildi: ${sale.customer_name} gacha`,
        defect_image: null,
        is_defect: false,
        status: 'approved',
        changed_at: new Date().toISOString()
      });
    }

    this.refreshBatchCounts();
    this.save();
    return sale;
  }

  cancelSale(id: number) {
    const index = this.state.sales.findIndex(s => s.id === id);
    if (index === -1) return null;

    const sale = this.state.sales[index];
    sale.status = 'cancelled';
    this.save();
    return sale;
  }

  // Task Actions
  addTask(taskData: Omit<Task, 'id' | 'status' | 'created_at'>) {
    const id = this.state.tasks.reduce((max, t) => t.id > max ? t.id : max, 0) + 1;
    const newTask: Task = {
      ...taskData,
      id,
      status: 'open',
      created_at: new Date().toISOString()
    };
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
}

export const db = new DatabaseManager();
