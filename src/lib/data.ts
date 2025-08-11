
export type Product = {
  id: string;
  name: string;
  price: number;
  department: 'Cozinha' | 'Bar';
};

export type Table = {
  id: number;
  status: 'Disponível' | 'Ocupada' | 'Reservada';
  orderId?: string;
};

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  department: 'Cozinha' | 'Bar';
  status?: 'Cancelado';
};

export type Order = {
  id: string;
  comandaId: string;
  tableId?: number;
  waiterId: string;
  waiterName: string;
  items: OrderItem[];
  total: number;
  status: 'Pendente' | 'Em Preparo' | 'Concluído';
  customerId?: string; 
  customerName?: string;
  createdAt: any; // Firestore server timestamp
  printedAt?: any | null; // Firestore server timestamp or null
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
    { name: 'Chefe', role: 'Chefe', email: 'chefe@namata.com' },
    { name: 'Portaria', role: 'Portaria', email: 'portaria@namata.com' },
    { name: 'Garçom', role: 'Garçom', email: 'garcom@namata.com' },
    { name: 'Bar', role: 'Bar', email: 'bar@namata.com' },
    { name: 'Cozinha', role: 'Cozinha', email: 'cozinha@namata.com' },
    { name: 'Caixa', role: 'Caixa', email: 'caixa@namata.com' },
];
