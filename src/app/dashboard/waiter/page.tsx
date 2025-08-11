
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

export default function WaiterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [comandaId, setComandaId] = React.useState("")
  const [tableId, setTableId] = React.useState("")

  const handleStartOrder = () => {
    if (!comandaId) {
      toast({
        variant: "destructive",
        title: "Campo Obrigatório",
        description: "Por favor, insira o número da comanda/pulseira.",
      })
      return
    }
    // A mesa pode ser opcional, dependendo da regra de negócio
    if (!tableId) {
        toast({
          variant: "destructive",
          title: "Campo Obrigatório",
          description: "Por favor, insira o número da mesa.",
        })
        return
      }

    // Redireciona para a página de lançamento de pedido,
    // passando a comanda e a mesa como parâmetros (a ser implementado)
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
            />
          </div>
          <Button onClick={handleStartOrder} className="w-full h-12 text-lg">
            Lançar Itens
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
