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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { orders as initialOrders, type Order } from "@/lib/data"
import { Printer, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

function OrderReceipt({ order }: { order: Order }) {
  return (
    <div className="p-6 bg-white text-black font-sans">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold font-serif">RestoTrack</h2>
        <p className="text-sm">123 Culinary Lane, Foodie City</p>
        <p className="text-sm">Receipt for Order #{order.id}</p>
      </div>
      <div className="mb-4">
        <p><span className="font-semibold">Table:</span> {order.tableId}</p>
        <p><span className="font-semibold">Date:</span> {new Date().toLocaleString()}</p>
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
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null)
  const [isDialogOpen, setDialogOpen] = React.useState(false)
  const [printableOrder, setPrintableOrder] = React.useState<Order | null>(null);
  const { toast } = useToast()

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

  return (
    <>
    <div className="space-y-6">
      <h1 className="text-4xl font-headline font-bold text-foreground">Dashboard</h1>
      <p className="text-muted-foreground">
        Manage and track all restaurant orders in real-time.
      </p>

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
