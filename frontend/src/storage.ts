import AsyncStorage from '@react-native-async-storage/async-storage';
import { Field, Product, Treatment } from './types';

const KEYS = {
  fields: 'pc.fields',
  products: 'pc.products',
  treatments: 'pc.treatments',
};

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function readList<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

async function writeList<T>(key: string, items: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

// ---- Fields ----
export async function getFields(): Promise<Field[]> {
  return readList<Field>(KEYS.fields);
}

export async function saveField(data: Omit<Field, 'id' | 'createdAt'> & { id?: string }): Promise<Field> {
  const fields = await getFields();
  if (data.id) {
    const idx = fields.findIndex((f) => f.id === data.id);
    if (idx >= 0) {
      fields[idx] = { ...fields[idx], ...data, id: data.id };
      await writeList(KEYS.fields, fields);
      return fields[idx];
    }
  }
  const newField: Field = {
    id: uid(),
    name: data.name,
    area: data.area,
    crop: data.crop,
    createdAt: new Date().toISOString(),
  };
  fields.push(newField);
  await writeList(KEYS.fields, fields);
  return newField;
}

export async function deleteField(id: string): Promise<void> {
  const fields = await getFields();
  await writeList(KEYS.fields, fields.filter((f) => f.id !== id));
}

// ---- Products ----
export async function getProducts(): Promise<Product[]> {
  return readList<Product>(KEYS.products);
}

export async function saveProduct(data: Omit<Product, 'id' | 'createdAt'> & { id?: string }): Promise<Product> {
  const products = await getProducts();
  if (data.id) {
    const idx = products.findIndex((p) => p.id === data.id);
    if (idx >= 0) {
      products[idx] = { ...products[idx], ...data, id: data.id };
      await writeList(KEYS.products, products);
      return products[idx];
    }
  }
  const newProduct: Product = {
    id: uid(),
    name: data.name,
    category: data.category,
    unit: data.unit,
    stock: data.stock,
    lowStockThreshold: data.lowStockThreshold,
    amm: data.amm,
    createdAt: new Date().toISOString(),
  };
  products.push(newProduct);
  await writeList(KEYS.products, products);
  return newProduct;
}

export async function deleteProduct(id: string): Promise<void> {
  const products = await getProducts();
  await writeList(KEYS.products, products.filter((p) => p.id !== id));
}

export async function adjustStock(productId: string, delta: number): Promise<void> {
  const products = await getProducts();
  const idx = products.findIndex((p) => p.id === productId);
  if (idx >= 0) {
    products[idx].stock = Math.max(0, products[idx].stock + delta);
    await writeList(KEYS.products, products);
  }
}

// ---- Treatments ----
export async function getTreatments(): Promise<Treatment[]> {
  const list = await readList<Treatment>(KEYS.treatments);
  // Sort by date descending
  return list.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function saveTreatment(
  data: Omit<Treatment, 'id' | 'createdAt'> & { id?: string }
): Promise<Treatment> {
  const treatments = await readList<Treatment>(KEYS.treatments);

  if (data.id) {
    // Edit: revert previous stock impact, then apply new one
    const idx = treatments.findIndex((t) => t.id === data.id);
    if (idx >= 0) {
      const prev = treatments[idx];
      for (const p of prev.products) {
        await adjustStock(p.productId, +(p.dosePerHa * prev.fieldArea));
      }
      for (const p of data.products) {
        await adjustStock(p.productId, -(p.dosePerHa * data.fieldArea));
      }
      treatments[idx] = { ...prev, ...data, id: prev.id };
      await writeList(KEYS.treatments, treatments);
      return treatments[idx];
    }
  }

  // New
  const newTreatment: Treatment = {
    id: uid(),
    fieldId: data.fieldId,
    fieldName: data.fieldName,
    fieldArea: data.fieldArea,
    crop: data.crop,
    date: data.date,
    products: data.products,
    waterVolumePerHa: data.waterVolumePerHa,
    reason: data.reason,
    notes: data.notes,
    createdAt: new Date().toISOString(),
  };
  for (const p of newTreatment.products) {
    await adjustStock(p.productId, -(p.dosePerHa * newTreatment.fieldArea));
  }
  treatments.push(newTreatment);
  await writeList(KEYS.treatments, treatments);
  return newTreatment;
}

export async function deleteTreatment(id: string): Promise<void> {
  const treatments = await readList<Treatment>(KEYS.treatments);
  const t = treatments.find((x) => x.id === id);
  if (t) {
    // Refund stock
    for (const p of t.products) {
      await adjustStock(p.productId, +(p.dosePerHa * t.fieldArea));
    }
  }
  await writeList(KEYS.treatments, treatments.filter((x) => x.id !== id));
}

// ---- Utility ----
export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.fields, KEYS.products, KEYS.treatments]);
}

// ---- Bulk import ----
export async function addFieldsBulk(
  items: Omit<Field, 'id' | 'createdAt'>[]
): Promise<number> {
  if (items.length === 0) return 0;
  const existing = await getFields();
  const nowIso = new Date().toISOString();
  const toAdd: Field[] = items.map((it) => ({
    id: uid(),
    name: it.name,
    area: it.area,
    crop: it.crop,
    createdAt: nowIso,
  }));
  await writeList(KEYS.fields, [...existing, ...toAdd]);
  return toAdd.length;
}

export async function addProductsBulk(
  items: Omit<Product, 'id' | 'createdAt'>[]
): Promise<number> {
  if (items.length === 0) return 0;
  const existing = await getProducts();
  const nowIso = new Date().toISOString();
  const toAdd: Product[] = items.map((it) => ({
    id: uid(),
    name: it.name,
    category: it.category,
    unit: it.unit,
    stock: it.stock,
    lowStockThreshold: it.lowStockThreshold,
    amm: it.amm,
    createdAt: nowIso,
  }));
  await writeList(KEYS.products, [...existing, ...toAdd]);
  return toAdd.length;
}
