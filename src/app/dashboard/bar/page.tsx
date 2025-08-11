
"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { type Order, type OrderItem } from "@/lib/data"
import { collection, onSnapshot, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function BarPage() {
  const [orders, setOrders] = React.useState<Order[]>([])

  React.useEffect(() => {
    const ordersCol = collection(db, 'orders');
    // Query for orders that are not completed and contain at least one bar item.
    // Firestore doesn't support array-contains with OR, so we fetch and filter client-side.
    const q = query(ordersCol, where("status", "!=", "Completed"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const allPendingOrders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Order[];

        const barOrders = allPendingOrders.filter(order => 
            order.items.some(item => item.department === 'Bar')
        );

        setOrders(barOrders);
    });

    return () => unsubscribe();
  }, []);

  const getBarItems = (items: OrderItem[]) => {
    return items
      .filter(item => item.department === 'Bar')
      .map(item => (
        <span key={item.productId} className={item.status === 'Cancelled' ? 'line-through text-muted-foreground' : ''}>
          {item.quantity}x {item.name}
        </span>
      ))
      .reduce((prev, curr) => [prev, ', ', curr] as any)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-headline font-bold text-foreground">Pedidos do Bar</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie os pedidos de bebidas pendentes.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Pedidos Pendentes</CardTitle>
          <CardDescription>
            Lista de todos os pedidos de bebidas que precisam ser preparados. Itens cancelados são riscados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comanda</TableHead>
                <TableHead>Mesa</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Garçom</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Nenhum pedido pendente no momento.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.comandaId}</TableCell>
                    <TableCell>{order.tableId || 'N/A'}</TableCell>
                    <TableCell>{getBarItems(order.items)}</TableCell>
                    <TableCell>{order.waiterName}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
