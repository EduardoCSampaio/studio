
"use client"

import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { tables } from "@/lib/data"

export default function TablesPage() {
  const getStatusVariant = (status: 'Available' | 'Occupied' | 'Reserved'): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'Available':
        return 'secondary'
      case 'Occupied':
        return 'default'
      case 'Reserved':
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
                  {table.status === 'Occupied' && (
                    <p className="text-xs text-muted-foreground">
                      Pedido #{table.orderId}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
