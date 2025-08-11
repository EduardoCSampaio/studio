
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

// Mock data for testing login profiles
export const testUsers: User[] = [
    { id: '1', name: 'Chefe', role: 'Chefe', email: 'chefe@restotrack.com' },
    { id: '2', name: 'Portaria', role: 'Portaria', email: 'portaria@restotrack.com' },
    { id: '3', name: 'Garçom', role: 'Garçom', email: 'garcom@restotrack.com' },
    { id: '4', name: 'Bar', role: 'Bar', email: 'bar@restotrack.com' },
    { id: '5', name: 'Financeiro', role: 'Financeiro', email: 'financeiro@restotrack.com' },
];

