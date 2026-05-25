/**
 * Shared Type Definitions for Greenhouse Seedling Management System
 */

export type UserRole = 'director' | 'admin' | 'head_agronomist' | 'agronomist' | 'laborant' | 'accountant';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  location_id: number | null; // Null means all/none or central
  is_active: boolean;
  created_at: string;
}

export type LocationType = 'greenhouse' | 'open_field';

export interface Location {
  id: number;
  name: string;
  type: LocationType;
  capacity: number;
  is_active: boolean;
  created_at: string;
}

export interface PlantType {
  id: number;
  name: string;
  description: string;
  created_by: number;
  created_at: string;
}

export interface Variety {
  id: number;
  plant_type_id: number;
  name: string;
  description: string;
  created_by: number;
  created_at: string;
}

export interface GraftType {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export type BatchStatus = 'in_progress' | 'ready' | 'sold' | 'archived';

export interface Batch {
  id: number;
  batch_code: string;
  qr_code: string; // Base64 or URL
  plant_type_id: number;
  variety_id: number;
  graft_type_id: number | null;
  location_id: number;
  total_count: number;
  active_count: number;
  defect_count: number;
  status: BatchStatus;
  notes: string;
  created_by: number;
  created_at: string;
}

export type PlantStage = 'cassette' | 'grafting' | 'seedling' | 'ready' | 'sold' | 'defect';

export interface Plant {
  id: number;
  batch_id: number;
  plant_code: string;
  qr_code: string; // Base64 or SVG data URL
  stage: PlantStage;
  location_id: number;
  is_defect: boolean;
  sold_at: string | null;
  created_at: string;
}

export interface StageHistory {
  id: number;
  plant_id: number | null; // Can be null if it was batch-level log
  batch_id: number;
  from_stage: string | null;
  to_stage: string;
  changed_by: number;
  approved_by: number | null;
  notes: string;
  defect_image: string | null;
  is_defect: boolean;
  status: 'pending' | 'approved' | 'rejected'; // For Agronomist changes approval
  changed_at: string;
}

export type TransferStatus = 'pending' | 'approved' | 'in_transit' | 'completed' | 'rejected';

export interface Transfer {
  id: number;
  from_location: number;
  to_location: number;
  requested_by: number;
  approved_by: number | null;
  sent_by: number | null;
  received_by: number | null;
  plant_type_id: number;
  variety_id: number;
  stage: PlantStage;
  quantity: number;
  status: TransferStatus;
  notes: string;
  created_at: string;
  completed_at: string | null;
}

export interface TransferPlant {
  id: number;
  transfer_id: number;
  plant_id: number;
}

export type SaleStatus = 'pending' | 'confirmed' | 'cancelled';
export type PaymentMethod = 'cash' | 'transfer' | 'credit';

export interface Sale {
  id: number;
  batch_id: number | null;
  location_id: number;
  sold_by: number;
  confirmed_by: number | null;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  plant_type_id: number;
  variety_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  payment_method: PaymentMethod;
  status: SaleStatus;
  notes: string;
  sold_at: string;
  confirmed_at: string | null;
}

export interface SalePlant {
  id: number;
  sale_id: number;
  plant_id: number;
}

export type TaskStatus = 'open' | 'in_progress' | 'done' | 'overdue';

export interface Task {
  id: number;
  assigned_to: number;
  assigned_by: number;
  title: string;
  description: string;
  deadline: string;
  status: TaskStatus;
  is_archived?: boolean;
  created_at: string;
}
