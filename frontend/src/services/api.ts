import { 
  User, Location, PlantType, Variety, GraftType, 
  Batch, Plant, StageHistory, Transfer, Sale, Task 
} from '../types.js';

// By default in development, Vite handles proxy to http://localhost:5000/api
// For production, change this to your actual deployed backend subdomain API URL:
export const API_BASE = '/api';

export const api = {
  // DB status
  async getDbStatus(): Promise<{ mode: string; connected: boolean; info: string; config: any }> {
    const res = await fetch(`${API_BASE}/db-status`);
    return res.json();
  },

  // Auth
  async login(email: string, password: string): Promise<{ user: User; message: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login xatosi');
    }
    return res.json();
  },

  // Users
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/users`);
    return res.json();
  },

  async createUser(data: any): Promise<User> {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateUser(id: number, data: any): Promise<User> {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteUser(id: number): Promise<void> {
    await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
  },

  // Locations
  async getLocations(): Promise<Location[]> {
    const res = await fetch(`${API_BASE}/locations`);
    return res.json();
  },

  async createLocation(data: any): Promise<Location> {
    const res = await fetch(`${API_BASE}/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateLocation(id: number, data: any): Promise<Location> {
    const res = await fetch(`${API_BASE}/locations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getLocationInventory(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/locations/${id}/inventory`);
    return res.json();
  },

  // Catalog: Plant Types
  async getPlantTypes(): Promise<PlantType[]> {
    const res = await fetch(`${API_BASE}/catalog/plant-types`);
    return res.json();
  },

  async createPlantType(data: any): Promise<PlantType> {
    const res = await fetch(`${API_BASE}/catalog/plant-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updatePlantType(id: number, data: any): Promise<PlantType> {
    const res = await fetch(`${API_BASE}/catalog/plant-types/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deletePlantType(id: number): Promise<void> {
    await fetch(`${API_BASE}/catalog/plant-types/${id}`, { method: 'DELETE' });
  },

  // Catalog: Varieties
  async getVarieties(): Promise<Variety[]> {
    const res = await fetch(`${API_BASE}/catalog/varieties`);
    return res.json();
  },

  async createVariety(data: any): Promise<Variety> {
    const res = await fetch(`${API_BASE}/catalog/varieties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateVariety(id: number, data: any): Promise<Variety> {
    const res = await fetch(`${API_BASE}/catalog/varieties/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteVariety(id: number): Promise<void> {
    await fetch(`${API_BASE}/catalog/varieties/${id}`, { method: 'DELETE' });
  },

  // Catalog: Graft Types
  async getGraftTypes(): Promise<GraftType[]> {
    const res = await fetch(`${API_BASE}/catalog/graft-types`);
    return res.json();
  },

  async createGraftType(data: any): Promise<GraftType> {
    const res = await fetch(`${API_BASE}/catalog/graft-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateGraftType(id: number, data: any): Promise<GraftType> {
    const res = await fetch(`${API_BASE}/catalog/graft-types/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Batches
  async getBatches(filters?: { location_id?: number; status?: string }): Promise<Batch[]> {
    let url = `${API_BASE}/batches`;
    const params = new URLSearchParams();
    if (filters?.location_id) params.append('location_id', String(filters.location_id));
    if (filters?.status) params.append('status', filters.status);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url);
    return res.json();
  },

  async createBatch(data: any): Promise<Batch> {
    const res = await fetch(`${API_BASE}/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getBatchById(id: number): Promise<Batch> {
    const res = await fetch(`${API_BASE}/batches/${id}`);
    return res.json();
  },

  async getBatchPlants(id: number): Promise<Plant[]> {
    const res = await fetch(`${API_BASE}/batches/${id}/plants`);
    return res.json();
  },

  // Scanning & Stages
  async scanCode(code: string): Promise<{ type: 'plant' | 'batch'; plant?: Plant; batch: Batch; plants?: Plant[] }> {
    const res = await fetch(`${API_BASE}/plants/scan/${encodeURIComponent(code)}`);
    if (!res.ok) {
      throw new Error("Skanerlashda xatolik: Bunday QR kod topilmadi.");
    }
    return res.json();
  },

  async changePlantStage(id: number, data: { toStage: string; changedBy: number; notes: string; isDefect?: boolean; defectImage?: string | null; approvedByHead?: boolean }): Promise<Plant> {
    const res = await fetch(`${API_BASE}/plants/${id}/stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async changeBatchPlantsStage(batchId: number, data: { plantIds: number[]; toStage: string; changedBy: number; notes: string; isDefect?: boolean; defectImage?: string | null; approvedByHead?: boolean }): Promise<Plant[]> {
    const res = await fetch(`${API_BASE}/batches/${batchId}/stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getPendingApprovals(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/stage-history/pending`);
    return res.json();
  },

  async approveStageHistory(id: number, data: { approvedBy: number; isApproved: boolean }): Promise<any> {
    const res = await fetch(`${API_BASE}/stage-history/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getPlantHistory(id: number): Promise<StageHistory[]> {
    const res = await fetch(`${API_BASE}/plants/${id}/history`);
    return res.json();
  },

  // Transfers
  async getTransfers(): Promise<Transfer[]> {
    const res = await fetch(`${API_BASE}/transfers`);
    return res.json();
  },

  async createTransfer(data: any): Promise<Transfer> {
    const res = await fetch(`${API_BASE}/transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      throw new Error("Transfer so'rovi yuborilmadi.");
    }
    return res.json();
  },

  async approveTransfer(id: number, approvedBy: number): Promise<Transfer> {
    const res = await fetch(`${API_BASE}/transfers/${id}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvedBy })
    });
    return res.json();
  },

  async rejectTransfer(id: number, rejectedBy: number): Promise<Transfer> {
    const res = await fetch(`${API_BASE}/transfers/${id}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejectedBy })
    });
    return res.json();
  },

  async sendTransfer(id: number, data: { sentBy: number; plantIds: number[] }): Promise<Transfer> {
    const res = await fetch(`${API_BASE}/transfers/${id}/send`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async receiveTransfer(id: number, data: { receivedBy: number; plantIds: number[] }): Promise<Transfer> {
    const res = await fetch(`${API_BASE}/transfers/${id}/receive`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Sales
  async getSales(): Promise<Sale[]> {
    const res = await fetch(`${API_BASE}/sales`);
    return res.json();
  },

  async createSale(data: { saleData: any; plantIds: number[] }): Promise<Sale> {
    const res = await fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async confirmSale(id: number, confirmedBy: number): Promise<Sale> {
    const res = await fetch(`${API_BASE}/sales/${id}/confirm`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmedBy })
    });
    return res.json();
  },

  async cancelSale(id: number): Promise<Sale> {
    const res = await fetch(`${API_BASE}/sales/${id}/cancel`, {
      method: 'PUT'
    });
    return res.json();
  },

  // Tasks
  async getTasks(userId?: number): Promise<Task[]> {
    let url = `${API_BASE}/tasks`;
    if (userId) url += `?user_id=${userId}`;
    const res = await fetch(url);
    return res.json();
  },

  async createTask(data: any): Promise<Task> {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateTaskStatus(id: number, status: string): Promise<Task> {
    const res = await fetch(`${API_BASE}/tasks/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  async cleanupTasks(): Promise<{ success: boolean; count: number }> {
    const res = await fetch(`${API_BASE}/tasks/cleanup`, {
      method: 'POST'
    });
    return res.json();
  },

  async archiveTask(id: number, isArchived: boolean): Promise<Task> {
    const res = await fetch(`${API_BASE}/tasks/${id}/archive`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isArchived })
    });
    return res.json();
  },

  // General System Settings Control
  async getSystemSettings(): Promise<{ notificationsEnabled: boolean; greenhouseModulesEnabled: boolean }> {
    const res = await fetch(`${API_BASE}/settings`);
    return res.json();
  },

  async updateSystemSettings(settings: { notificationsEnabled?: boolean; greenhouseModulesEnabled?: boolean }): Promise<{ notificationsEnabled: boolean; greenhouseModulesEnabled: boolean }> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return res.json();
  },

  // Reports
  async getDashboardReport(): Promise<{ summary: any; locationStats: any[] }> {
    const res = await fetch(`${API_BASE}/reports/dashboard`);
    return res.json();
  },

  async getDefectsReport(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/reports/defects`);
    return res.json();
  }
};
