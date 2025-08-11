

export type Product = {
  id: string;
  name: string;
  price: number;
  department: 'Cozinha' | 'Bar' | 'Geral';
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
  department: 'Cozinha' | 'Bar' | 'Geral';
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
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  paymentMethod?: 'dinheiro' | 'credito' | 'debito';
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

export type Reservation = {
    id: string;
    name: string;
    pax: number;
    phone?: string;
    reservationTime: any; // Timestamp
    tableId?: string;
    status: 'Confirmada' | 'Cancelada' | 'Aguardando';
    notes?: string;
    createdBy: string; // userId
}

export type DailyClosing = {
    id: string;
    date: any; // Timestamp for the closing date (e.g., start of day)
    closedAt: any; // Timestamp for when the closing was performed
    closedByUserId: string;
    closedByUserName: string;
    totalRevenue: number;
    totalDinheiro: number;
    totalCredito: number;
    totalDebito: number;
    totalServiceFee: number;
    totalCustomers: number;
    totalCompletedOrders: number;
    cancelledItems: OrderItem[];
    totalCancelledValue: number;
}

// Mock data for testing login profiles
export const testUsers: Omit<User, 'id'>[] = [
    { name: 'Chefe', role: 'Chefe', email: 'chefe@namata.com' },
    { name: 'Portaria', role: 'Portaria', email: 'portaria@namata.com' },
    { name: 'Garçom', role: 'Garçom', email: 'garcom@namata.com' },
    { name: 'Bar', role: 'Bar', email: 'bar@namata.com' },
    { name: 'Cozinha', role: 'Cozinha', email: 'cozinha@namata.com' },
    { name: 'Caixa', role: 'Caixa', email: 'caixa@namata.com' },
];

    