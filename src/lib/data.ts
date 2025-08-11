
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

export const users: User[] = [
  { id: 'user1', name: 'Alice Chefe', role: 'Chefe', email: 'chefe@restotrack.com' },
  { id: 'user2', name: 'Beto Portaria', role: 'Portaria', email: 'portaria@restotrack.com' },
  { id: 'user3', name: 'Carlos Garçom', role: 'Garçom', email: 'garcom@restotrack.com' },
  { id: 'user4', name: 'Diana Bar', role: 'Bar', email: 'bar@restotrack.com' },
  { id: 'user5', name: 'Eduardo Financeiro', role: 'Financeiro', email: 'financeiro@restotrack.com' },
];

export const customers: Customer[] = [
    { id: 'cust1', name: 'João Silva', cpf: '111.222.333-44', birthDate: new Date(1990, 1, 1), wristbandId: 101, checkIn: new Date() },
    { id: 'cust2', name: 'Maria Oliveira', cpf: '222.333.444-55', birthDate: new Date(1985, 5, 10), wristbandId: 102, checkIn: new Date() },
    { id: 'cust3', name: 'Pedro Santos', cpf: '333.444.555-66', birthDate: new Date(2000, 11, 25), wristbandId: 103, checkIn: new Date() },
];


export const products: Product[] = [
  { id: 'p1', name: 'Steak Frites', price: 28.50, department: 'Kitchen' },
  { id: 'p2', name: 'Mushroom Risotto', price: 22.00, department: 'Kitchen' },
  { id: 'p3', name: 'Grilled Salmon', price: 26.00, department: 'Kitchen' },
  { id: 'p4', name: 'Caesar Salad', price: 14.00, department: 'Kitchen' },
  { id: 'p5', name: 'Old Fashioned', price: 12.00, department: 'Bar' },
  { id: 'p6', name: 'Glass of Merlot', price: 10.00, department: 'Bar' },
  { id: 'p7', name: 'Sparkling Water', price: 4.00, department: 'Bar' },
  { id: 'p8', name: 'Tiramisu', price: 9.00, department: 'Kitchen' },
];

export const tables: Table[] = [
  { id: 1, status: 'Occupied', orderId: 'ord1' },
  { id: 2, status: 'Available' },
  { id: 3, status: 'Occupied', orderId: 'ord2' },
  { id: 4, status: 'Reserved' },
  { id: 5, status: 'Available' },
  { id: 6, status: 'Occupied', orderId: 'ord3' },
  { id: 7, status: 'Available' },
  { id: 8, status: 'Available' },
  { id: 9, status: 'Reserved' },
  { id: 10, status: 'Occupied', orderId: 'ord4' },
];

export const orders: Order[] = [
  {
    id: 'ord1',
    tableId: 1,
    items: [
      { productId: 'p1', name: 'Steak Frites', price: 28.50, quantity: 2, department: 'Kitchen' },
      { productId: 'p6', name: 'Glass of Merlot', price: 10.00, quantity: 2, department: 'Bar' },
    ],
    total: 77.00,
    status: 'In Progress',
  },
  {
    id: 'ord2',
    tableId: 3,
    items: [
      { productId: 'p2', name: 'Mushroom Risotto', price: 22.00, quantity: 1, department: 'Kitchen' },
      { productId: 'p4', name: 'Caesar Salad', price: 14.00, quantity: 1, department: 'Kitchen' },
      { productId: 'p7', name: 'Sparkling Water', price: 4.00, quantity: 1, department: 'Bar' },
    ],
    total: 40.00,
    status: 'Pending',
  },
  {
    id: 'ord3',
    tableId: 6,
    items: [
      { productId: 'p5', name: 'Old Fashioned', price: 12.00, quantity: 2, department: 'Bar' },
    ],
    total: 24.00,
    status: 'In Progress',
  },
  {
    id: 'ord4',
    tableId: 10,
    items: [
      { productId: 'p3', name: 'Grilled Salmon', price: 26.00, quantity: 1, department: 'Kitchen' },
      { productId: 'p8', name: 'Tiramisu', price: 9.00, quantity: 1, department: 'Kitchen' },
      { productId: 'p7', name: 'Sparkling Water', price: 4.00, quantity: 1, department: 'Bar' },
    ],
    total: 39.00,
    status: 'Pending',
  },
];
