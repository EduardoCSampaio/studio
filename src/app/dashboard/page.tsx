
"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { type Order, type Customer } from "@/lib/data"
import { CheckCircle, DollarSign, Users, CreditCard, Trophy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, query, where, Timestamp, doc, updateDoc } from "firebase/firestore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"


const initialSalesData = [
  { name: "Jan", total: 0 },
  { name: "Fev", total: 0 },
  { name: "Mar", total: 0 },
  { name: "Abr", total: 0 },
  { name: "Mai", total: 0 },
  { name: "Jun", total: 0 },
  { name: "Jul", total: 0 },
  { name: "Ago", total: 0 },
  { name: "Set", total: 0 },
  { name: "Out", total: 0 },
  { name: "Nov", total: 0 },
  { name: "Dez", total: 0 },
]

type WaiterRanking = {
    waiterId: string;
    waiterName: string;
    totalSales: number;
    avatarUrl: string;
}

export default function DashboardPage() {
  const [orders, setOrders] = React.useState<Order[]>([])
  const [customersToday, setCustomersToday] = React.useState<Customer[]>([]);
  const [salesData, setSalesData] = React.useState(initialSalesData);
  const [waiterRanking, setWaiterRanking] = React.useState<WaiterRanking[]>([]);
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null)
  const [isDialogOpen, setDialogOpen] = React.useState(false)
  const { toast } = useToast()

  React.useEffect(() => {
    // Listen for all orders
    const ordersUnsubscribe = onSnapshot(collection(db, "orders"), (snapshot) => {
        const ordersList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Order[];
        setOrders(ordersList);
        updateSalesChart(ordersList);
        updateWaiterRanking(ordersList);
    });

    // Listen for customers who checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);
    const customersQuery = query(collection(db, "customers"), where("checkIn", ">=", todayTimestamp));
    const customersUnsubscribe = onSnapshot(customersQuery, (snapshot) => {
        const customersList = snapshot.docs.map(doc => doc.data() as Customer);
        setCustomersToday(customersList);
    });
    
    return () => {
        ordersUnsubscribe();
        customersUnsubscribe();
    };
  }, [])

  const updateSalesChart = (allOrders: Order[]) => {
      const monthlySales = [...initialSalesData];
      allOrders.forEach(order => {
          if (order.createdAt && order.status === 'Completed') {
              // Firebase timestamps can be converted to JS Date objects
              const orderDate = (order.createdAt as Timestamp).toDate();
              const month = orderDate.getMonth(); // 0 = Jan, 1 = Feb, etc.
              monthlySales[month].total += order.total;
          }
      });
      setSalesData(monthlySales);
  }

  const updateWaiterRanking = (allOrders: Order[]) => {
    const completedOrders = allOrders.filter(order => order.status === 'Completed');
    
    const salesByWaiter = completedOrders.reduce((acc, order) => {
        if (!acc[order.waiterId]) {
            acc[order.waiterId] = {
                waiterId: order.waiterId,
                waiterName: order.waiterName,
                totalSales: 0,
                avatarUrl: `https://i.pravatar.cc/40?u=${order.waiterId}`
            };
        }
        acc[order.waiterId].totalSales += order.total;
        return acc;
    }, {} as Record<string, WaiterRanking>);

    const rankedWaiters = Object.values(salesByWaiter)
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, 5); // Pega o top 5
        
    setWaiterRanking(rankedWaiters);
  }

  const handleOpenDialog = (order: Order) => {
    setSelectedOrder(order)
    setDialogOpen(true)
  }

  const handleCompleteOrder = async (orderId: string) => {
    if (!selectedOrder) return;
    const orderRef = doc(db, "orders", orderId);
    try {
        await updateDoc(orderRef, {
            status: "Completed"
        });
        toast({
          title: "Pedido Concluído",
          description: `O pedido #${selectedOrder.comandaId} foi marcado como concluído.`,
        })
        setDialogOpen(false)
    } catch (error) {
        console.error("Error completing order: ", error);
        toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível atualizar o status do pedido.",
        })
    }
  }
  
  const getBadgeVariant = (status: Order['status']) => {
      switch (status) {
          case 'Completed': return 'secondary';
          case 'Pending': return 'default';
          case 'Cancelled': return 'destructive';
          case 'In Progress': return 'outline';
          default: return 'outline';
      }
  }

  const renderOrderRow = (order: Order) => (
    <TableRow key={order.id} className="cursor-pointer" onClick={() => handleOpenDialog(order)}>
      <TableCell className="font-medium">#{order.comandaId}</TableCell>
      <TableCell>{order.tableId || 'N/A'}</TableCell>
      <TableCell>{order.waiterName}</TableCell>
      <TableCell>
        {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
      </TableCell>
       <TableCell className="text-right">
        {order.printedAt ? format((order.printedAt as Timestamp).toDate(), 'HH:mm:ss') : 'Não'}
      </TableCell>
      <TableCell className="text-right">R${order.total.toFixed(2)}</TableCell>
      <TableCell>
        <Badge variant={getBadgeVariant(order.status)}>
          {order.status}
        </Badge>
      </TableCell>
      <TableCell>
        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenDialog(order); }}>
          Detalhes
        </Button>
      </TableCell>
    </TableRow>
  )

  const kitchenOrders = orders.filter(o => o.items.some(i => i.department === 'Cozinha' && o.status !== 'Completed'))
  const barOrders = orders.filter(o => o.items.some(i => i.department === 'Bar' && o.status !== 'Completed'))
  const allOrders = orders.sort((a, b) => (b.createdAt as Timestamp).seconds - (a.createdAt as Timestamp).seconds);
  
  const totalRevenue = orders.reduce((acc, order) => order.status === 'Completed' ? acc + order.total : acc, 0);
  const completedOrdersCount = orders.filter(order => order.status === 'Completed').length;
  const pendingOrdersCount = orders.filter(order => order.status !== 'Completed').length;

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-headline font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Acompanhe em tempo real os pedidos do restaurante.
            </p>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento Total (Concluído)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R${totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Faturamento dos pedidos pagos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Concluídos</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{completedOrdersCount}</div>
              <p className="text-xs text-muted-foreground">Total de pedidos finalizados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrdersCount}</div>
              <p className="text-xs text-muted-foreground">Pedidos na fila para preparo</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes na Casa</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{customersToday.length}</div>
              <p className="text-xs text-muted-foreground">Check-ins realizados hoje</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
             <CardHeader>
              <CardTitle>Visão Geral de Faturamento</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
               <ResponsiveContainer width="100%" height={350}>
                <BarChart data={salesData}>
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$${value}`}
                  />
                  <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" /> Ranking de Garçons
              </CardTitle>
              <CardDescription>
                Top 5 vendedores com base nas vendas concluídas.
              </CardDescription>
            </CardHeader>
            <CardContent>
               {waiterRanking.length > 0 ? (
                   waiterRanking.map(waiter => (
                      <div key={waiter.waiterId} className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                               <Avatar className="h-9 w-9">
                                  <AvatarImage src={waiter.avatarUrl} alt={waiter.waiterName} />
                                  <AvatarFallback>{waiter.waiterName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                  <p className="text-sm font-medium leading-none">{waiter.waiterName}</p>
                                  <p className="text-sm text-muted-foreground">ID: {waiter.waiterId.substring(0, 5)}...</p>
                              </div>
                          </div>
                          <div className="ml-auto font-medium text-lg">+R${waiter.totalSales.toFixed(2)}</div>
                      </div>
                   ))
               ) : (
                  <div className="text-center text-muted-foreground py-8">
                      Nenhuma venda concluída por garçons para exibir o ranking.
                  </div>
               )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">Todos os Pedidos</TabsTrigger>
            <TabsTrigger value="kitchen">Cozinha</TabsTrigger>
            <TabsTrigger value="bar">Bar</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Todos os Pedidos Ativos & Concluídos</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Comanda</TableHead>
                      <TableHead>Mesa</TableHead>
                      <TableHead>Garçom</TableHead>
                      <TableHead>Itens</TableHead>
                      <TableHead>Impresso às</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allOrders.length > 0 ? allOrders.map(renderOrderRow) : <TableRow><TableCell colSpan={8} className="text-center h-24">Nenhum pedido encontrado.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="kitchen">
             <Card>
              <CardHeader>
                <CardTitle>Pedidos Ativos da Cozinha</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Comanda</TableHead>
                      <TableHead>Mesa</TableHead>
                      <TableHead>Garçom</TableHead>
                      <TableHead>Itens</TableHead>
                      <TableHead>Impresso às</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kitchenOrders.length > 0 ? kitchenOrders.map(renderOrderRow) : <TableRow><TableCell colSpan={8} className="text-center h-24">Nenhum pedido ativo na cozinha.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="bar">
              <Card>
              <CardHeader>
                <CardTitle>Pedidos Ativos do Bar</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Comanda</TableHead>
                      <TableHead>Mesa</TableHead>
                      <TableHead>Garçom</TableHead>
                      <TableHead>Itens</TableHead>
                      <TableHead>Impresso às</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {barOrders.length > 0 ? barOrders.map(renderOrderRow) : <TableRow><TableCell colSpan={8} className="text-center h-24">Nenhum pedido ativo no bar.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {selectedOrder && (
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-headline">Pedido #{selectedOrder.comandaId}</DialogTitle>
              <DialogDescription>
                Mesa: {selectedOrder.tableId || 'N/A'} - Garçom: {selectedOrder.waiterName} - Status: {selectedOrder.status}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {selectedOrder.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span>{item.quantity} x {item.name}</span>
                  <span className="font-mono">R${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-4 mt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>R${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>
            <DialogFooter>
              {selectedOrder.status !== 'Completed' && (
                <Button onClick={() => handleCompleteOrder(selectedOrder.id)}>
                  <CheckCircle className="mr-2 h-4 w-4" /> Marcar como Concluído
                </Button>
              )}
              <DialogClose asChild>
                  <Button variant="outline">Fechar</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
