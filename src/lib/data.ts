
export type Product = {
  id: string;
  name: string;
  price: number;
  department: 'Kitchen' | 'Bar';
};

export type Table = {
  id: number;
  status: 'Available' | 'Occupied' | 'Reserved';
  orderId?: string;
};

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  department: 'Kitchen' | 'Bar';
};

export type Order = {
  id: string;
  tableId: number;
  waiterId: string;
  waiterName: string;
  items: OrderItem[];
  total: number;
  status: 'Pending' | 'In Progress' | 'Completed';
  // We might associate an order with a customer later
  customerId?: string; 
};

export type UserRole = 'Chefe' | 'Portaria' | 'Garçom' | 'Bar' | 'Financeiro';

export type User = {
  id: string;
  name: string;
  role: UserRole;
  email: string;
};

export type Customer = {
  id: string;
  name: string;
  cpf: string;
  birthDate: Date;
  wristbandId: number;
  checkIn: Date;
  tableId?: number; // Each customer can be at a table
};

// Mock data will be replaced by Firestore data.
// We keep the types but data will come from the database.
