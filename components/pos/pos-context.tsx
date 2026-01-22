"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  barcode: string;
}

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

export interface Transaction {
  id: string;
  items: CartItem[];
  total: number;
  paymentMethod: "cash" | "card" | "transfer";
  timestamp: string;
  profit: number;
}

export interface Customer {
  id: string;
  name: string;
  debt: number;
  phone: string;
  lastTransaction: string;
  notes: string;
}

export interface PaymentHistory {
  id: string;
  customerId: string;
  amount: number;
  type: "debt" | "payment";
  timestamp: string;
  notes: string;
}

export interface IncomingGood {
  id: string;
  itemId: string;
  quantity: number;
  cost: number;
  timestamp: string;
  expiryDate: string;
}

interface POSContextType {
  cart: CartItem[];
  inventory: InventoryItem[];
  transactions: Transaction[];
  customers: Customer[];
  paymentHistory: PaymentHistory[];
  incomingGoods: IncomingGood[];
  addToCart: (item: InventoryItem, quantity: number) => void;
  removeFromCart: (id: string) => void;
  updateCartQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  completeTransaction: (paymentMethod: "cash" | "card" | "transfer") => void;
  addInventoryItem: (item: InventoryItem) => void;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  addPayment: (payment: PaymentHistory) => void;
  addIncomingGood: (good: IncomingGood) => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export function POSProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [incomingGoods, setIncomingGoods] = useState<IncomingGood[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedInventory = localStorage.getItem("pos_inventory");
    const savedTransactions = localStorage.getItem("pos_transactions");
    const savedCustomers = localStorage.getItem("pos_customers");
    const savedPaymentHistory = localStorage.getItem("pos_payment_history");
    const savedIncomingGoods = localStorage.getItem("pos_incoming_goods");

    if (savedInventory) setInventory(JSON.parse(savedInventory));
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
    if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
    if (savedPaymentHistory) setPaymentHistory(JSON.parse(savedPaymentHistory));
    if (savedIncomingGoods) setIncomingGoods(JSON.parse(savedIncomingGoods));
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("pos_inventory", JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem("pos_transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("pos_customers", JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem("pos_payment_history", JSON.stringify(paymentHistory));
  }, [paymentHistory]);

  useEffect(() => {
    localStorage.setItem("pos_incoming_goods", JSON.stringify(incomingGoods));
  }, [incomingGoods]);

  const addToCart = (item: InventoryItem, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + quantity } : c,
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity,
          barcode: item.barcode,
        },
      ];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCartQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, quantity } : c)));
  };

  const clearCart = () => {
    setCart([]);
  };

  const completeTransaction = (paymentMethod: "cash" | "card" | "transfer") => {
    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const profit = cart.reduce((sum, item) => {
      const inventoryItem = inventory.find((i) => i.id === item.id);
      if (!inventoryItem) return sum;
      return sum + (item.price - inventoryItem.cost) * item.quantity;
    }, 0);

    const transaction: Transaction = {
      id: `TXN-${Date.now()}`,
      items: [...cart],
      total,
      paymentMethod,
      timestamp: new Date().toISOString(),
      profit,
    };

    setTransactions((prev) => [transaction, ...prev]);

    // Update inventory
    setInventory((prev) =>
      prev.map((item) => {
        const cartItem = cart.find((c) => c.id === item.id);
        if (!cartItem) return item;
        return { ...item, quantity: item.quantity - cartItem.quantity };
      }),
    );

    clearCart();
  };

  const addInventoryItem = (item: InventoryItem) => {
    setInventory((prev) => [
      ...prev,
      {
        ...item,
        id: item.id || `ITEM-${Date.now()}`,
        createdAt: item.createdAt || new Date().toISOString(),
      },
    ]);
  };

  const updateInventoryItem = (id: string, item: Partial<InventoryItem>) => {
    setInventory((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...item } : i)),
    );
  };

  const deleteInventoryItem = (id: string) => {
    setInventory((prev) => prev.filter((i) => i.id !== id));
  };

  const addCustomer = (customer: Customer) => {
    setCustomers((prev) => [
      ...prev,
      { ...customer, id: customer.id || `CUST-${Date.now()}` },
    ]);
  };

  const updateCustomer = (id: string, customer: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...customer } : c)),
    );
  };

  const addPayment = (payment: PaymentHistory) => {
    setPaymentHistory((prev) => [
      ...prev,
      { ...payment, id: `PAY-${Date.now()}` },
    ]);

    // Update customer debt
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === payment.customerId) {
          const debtChange =
            payment.type === "debt" ? payment.amount : -payment.amount;
          return { ...c, debt: c.debt + debtChange };
        }
        return c;
      }),
    );
  };

  const addIncomingGood = (good: IncomingGood) => {
    setIncomingGoods((prev) => [...prev, { ...good, id: `ING-${Date.now()}` }]);

    // Update inventory
    setInventory((prev) =>
      prev.map((item) =>
        item.id === good.itemId
          ? {
              ...item,
              quantity: item.quantity + good.quantity,
              expiryDate: good.expiryDate || item.expiryDate,
            }
          : item,
      ),
    );
  };

  return (
    <POSContext.Provider
      value={{
        cart,
        inventory,
        transactions,
        customers,
        paymentHistory,
        incomingGoods,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        completeTransaction,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        addCustomer,
        updateCustomer,
        addPayment,
        addIncomingGood,
      }}
    >
      {children}
    </POSContext.Provider>
  );
}

export function usePOS() {
  const context = useContext(POSContext);
  if (context === undefined) {
    throw new Error("usePOS must be used within a POSProvider");
  }
  return context;
}
