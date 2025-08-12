

export type Product = {
  id: string;
  name: string;
  price: number;
  department: 'Cozinha' | 'Bar' | 'Geral';
  chefeId: string;
};

export type Table = {
  id: number;
  status: 'Disponível' | 'Ocupada' | 'Reservada';
  orderId?: string;
  chefeId: string;
};

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  department: 'Cozinha' | 'Bar' | 'Geral';
  status?: 'Cancelled';
  promotionId?: string;
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
  chefeId: string;
};

export type UserRole = 'Admin' | 'Chefe' | 'Portaria' | 'Garçom' | 'Bar' | 'Caixa' | 'Cozinha';

export type User = {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  chefeId?: string; // ID do Chefe que gerencia este usuário. O próprio Chefe não terá isso.
};

export type Customer = {
  id: string;
  name: string;
  cpf: string;
  birthDate: Date;
  wristbandId: number;
  checkIn: Date;
  tableId?: number;
  chefeId: string;
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
    chefeId: string;
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
    chefeId: string;
}

export type SystemEvent = {
    id: string;
    timestamp: any; // Firestore server timestamp
    level: 'info' | 'warning' | 'error';
    message: string;
    details?: Record<string, any>;
};

export type Promotion = {
    id: string;
    name: string;
    products: Product[];
    originalPrice: number;
    discountPercentage: number;
    finalPrice: number;
    chefeId: string;
    isActive: boolean;
};
    
