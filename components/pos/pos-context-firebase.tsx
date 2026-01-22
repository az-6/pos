"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  subscribeToInventory,
  subscribeToTransactions,
  subscribeToCustomers,
  subscribeToPaymentHistory,
  subscribeToIncomingGoods,
  addInventoryItem as fbAddInventoryItem,
  updateInventoryItem as fbUpdateInventoryItem,
  deleteInventoryItem as fbDeleteInventoryItem,
  addTransaction as fbAddTransaction,
  addCustomer as fbAddCustomer,
  updateCustomer as fbUpdateCustomer,
  addPayment as fbAddPayment,
  addIncomingGood as fbAddIncomingGood,
  seedInitialData,
  InventoryItem,
  Transaction,
  Customer,
  PaymentHistory,
  IncomingGood,
} from "@/lib/firebase-service";

export type {
  InventoryItem,
  Transaction,
  Customer,
  PaymentHistory,
  IncomingGood,
};

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  barcode: string;
  cost: number;
}

interface POSContextType {
  cart: CartItem[];
  inventory: InventoryItem[];
  transactions: Transaction[];
  customers: Customer[];
  paymentHistory: PaymentHistory[];
  incomingGoods: IncomingGood[];
  loading: boolean;
  error: string | null;
  addToCart: (item: InventoryItem, quantity: number) => void;
  removeFromCart: (id: string) => void;
  updateCartQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  completeTransaction: (
    paymentMethod: "cash" | "card" | "transfer",
  ) => Promise<void>;
  addInventoryItem: (item: Omit<InventoryItem, "id">) => Promise<void>;
  updateInventoryItem: (
    id: string,
    item: Partial<InventoryItem>,
  ) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  addCustomer: (customer: Omit<Customer, "id">) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  addPayment: (payment: Omit<PaymentHistory, "id">) => Promise<void>;
  addIncomingGood: (good: Omit<IncomingGood, "id">) => Promise<void>;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export function POSProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [incomingGoods, setIncomingGoods] = useState<IncomingGood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to Firebase collections
  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      // Seed initial data if needed
      seedInitialData().catch(console.error);

      // Subscribe to real-time updates
      const unsubInventory = subscribeToInventory((items) => {
        setInventory(items);
        setLoading(false);
      });

      const unsubTransactions = subscribeToTransactions((txns) => {
        setTransactions(txns);
      });

      const unsubCustomers = subscribeToCustomers((custs) => {
        setCustomers(custs);
      });

      const unsubPaymentHistory = subscribeToPaymentHistory((history) => {
        setPaymentHistory(history);
      });

      const unsubIncomingGoods = subscribeToIncomingGoods((goods) => {
        setIncomingGoods(goods);
      });

      // Cleanup subscriptions on unmount
      return () => {
        unsubInventory();
        unsubTransactions();
        unsubCustomers();
        unsubPaymentHistory();
        unsubIncomingGoods();
      };
    } catch (err) {
      setError("Failed to connect to database. Using local mode.");
      setLoading(false);
      console.error("Firebase connection error:", err);
    }
  }, []);

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
          cost: item.cost,
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

  const completeTransaction = async (
    paymentMethod: "cash" | "card" | "transfer",
  ) => {
    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const profit = cart.reduce((sum, item) => {
      return sum + (item.price - item.cost) * item.quantity;
    }, 0);

    const transaction = {
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        cost: item.cost,
      })),
      total,
      paymentMethod,
      timestamp: new Date().toISOString(),
      profit,
    };

    try {
      await fbAddTransaction(transaction);
      clearCart();
    } catch (err) {
      console.error("Failed to complete transaction:", err);
      throw err;
    }
  };

  const addInventoryItem = async (item: Omit<InventoryItem, "id">) => {
    try {
      await fbAddInventoryItem(item);
    } catch (err) {
      console.error("Failed to add inventory item:", err);
      throw err;
    }
  };

  const updateInventoryItem = async (
    id: string,
    item: Partial<InventoryItem>,
  ) => {
    try {
      await fbUpdateInventoryItem(id, item);
    } catch (err) {
      console.error("Failed to update inventory item:", err);
      throw err;
    }
  };

  const deleteInventoryItem = async (id: string) => {
    try {
      await fbDeleteInventoryItem(id);
    } catch (err) {
      console.error("Failed to delete inventory item:", err);
      throw err;
    }
  };

  const addCustomer = async (customer: Omit<Customer, "id">) => {
    try {
      await fbAddCustomer(customer);
    } catch (err) {
      console.error("Failed to add customer:", err);
      throw err;
    }
  };

  const updateCustomer = async (id: string, customer: Partial<Customer>) => {
    try {
      await fbUpdateCustomer(id, customer);
    } catch (err) {
      console.error("Failed to update customer:", err);
      throw err;
    }
  };

  const addPayment = async (payment: Omit<PaymentHistory, "id">) => {
    try {
      await fbAddPayment(payment);
    } catch (err) {
      console.error("Failed to add payment:", err);
      throw err;
    }
  };

  const addIncomingGood = async (good: Omit<IncomingGood, "id">) => {
    try {
      await fbAddIncomingGood(good);
    } catch (err) {
      console.error("Failed to add incoming good:", err);
      throw err;
    }
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
        loading,
        error,
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
