
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

export default function BarPage() {
  // In a future step, we will fetch real-time orders from Firestore here.
  const orders = []

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
            Lista de todos os pedidos de bebidas que precisam ser preparados.
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
                // This part will be populated with data from Firestore later
                <></>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
