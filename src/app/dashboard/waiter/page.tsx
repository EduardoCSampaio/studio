
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { type Table } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"

export default function WaiterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { getChefeId } = useAuth()
  const [comandaId, setComandaId] = React.useState("")
  const [tableId, setTableId] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [tables, setTables] = React.useState<Table[]>([]);

  React.useEffect(() => {
    const chefeId = getChefeId();
    if (!chefeId) return;

    const tablesCol = query(
        collection(db, 'tables'), 
        where("chefeId", "==", chefeId)
    );
    const unsubscribe = onSnapshot(tablesCol, (snapshot) => {
        const tableList = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: data.id,
                status: data.status,
                orderId: data.orderId,
            } as Table;
        });
        setTables(tableList.sort((a, b) => a.id - b.id));
    });

    return () => unsubscribe();
  }, [getChefeId])

  const handleStartOrder = async () => {
    const chefeId = getChefeId();
    if (!comandaId || !tableId) {
      toast({
        variant: "destructive",
        title: "Campos Obrigatórios",
        description: "Por favor, insira a comanda e o número da mesa.",
      })
      return
    }

    setIsSubmitting(true);
    
    const customersRef = collection(db, "customers");
    const q = query(
        customersRef, 
        where("wristbandId", "==", parseInt(comandaId, 10)),
        where("chefeId", "==", chefeId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        toast({
            variant: "destructive",
            title: "Comanda não encontrada",
            description: `A comanda/pulseira #${comandaId} não foi encontrada. Verifique o número ou cadastre o cliente.`,
        });
        setIsSubmitting(false);
        return;
    }

    router.push(`/dashboard/tables/${comandaId}?tableId=${tableId}`)
  }

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
    <div className="flex flex-col lg:flex-row gap-8 h-full items-start">
      <div className="w-full lg:max-w-md lg:sticky lg:top-8">
         <Card>
            <CardHeader>
            <CardTitle className="text-2xl font-bold font-headline">Iniciar Novo Pedido</CardTitle>
            <CardDescription>
                Insira a comanda e a mesa para começar.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="comandaId" className="text-base">Comanda / Pulseira</Label>
                <Input
                id="comandaId"
                type="number"
                value={comandaId}
                onChange={(e) => setComandaId(e.target.value)}
                placeholder="Ex: 101"
                className="h-12 text-lg"
                disabled={isSubmitting}
                />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="tableId" className="text-base">Número da Mesa</Label>
                <Input
                id="tableId"
                type="number"
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
                placeholder="Ex: 15"
                className="h-12 text-lg"
                disabled={isSubmitting}
                />
            </div>
            
            <Button onClick={handleStartOrder} className="w-full h-12 text-lg" disabled={isSubmitting || !comandaId || !tableId}>
                {isSubmitting ? 'Verificando...' : 'Lançar Itens'}
            </Button>
            </CardContent>
        </Card>
      </div>
      <div className="flex-1">
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-headline font-bold text-foreground">Mapa de Mesas</h1>
                <p className="text-muted-foreground">
                    Visualize a ocupação do salão em tempo real.
                </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {tables.map((table) => (
                    <Card key={table.id} className="cursor-default">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                            Mesa {table.id}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-headline">{table.id}</div>
                            <div className="flex justify-between items-center mt-2">
                                <Badge variant={getStatusVariant(table.status)}>{table.status}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {tables.length === 0 && (
                    <Card className="col-span-full">
                        <CardContent className="flex items-center justify-center h-32">
                            <p className="text-muted-foreground">Nenhuma mesa encontrada.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}
