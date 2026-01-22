import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

// Collection names
const COLLECTIONS = {
  INVENTORY: "inventory",
  TRANSACTIONS: "transactions",
  CUSTOMERS: "customers",
  INCOMING_GOODS: "incomingGoods",
  PAYMENT_HISTORY: "paymentHistory",
};

// ==================== INVENTORY ====================

export interface InventoryItem {
  id: string;
  name: string;
  barcode: string;
  quantity: number;
  price: number;
  cost: number;
  minStock: number;
  expiryDate: string;
  category: string;
  createdAt: string;
}

export async function getInventory(): Promise<InventoryItem[]> {
  const querySnapshot = await getDocs(collection(db, COLLECTIONS.INVENTORY));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as InventoryItem[];
}

export async function addInventoryItem(
  item: Omit<InventoryItem, "id">,
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTIONS.INVENTORY), {
    ...item,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function updateInventoryItem(
  id: string,
  data: Partial<InventoryItem>,
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.INVENTORY, id);
  await updateDoc(docRef, data);
}

export async function deleteInventoryItem(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.INVENTORY, id);
  await deleteDoc(docRef);
}

export function subscribeToInventory(
  callback: (items: InventoryItem[]) => void,
) {
  return onSnapshot(collection(db, COLLECTIONS.INVENTORY), (snapshot) => {
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as InventoryItem[];
    callback(items);
  });
}

// ==================== TRANSACTIONS ====================

export interface TransactionItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  cost: number;
}

export interface Transaction {
  id: string;
  items: TransactionItem[];
  total: number;
  profit: number;
  paymentMethod: "cash" | "card" | "transfer";
  timestamp: string;
  customerId?: string;
}

export async function getTransactions(): Promise<Transaction[]> {
  const q = query(
    collection(db, COLLECTIONS.TRANSACTIONS),
    orderBy("timestamp", "desc"),
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Transaction[];
}

export async function addTransaction(
  transaction: Omit<Transaction, "id">,
): Promise<string> {
  const batch = writeBatch(db);

  // Add transaction
  const transactionRef = doc(collection(db, COLLECTIONS.TRANSACTIONS));
  batch.set(transactionRef, {
    ...transaction,
    timestamp: new Date().toISOString(),
  });

  // Update inventory quantities
  for (const item of transaction.items) {
    const inventoryRef = doc(db, COLLECTIONS.INVENTORY, item.id);
    const inventoryDoc = await getDoc(inventoryRef);
    if (inventoryDoc.exists()) {
      const currentQty = inventoryDoc.data().quantity || 0;
      batch.update(inventoryRef, {
        quantity: Math.max(0, currentQty - item.quantity),
      });
    }
  }

  await batch.commit();
  return transactionRef.id;
}

export function subscribeToTransactions(
  callback: (transactions: Transaction[]) => void,
) {
  const q = query(
    collection(db, COLLECTIONS.TRANSACTIONS),
    orderBy("timestamp", "desc"),
  );
  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Transaction[];
    callback(transactions);
  });
}

// ==================== CUSTOMERS ====================

export interface Customer {
  id: string;
  name: string;
  phone: string;
  debt: number;
  lastTransaction: string;
  notes: string;
}

export async function getCustomers(): Promise<Customer[]> {
  const querySnapshot = await getDocs(collection(db, COLLECTIONS.CUSTOMERS));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Customer[];
}

export async function addCustomer(
  customer: Omit<Customer, "id">,
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTIONS.CUSTOMERS), customer);
  return docRef.id;
}

export async function updateCustomer(
  id: string,
  data: Partial<Customer>,
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.CUSTOMERS, id);
  await updateDoc(docRef, data);
}

export async function deleteCustomer(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.CUSTOMERS, id);
  await deleteDoc(docRef);
}

export function subscribeToCustomers(
  callback: (customers: Customer[]) => void,
) {
  return onSnapshot(collection(db, COLLECTIONS.CUSTOMERS), (snapshot) => {
    const customers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Customer[];
    callback(customers);
  });
}

// ==================== INCOMING GOODS ====================

export interface IncomingGood {
  id: string;
  itemId: string;
  quantity: number;
  cost: number;
  timestamp: string;
  expiryDate: string;
}

