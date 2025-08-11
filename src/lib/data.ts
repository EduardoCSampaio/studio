
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
};

// Mock data will be replaced by Firestore data.
export const users: User[] = [];
export const customers: Customer[] = [];
export const products: Product[] = [];
export const tables: Table[] = [];
export let orders: Order[] = [];
