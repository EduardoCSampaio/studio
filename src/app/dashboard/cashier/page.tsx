
"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { type Order, type Customer } from "@/lib/data"
import { collection, query, where, getDocs, writeBatch, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function CashierPage() {
  const { toast } = useToast()
  const [comandaId, setComandaId] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [customer, setCustomer] = React.useState<Customer | null>(null)
  const [orders, setOrders] = React.useState<Order[]>([])
  const [isClosing, setIsClosing] = React.useState(false)

  const handleSearchComanda = async () => {
    if (!comandaId) {
      toast({
        variant: "destructive",
        title: "Campo Obrigatório",
        description: "Por favor, insira o número da comanda/pulseira.",
      })
      return
    }

    setIsLoading(true)
    setCustomer(null)
    setOrders([])

    try {
      // Find customer
      const customersRef = collection(db, "customers")
      const qCustomer = query(customersRef, where("wristbandId", "==", parseInt(comandaId, 10)))
      const customerSnapshot = await getDocs(qCustomer)

      if (customerSnapshot.empty) {
        toast({
          variant: "destructive",
          title: "Comanda não encontrada",
          description: `Nenhum cliente encontrado com a comanda #${comandaId}.`,
        })
        setIsLoading(false)
        return
      }
      const customerData = { id: customerSnapshot.docs[0].id, ...customerSnapshot.docs[0].data() } as Customer
      setCustomer(customerData)

      // Find all orders for that comanda
      const ordersRef = collection(db, "orders")
      const qOrders = query(ordersRef, where("comandaId", "==", comandaId))
      const ordersSnapshot = await getDocs(qOrders)
      
      const allOrdersForComanda = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[]
      const pendingOrders = allOrdersForComanda.filter(order => order.status !== "Completed");

      if (pendingOrders.length === 0) {
        toast({
          title: "Nenhum pedido pendente",
          description: `O cliente ${customerData.name} não possui pedidos pendentes para fechar.`,
        })
        // Still show customer info, but with no orders
        setOrders([]);
        setIsLoading(false)
        return
      }

      setOrders(pendingOrders)

    } catch (error) {
      console.error("Error searching comanda: ", error)
      toast({
        variant: "destructive",
        title: "Erro na busca",
        description: "Ocorreu um erro ao buscar os dados da comanda.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseComanda = async () => {
    if (!orders.length) return;

    setIsLoading(true);
    const batch = writeBatch(db);

    orders.forEach(order => {
        const orderRef = doc(db, "orders", order.id);
        batch.update(orderRef, { status: "Completed" });
    });

    try {
        await batch.commit();
        toast({
            title: "Comanda Fechada!",
            description: `A comanda #${comandaId} foi fechada com sucesso.`,
        });
        // Reset state after closing
        setComandaId("");
        setCustomer(null);
        setOrders([]);
        setIsClosing(false);
    } catch (error) {
        console.error("Error closing comanda: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao fechar comanda",
            description: "Não foi possível atualizar os pedidos.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  const calculateSubtotal = () => orders.reduce((acc, order) => acc + order.total, 0);
  const subtotal = calculateSubtotal();
  const serviceFee = subtotal * 0.10;
  const total = subtotal + serviceFee;

  const allItems = orders.flatMap(order => order.items);

  return (
    <>
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-headline font-bold text-foreground">Caixa</h1>
        <p className="text-muted-foreground">
          Busque por uma comanda para visualizar os pedidos e fechar a conta.
        </p>
      </div>

      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Buscar Comanda</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <div className="flex-grow space-y-2">
            <Label htmlFor="comandaId">Número da Comanda/Pulseira</Label>
            <Input
              id="comandaId"
              type="number"
              value={comandaId}
              onChange={(e) => setComandaId(e.target.value)}
              placeholder="Ex: 101"
              disabled={isLoading}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchComanda()}
            />
          </div>
          <Button onClick={handleSearchComanda} disabled={isLoading} className="self-end">
            {isLoading ? "Buscando..." : "Buscar"}
          </Button>
        </CardContent>
      </Card>

      {customer && (
        <Card>
          <CardHeader>
            <CardTitle>Comanda #{comandaId} - {customer.name}</CardTitle>
            <CardDescription>
              CPF: {customer.cpf} | Check-in: {new Date(customer.checkIn).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length > 0 ? (
                <>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Qtd.</TableHead>
                            <TableHead className="text-right">Preço Unit.</TableHead>
                            <TableHead className="text-right">Total Item</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allItems.map((item, index) => (
                             <TableRow key={`${item.productId}-${index}`}>
                                <TableCell>{item.name}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell className="text-right">R$ {item.price.toFixed(2)}</TableCell>
                                <TableCell className="text-right">R$ {(item.price * item.quantity).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
                 <div className="mt-6 pr-4 flex flex-col items-end space-y-2">
                    <div className="text-lg">Subtotal: <span className="font-bold">R$ {subtotal.toFixed(2)}</span></div>
                    <div className="text-muted-foreground">Taxa de Serviço (10%): R$ {serviceFee.toFixed(2)}</div>
                    <div className="text-2xl font-bold">Total: R$ {total.toFixed(2)}</div>
                 </div>
                </>
            ) : (
                <div className="text-center py-8 text-muted-foreground">
                    Este cliente não possui pedidos pendentes de pagamento.
                </div>
            )}
          </CardContent>
          {orders.length > 0 && (
             <CardFooter className="justify-end">
                <Button onClick={() => setIsClosing(true)} disabled={isLoading}>
                    Fechar Comanda
                </Button>
             </CardFooter>
          )}
        </Card>
      )}
    </div>

    <Dialog open={isClosing} onOpenChange={setIsClosing}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Confirmar Fechamento</DialogTitle>
                <DialogDescription>
                    Você está prestes a fechar a comanda #{comandaId} para {customer?.name}.
                    O valor total é de R$ {total.toFixed(2)} (incluindo 10% de serviço).
                    Esta ação não pode ser desfeita.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline" disabled={isLoading}>Cancelar</Button>
                </DialogClose>
                <Button onClick={handleCloseComanda} disabled={isLoading}>
                    {isLoading ? "Finalizando..." : "Confirmar e Finalizar Venda"}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  )
}
