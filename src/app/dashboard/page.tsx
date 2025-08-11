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
import { orders as initialOrders, type Order } from "@/lib/data"
import { Printer, CheckCircle, DollarSign, Users, CreditCard, Activity } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

const initialSalesData = [
  { name: "Jan", total: 0 },
  { name: "Feb", total: 0 },
  { name: "Mar", total: 0 },
  { name: "Apr", total: 0 },
  { name: "May", total: 0 },
  { name: "Jun", total: 0 },
  { name: "Jul", total: 0 },
  { name: "Aug", total: 0 },
  { name: "Sep", total: 0 },
  { name: "Oct", total: 0 },
  { name: "Nov", total: 0 },
  { name: "Dec", total: 0 },
]

function OrderReceipt({ order }: { order: Order }) {
  const [receiptDate, setReceiptDate] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setReceiptDate(new Date());
  }, []);

  return (
    <div className="p-6 bg-white text-black font-sans">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold font-serif">RestoTrack</h2>
        <p className="text-sm">123 Culinary Lane, Foodie City</p>
        <p className="text-sm">Receipt for Order #{order.id}</p>
      </div>
      <div className="mb-4">
        <p><span className="font-semibold">Table:</span> {order.tableId}</p>
        <p><span className="font-semibold">Date:</span> {receiptDate ? receiptDate.toLocaleString() : '...'}</p>
      </div>
      <div className="border-t border-b border-gray-300 py-2 mb-4">
        <div className="flex justify-between font-semibold">
          <span>Item</span>
          <span className="text-right">Total</span>
        </div>
        {order.items.map((item, index) => (
          <div key={index} className="flex justify-between my-1">
            <span>{item.quantity}x {item.name}</span>
            <span className="text-right">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between font-bold text-lg">
        <span>Total</span>
        <span className="text-right">${order.total.toFixed(2)}</span>
      </div>
      <div className="text-center mt-8 text-sm">
        <p>Thank you for dining with us!</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [orders, setOrders] = React.useState<Order[]>(initialOrders)
  const [salesData, setSalesData] = React.useState(initialSalesData);
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null)
  const [isDialogOpen, setDialogOpen] = React.useState(false)
  const [printableOrder, setPrintableOrder] = React.useState<Order | null>(null);
  const { toast } = useToast()

  React.useEffect(() => {
    setSalesData(
      initialSalesData.map(d => ({...d, total: Math.floor(Math.random() * 5000) + 1000}))
    )
  }, [])

  const handleOpenDialog = (order: Order) => {
    setSelectedOrder(order)
    setDialogOpen(true)
  }

  const handleCompleteOrder = (orderId: string) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status: "Completed" } : order
      )
    )
    toast({
      title: "Order Completed",
      description: `Order #${orderId} has been marked as complete.`,
    })
    setDialogOpen(false)
  }

  const handlePrint = (order: Order) => {
    setPrintableOrder(order);
    setTimeout(() => {
      window.print();
      setPrintableOrder(null);
    }, 100);
  };
  
  const renderOrderRow = (order: Order) => (
    <TableRow key={order.id} className="cursor-pointer" onClick={() => handleOpenDialog(order)}>
      <TableCell className="font-medium">#{order.id}</TableCell>
      <TableCell>{order.tableId}</TableCell>
      <TableCell>
        {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
      </TableCell>
      <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
      <TableCell>
        <Badge variant={order.status === 'Completed' ? 'secondary' : order.status === 'In Progress' ? 'default' : 'outline'}>
          {order.status}
        </Badge>
      </TableCell>
      <TableCell>
        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenDialog(order); }}>
          View
        </Button>
      </TableCell>
    </TableRow>
  )

  const kitchenOrders = orders.filter(o => o.items.some(i => i.department === 'Kitchen' && o.status !== 'Completed'))
  const barOrders = orders.filter(o => o.items.some(i => i.department === 'Bar' && o.status !== 'Completed'))
  const allOrders = orders
  
  const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
  const completedOrders = orders.filter(order => order.status === 'Completed').length;
  const pendingOrders = orders.filter(order => order.status !== 'Completed').length;

  return (
    <>
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-headline font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and track all restaurant orders in real-time.
          </p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{completedOrders}</div>
            <p className="text-xs text-muted-foreground">+180.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">+19% from last month</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">+201 since last hour</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
           <CardHeader>
            <CardTitle>Overview</CardTitle>
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
                  tickFormatter={(value) => `$${value}`}
                />
                <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>
              You made {completedOrders} sales this month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* You can map through recent orders here */}
            <div className="text-center text-muted-foreground py-8">
                No recent sales to display.
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="kitchen">Kitchen</TabsTrigger>
          <TabsTrigger value="bar">Bar</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Active & Completed Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allOrders.length > 0 ? allOrders.map(renderOrderRow) : <TableRow><TableCell colSpan={6} className="text-center">No orders found.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="kitchen">
           <Card>
            <CardHeader>
              <CardTitle>Active Kitchen Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kitchenOrders.length > 0 ? kitchenOrders.map(renderOrderRow) : <TableRow><TableCell colSpan={6} className="text-center">No active kitchen orders.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="bar">
            <Card>
            <CardHeader>
              <CardTitle>Active Bar Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {barOrders.length > 0 ? barOrders.map(renderOrderRow) : <TableRow><TableCell colSpan={6} className="text-center">No active bar orders.</TableCell></TableRow>}
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
            <DialogTitle className="font-headline">Order #{selectedOrder.id}</DialogTitle>
            <DialogDescription>
              Table: {selectedOrder.tableId} - Status: {selectedOrder.status}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedOrder.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span>{item.quantity} x {item.name}</span>
                <span className="font-mono">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-4 mt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${selectedOrder.total.toFixed(2)}</span>
            </div>
          </div>
          <DialogFooter>
             <Button variant="ghost" onClick={() => handlePrint(selectedOrder)}>
              <Printer className="mr-2 h-4 w-4" /> Print Receipt
            </Button>
            {selectedOrder.status !== 'Completed' && (
              <Button onClick={() => handleCompleteOrder(selectedOrder.id)}>
                <CheckCircle className="mr-2 h-4 w-4" /> Mark as Complete
              </Button>
            )}
            <DialogClose asChild>
                <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )}
    
    {printableOrder && <div className="printable-area"><OrderReceipt order={printableOrder} /></div>}
    </>
  )
}
