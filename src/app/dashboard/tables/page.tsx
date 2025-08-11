
"use client"

import * as React from "react";
import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type Table } from "@/lib/data"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function TablesPage() {
  const [tables, setTables] = React.useState<Table[]>([]);

  React.useEffect(() => {
    const tablesCol = query(collection(db, 'tables'), orderBy('id'));
    const unsubscribe = onSnapshot(tablesCol, (snapshot) => {
        const tableList = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: data.id,
                status: data.status,
                orderId: data.orderId,
            } as Table;
        });
        setTables(tableList);
    });

    return () => unsubscribe();
  }, [])

  const getStatusVariant = (status: 'Disponível' | 'Ocupada' | 'Reservada'): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'Disponível':
        return 'secondary'
      case 'Ocupada':
        return 'default'
      case 'Reservada':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
       <div>
          <h1 className="text-4xl font-headline font-bold text-foreground">Gerenciamento de Mesas</h1>
          <p className="text-muted-foreground">
            Visualize o status e a ocupação de todas as mesas.
          </p>
        </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {tables.map((table) => (
          <Link href={`/dashboard/tables/${table.id}`} key={table.id}>
            <Card className="hover:border-primary transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Mesa {table.id}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-headline">{table.id}</div>
                <div className="flex justify-between items-center mt-2">
                  <Badge variant={getStatusVariant(table.status)}>{table.status}</Badge>
                  {table.status === 'Ocupada' && (
                    <p className="text-xs text-muted-foreground">
                      Comanda #{table.orderId}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
         {tables.length === 0 && (
            <Card className="col-span-full">
                 <CardContent className="flex items-center justify-center h-32">
                    <p className="text-muted-foreground">Nenhuma mesa encontrada. Adicione mesas no console do Firebase.</p>
                 </CardContent>
            </Card>
        )}
      </div>
    </div>
  )
}
