
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
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function WaiterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [comandaId, setComandaId] = React.useState("")
  const [tableId, setTableId] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleStartOrder = async () => {
    if (!comandaId) {
      toast({
        variant: "destructive",
        title: "Campo Obrigatório",
        description: "Por favor, insira o número da comanda/pulseira.",
      })
      return
    }
     if (!tableId) {
        toast({
          variant: "destructive",
          title: "Campo Obrigatório",
          description: "Por favor, insira o número da mesa.",
        })
        return
      }

    setIsSubmitting(true);
    
    // Check if the comandaId exists in the customers collection
    const customersRef = collection(db, "customers");
    const q = query(customersRef, where("wristbandId", "==", parseInt(comandaId, 10)));
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

    // Redirect to the order page, passing comandaId as a param and tableId as a query param
    router.push(`/dashboard/tables/${comandaId}?tableId=${tableId}`)
  }

  return (
    <div className="flex justify-center items-center h-full">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline">Iniciar Novo Pedido</CardTitle>
          <CardDescription>
            Insira o número da comanda/pulseira do cliente e a mesa.
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
            <Label htmlFor="tableId" className="text-base">Mesa</Label>
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
          <Button onClick={handleStartOrder} className="w-full h-12 text-lg" disabled={isSubmitting}>
            {isSubmitting ? 'Verificando...' : 'Lançar Itens'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
