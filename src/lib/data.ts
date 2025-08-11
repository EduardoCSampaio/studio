
export type Product = {
  id: string;
  name: string;
  price: number;
  department: 'Cozinha' | 'Bar';
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
  department: 'Cozinha' | 'Bar';
  status?: 'Cancelled';
};

export type Order = {
  id: string;
  comandaId: string;
  tableId?: number;
  waiterId: string;
  waiterName: string;
  items: OrderItem[];
  total: number;
  status: 'Pending' | 'In Progress' | 'Completed';
  customerId?: string; 
  customerName?: string;
  createdAt: any; // Firestore server timestamp
  printedAt?: any; // Firestore server timestamp
};

export type UserRole = 'Chefe' | 'Portaria' | 'Garçom' | 'Bar' | 'Caixa' | 'Cozinha';

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
  tableId?: number;
};

// Mock data for testing login profiles
export const testUsers: Omit<User, 'id'>[] = [
    { name: 'Chefe', role: 'Chefe', email: 'chefe@restotrack.com' },
    { name: 'Portaria', role: 'Portaria', email: 'portaria@restotrack.com' },
    { name: 'Garçom', role: 'Garçom', email: 'garcom@restotrack.com' },
    { name: 'Bar', role: 'Bar', email: 'bar@restotrack.com' },
    { name: 'Cozinha', role: 'Cozinha', email: 'cozinha@restotrack.com' },
    { name: 'Caixa', role: 'Caixa', email: 'caixa@restotrack.com' },
];

    
