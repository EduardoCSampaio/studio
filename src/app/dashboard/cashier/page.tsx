
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
import { type Order, type Customer, type OrderItem } from "@/lib/data"
import { collection, query, where, getDocs, writeBatch, doc, updateDoc, collectionGroup } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { XCircle } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

type ItemWithOrderId = OrderItem & { 
    orderId: string;
    originalIndex: number;
};


export default function CashierPage() {
  const { toast } = useToast()
  const [comandaId, setComandaId] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [customer, setCustomer] = React.useState<Customer | null>(null)
  const [orders, setOrders] = React.useState<Order[]>([])
  const [isClosing, setIsClosing] = React.useState(false)
  const [itemToCancel, setItemToCancel] = React.useState<ItemWithOrderId | null>(null)
  const [cancelQuantity, setCancelQuantity] = React.useState("1")
  const [paymentMethod, setPaymentMethod] = React.useState<"dinheiro" | "credito" | "debito">("credito");

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

      let customerData: Customer | null = null;
      if (!customerSnapshot.empty) {
        customerData = { id: customerSnapshot.docs[0].id, ...customerSnapshot.docs[0].data() } as Customer
        setCustomer(customerData)
      }
      
      // Find all orders for that comanda
      const ordersRef = collection(db, "orders")
      const qOrders = query(ordersRef, where("comandaId", "==", comandaId))
      const ordersSnapshot = await getDocs(qOrders)
      
      const allOrdersForComanda = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[]
      const pendingOrders = allOrdersForComanda.filter(order => order.status !== "Completed");

      if (pendingOrders.length === 0) {
        const message = customerData 
            ? `O cliente ${customerData.name} não possui pedidos pendentes para fechar.`
            : `A comanda #${comandaId} não possui pedidos pendentes ou não foi encontrada.`
        toast({
          title: "Nenhum pedido pendente",
          description: message,
        })
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
        batch.update(orderRef, { 
            status: "Completed", 
            paymentMethod: paymentMethod 
        });
    });

    try {
        await batch.commit();
        toast({
            title: "Conta Fechada!",
            description: `A conta da comanda #${comandaId} foi fechada com sucesso.`,
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
            title: "Erro ao fechar conta",
            description: "Não foi possível atualizar os pedidos.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  const openCancelDialog = (item: ItemWithOrderId) => {
      if (item.status === 'Cancelled') return;
      setItemToCancel(item);
      setCancelQuantity("1");
  }

  const handleConfirmCancelItem = async () => {
    if (!itemToCancel) return;
    
    const { orderId, originalIndex, quantity: originalQuantity } = itemToCancel;
    const quantityToCancel = parseInt(cancelQuantity, 10);

    if (isNaN(quantityToCancel) || quantityToCancel <= 0 || quantityToCancel > originalQuantity) {
        toast({
            variant: "destructive",
            title: "Quantidade Inválida",
            description: `Por favor, insira um número entre 1 e ${originalQuantity}.`,
        });
        return;
    }

    setIsLoading(true);
    try {
        const orderToUpdate = orders.find(o => o.id === orderId);
        if (!orderToUpdate) {
            throw new Error("Pedido não encontrado no estado local.");
        }

        let updatedItems: OrderItem[];

        if (quantityToCancel === originalQuantity) {
            // Cancel the entire item line
            updatedItems = orderToUpdate.items.map((item, index) => {
                if (index === originalIndex) {
                    return { ...item, status: 'Cancelled' as const };
                }
                return item;
            });
        } else {
            // Split the item
            updatedItems = [...orderToUpdate.items]; // Create a copy
            const originalItem = updatedItems[originalIndex];
            
            // Reduce quantity of the original item
            originalItem.quantity = originalQuantity - quantityToCancel;

            // Add a new item for the cancelled portion
            const cancelledItem: OrderItem = {
                ...originalItem,
                quantity: quantityToCancel,
                status: 'Cancelled',
            };
            updatedItems.push(cancelledItem);
        }

        const subtotal = updatedItems
            .filter(item => item.status !== 'Cancelled')
            .reduce((acc, item) => acc + (item.price * item.quantity), 0);
        
        const serviceFee = subtotal * 0.10;
        const updatedTotal = subtotal + serviceFee;
        
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, {
            items: updatedItems,
            total: updatedTotal,
        });

        // Update local state to reflect the change immediately
        setOrders(prevOrders => prevOrders.map(order => 
            order.id === orderId 
                ? { ...order, items: updatedItems, total: updatedTotal } 
                : order
        ));

        toast({
            title: "Item(s) Cancelado(s)",
            description: `${quantityToCancel}x ${itemToCancel.name} foi(foram) marcado(s) como cancelado(s).`,
        });

    } catch (error) {
        console.error("Error cancelling item:", error);
        toast({
            variant: "destructive",
            title: "Erro ao Cancelar",
            description: "Não foi possível atualizar o item do pedido.",
        });
    } finally {
        setIsLoading(false);
        setItemToCancel(null);
        setCancelQuantity("1");
    }
  };


  const calculateSubtotal = () => 
    orders.reduce((acc, order) => {
        const orderSubtotal = order.items
            .filter(item => item.status !== 'Cancelled')
            .reduce((orderAcc, item) => orderAcc + (item.price * item.quantity), 0);
        return acc + orderSubtotal;
    }, 0);

  const subtotal = calculateSubtotal();
  const serviceFee = subtotal * 0.10;
  const total = subtotal + serviceFee;

  const allItems: ItemWithOrderId[] = orders.flatMap(order => 
    order.items.map((item, index) => ({ 
        ...item, 
        orderId: order.id,
        originalIndex: index,
    }))
  );


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

      {(customer || orders.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Conta da Comanda #{comandaId} {customer && `- ${customer.name}`}</CardTitle>
            {customer && (
                <CardDescription>
                CPF: {customer.cpf} | Check-in: {new Date(customer.checkIn).toLocaleString()}
                </CardDescription>
            )}
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
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allItems.map((item, index) => (
                             <TableRow key={`${item.orderId}-${item.productId}-${index}`} className={item.status === 'Cancelled' ? 'text-muted-foreground' : ''}>
                                <TableCell className={item.status === 'Cancelled' ? 'line-through' : ''}>{item.name}</TableCell>
                                <TableCell className={item.status === 'Cancelled' ? 'line-through' : ''}>{item.quantity}</TableCell>
                                <TableCell className={`text-right ${item.status === 'Cancelled' ? 'line-through' : ''}`}>R$ {item.price.toFixed(2)}</TableCell>
                                <TableCell className={`text-right ${item.status === 'Cancelled' ? 'line-through' : ''}`}>R$ {(item.price * item.quantity).toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => openCancelDialog(item)} 
                                        disabled={isLoading || item.status === 'Cancelled'}
                                    >
                                        <XCircle className="h-4 w-4 text-destructive" />
                                        <span className="sr-only">Cancelar item</span>
                                    </Button>
                                </TableCell>
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
                    Fechar Conta
                </Button>
             </CardFooter>
          )}
        </Card>
      )}
    </div>

    <Dialog open={isClosing} onOpenChange={setIsClosing}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Confirmar Fechamento da Conta</DialogTitle>
                <DialogDescription>
                    Você está prestes a fechar a conta da comanda #{comandaId} para {customer?.name}.
                    O valor total é de R$ {total.toFixed(2)}. Esta ação finalizará a venda.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <Label>Método de Pagamento</Label>
                <RadioGroup 
                    defaultValue="credito" 
                    className="flex gap-4"
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value as any)}
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dinheiro" id="r-dinheiro" />
                        <Label htmlFor="r-dinheiro">Dinheiro</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="credito" id="r-credito" />
                        <Label htmlFor="r-credito">Crédito</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <RadioGroupItem value="debito" id="r-debito" />
                        <Label htmlFor="r-debito">Débito</Label>
                    </div>
                </RadioGroup>
            </div>
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

    <Dialog open={!!itemToCancel} onOpenChange={(isOpen) => !isOpen && setItemToCancel(null)}>
        <DialogContent>
             <DialogHeader>
                <DialogTitle>Cancelar Item</DialogTitle>
                <DialogDescription>
                    Quantas unidades de <span className="font-bold">{itemToCancel?.name}</span> (de um total de {itemToCancel?.quantity}) você deseja cancelar?
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                 <Label htmlFor="cancel-quantity">Quantidade a Cancelar</Label>
                 <Input
                    id="cancel-quantity"
                    type="number"
                    value={cancelQuantity}
                    onChange={(e) => setCancelQuantity(e.target.value)}
                    min="1"
                    max={itemToCancel?.quantity}
                    placeholder="Ex: 1"
                 />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline" disabled={isLoading}>Voltar</Button>
                </DialogClose>
                <Button onClick={handleConfirmCancelItem} disabled={isLoading} variant="destructive">
                    {isLoading ? "Cancelando..." : "Confirmar Cancelamento"}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  )
}

    