export async function getIncomingGoods(): Promise<IncomingGood[]> {
  const q = query(
    collection(db, COLLECTIONS.INCOMING_GOODS),
    orderBy("timestamp", "desc"),
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as IncomingGood[];
}

export async function addIncomingGood(
  good: Omit<IncomingGood, "id">,
): Promise<string> {
  const batch = writeBatch(db);

  // Add incoming good record
  const goodRef = doc(collection(db, COLLECTIONS.INCOMING_GOODS));
  batch.set(goodRef, {
    ...good,
    timestamp: new Date().toISOString(),
  });

  // Update inventory quantity
  const inventoryRef = doc(db, COLLECTIONS.INVENTORY, good.itemId);
  const inventoryDoc = await getDoc(inventoryRef);
  if (inventoryDoc.exists()) {
    const currentQty = inventoryDoc.data().quantity || 0;
    batch.update(inventoryRef, {
      quantity: currentQty + good.quantity,
      expiryDate: good.expiryDate,
    });
  }

  await batch.commit();
  return goodRef.id;
}

export function subscribeToIncomingGoods(
  callback: (goods: IncomingGood[]) => void,
) {
  const q = query(
    collection(db, COLLECTIONS.INCOMING_GOODS),
    orderBy("timestamp", "desc"),
  );
  return onSnapshot(q, (snapshot) => {
    const goods = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as IncomingGood[];
    callback(goods);
  });
}

// ==================== PAYMENT HISTORY ====================

export interface PaymentHistory {
  id: string;
  customerId: string;
  amount: number;
  type: "debt" | "payment";
  timestamp: string;
  notes: string;
}

export async function getPaymentHistory(): Promise<PaymentHistory[]> {
  const q = query(
    collection(db, COLLECTIONS.PAYMENT_HISTORY),
    orderBy("timestamp", "desc"),
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as PaymentHistory[];
}

export async function addPayment(
  payment: Omit<PaymentHistory, "id">,
): Promise<string> {
  const batch = writeBatch(db);

  // Add payment record
  const paymentRef = doc(collection(db, COLLECTIONS.PAYMENT_HISTORY));
  batch.set(paymentRef, {
    ...payment,
    timestamp: new Date().toISOString(),
  });

  // Update customer debt
  const customerRef = doc(db, COLLECTIONS.CUSTOMERS, payment.customerId);
  const customerDoc = await getDoc(customerRef);
  if (customerDoc.exists()) {
    const currentDebt = customerDoc.data().debt || 0;
    const newDebt =
      payment.type === "debt"
        ? currentDebt + payment.amount
        : Math.max(0, currentDebt - payment.amount);
    batch.update(customerRef, { debt: newDebt });
  }

  await batch.commit();
  return paymentRef.id;
}

export function subscribeToPaymentHistory(
  callback: (history: PaymentHistory[]) => void,
) {
  const q = query(
    collection(db, COLLECTIONS.PAYMENT_HISTORY),
    orderBy("timestamp", "desc"),
  );
  return onSnapshot(q, (snapshot) => {
    const history = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PaymentHistory[];
    callback(history);
  });
}

// ==================== SEED DATA (for initial setup) ====================

export async function seedInitialData() {
  const inventorySnapshot = await getDocs(
    collection(db, COLLECTIONS.INVENTORY),
  );

  // Only seed if inventory is empty
  if (inventorySnapshot.empty) {
    const sampleInventory: Omit<InventoryItem, "id">[] = [
      {
        name: "Indomie Goreng",
        barcode: "8996001010100",
        quantity: 100,
        price: 3500,
        cost: 2800,
        minStock: 20,
        expiryDate: "2026-12-31",
        category: "Mie Instan",
        createdAt: new Date().toISOString(),
      },
      {
        name: "Aqua 600ml",
        barcode: "8996001010101",
        quantity: 50,
        price: 4000,
        cost: 2500,
        minStock: 15,
        expiryDate: "2027-06-30",
        category: "Minuman",
        createdAt: new Date().toISOString(),
      },
      {
        name: "Teh Botol Sosro",
        barcode: "8996001010102",
        quantity: 30,
        price: 5000,
        cost: 3500,
        minStock: 10,
        expiryDate: "2026-08-15",
        category: "Minuman",
        createdAt: new Date().toISOString(),
      },
      {
        name: "Roti Tawar Sari Roti",
        barcode: "8996001010103",
        quantity: 15,
        price: 15000,
        cost: 11000,
        minStock: 5,
        expiryDate: "2026-02-01",
        category: "Roti",
        createdAt: new Date().toISOString(),
      },
      {
        name: "Susu Ultra 1L",
        barcode: "8996001010104",
        quantity: 25,
        price: 18000,
        cost: 14000,
        minStock: 8,
        expiryDate: "2026-03-15",
        category: "Susu",
        createdAt: new Date().toISOString(),
      },
    ];

    for (const item of sampleInventory) {
      await addInventoryItem(item);
    }

    console.log("Sample inventory data seeded successfully!");
  }
}
