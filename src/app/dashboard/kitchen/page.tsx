
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

export default function KitchenPage() {
  const [orders, setOrders] = React.useState<Order[]>([])

  React.useEffect(() => {
    const ordersCol = collection(db, 'orders');
    // Query for orders that are not completed. We'll filter for kitchen items on the client.
    const q = query(ordersCol, where("status", "!=", "Completed"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const allPendingOrders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Order[];
        
        const kitchenOrders = allPendingOrders.filter(order => 
            order.items.some(item => item.department === 'Cozinha')
        );

        setOrders(kitchenOrders);
    });

    return () => unsubscribe();
  }, []);

  const getKitchenItems = (items: OrderItem[]) => {
    return items
      .filter(item => item.department === 'Cozinha')
      .map(item => `${item.quantity}x ${item.name}`)
      .join(', ');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-headline font-bold text-foreground">Pedidos da Cozinha</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie os pedidos de comida pendentes.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Pedidos na Fila</CardTitle>
          <CardDescription>
            Lista de todos os pedidos que a cozinha precisa preparar.
          </CardDescription>
        </Header>
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
                    Nenhum pedido na fila no momento.
                  </TableCell>
                </TableRow>
              ) : (
                 orders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.comandaId}</TableCell>
                    <TableCell>{order.tableId || 'N/A'}</TableCell>
                    <TableCell>{getKitchenItems(order.items)}</TableCell>
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
