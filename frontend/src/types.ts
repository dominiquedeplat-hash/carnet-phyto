export type Unit = 'L' | 'kg';

export type ProductCategory = 'Herbicide' | 'Fongicide' | 'Insecticide' | 'Autre';

export interface Field {
  id: string;
  name: string;
  area: number; // hectares
  crop: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  unit: Unit; // L or kg
  stock: number;
  lowStockThreshold: number;
  createdAt: string;
}

export interface TreatmentProduct {
  productId: string;
  productName: string; // snapshot
  unit: Unit; // snapshot
  dosePerHa: number; // L/ha or kg/ha
}

export type TreatmentReason =
  | 'Désherbage'
  | 'Rattrapage'
  | 'Maladie fongique'
  | 'Insecticides'
  | 'Autre';

export interface Treatment {
  id: string;
  fieldId: string;
  fieldName: string; // snapshot
  fieldArea: number; // snapshot (ha)
  crop: string; // snapshot
  date: string; // ISO datetime
  products: TreatmentProduct[];
  waterVolumePerHa: number; // L/ha (typically 80 or 100)
  reason: TreatmentReason;
  notes?: string;
  createdAt: string;
}
