
"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { type Order, type Customer, type DailyClosing, type OrderItem } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { collection, query, where, Timestamp, getDocs, addDoc, onSnapshot, orderBy, serverTimestamp, doc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { BookCheck, FileText, Users, DollarSign, XCircle, AlertTriangle, RotateCcw, CreditCard, Banknote } from "lucide-react"

export default function ReportsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [closings, setClosings] = React.useState<DailyClosing[]>([])
  const [isClosing, setIsClosing] = React.useState(false)
  const [isConfirming, setConfirming] = React.useState(false)
  const [isReopening, setReopening] = React.useState(false)
  const [isClosedToday, setClosedToday] = React.useState(false)
  const [lastClosing, setLastClosing] = React.useState<DailyClosing | null>(null)

  React.useEffect(() => {
    const closingsQuery = query(collection(db, "dailyClosings"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(closingsQuery, (snapshot) => {
        const closingsList = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: (data.date as Timestamp).toDate(),
                closedAt: data.closedAt ? (data.closedAt as Timestamp).toDate() : new Date(),
            } as DailyClosing;
        });
        setClosings(closingsList);

        if (closingsList.length > 0) {
            const last = closingsList[0];
            const today = new Date();
            const lastClosingDate = last.date;
            
            const isSameDay = today.getFullYear() === lastClosingDate.getFullYear() &&
                              today.getMonth() === lastClosingDate.getMonth() &&
                              today.getDate() === lastClosingDate.getDate();
            
            setClosedToday(isSameDay);
            setLastClosing(last);
        } else {
            setClosedToday(false);
            setLastClosing(null);
        }
    });

    return () => unsubscribe();
  }, []);

  const handleClosingProcess = async () => {
    if (!user) {
        toast({ variant: "destructive", title: "Usuário não autenticado." });
        return;
    }
    
    setIsClosing(true);

    try {
        // --- 1. Fetch data for today ---
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        
        const startOfDayTimestamp = Timestamp.fromDate(startOfDay);
        const endOfDayTimestamp = Timestamp.fromDate(endOfDay);

        // Fetch all orders to find cancelled items and completed ones
        const allOrdersQuery = query(collection(db, "orders"), 
             where("createdAt", ">=", startOfDayTimestamp),
             where("createdAt", "<=", endOfDayTimestamp)
        );
        const allOrdersSnapshot = await getDocs(allOrdersQuery);
        const allOrders = allOrdersSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Order);
        
        const completedOrders = allOrders.filter(order => order.status === "Completed");

        // Fetch customers
        const customersQuery = query(collection(db, "customers"), 
            where("checkIn", ">=", startOfDayTimestamp),
            where("checkIn", "<=", endOfDayTimestamp)
        );
        const customersSnapshot = await getDocs(customersQuery);
        const totalCustomers = customersSnapshot.size;

        // --- 2. Calculate metrics ---
        const totalRevenue = completedOrders.reduce((acc, order) => acc + order.total, 0);
        const serviceFeePercentage = 0.10; // 10%
        const subtotalOfCompleted = completedOrders.reduce((acc, order) => acc + (order.total / (1 + serviceFeePercentage)), 0);
        const totalServiceFee = totalRevenue - subtotalOfCompleted;

        const totalDinheiro = completedOrders.filter(o => o.paymentMethod === 'dinheiro').reduce((acc, order) => acc + order.total, 0);
        const totalCredito = completedOrders.filter(o => o.paymentMethod === 'credito').reduce((acc, order) => acc + order.total, 0);
        const totalDebito = completedOrders.filter(o => o.paymentMethod === 'debito').reduce((acc, order) => acc + order.total, 0);

        const cancelledItems = allOrders.flatMap(order => order.items.filter(item => item.status === "Cancelled")) as OrderItem[];
        const totalCancelledValue = cancelledItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        // --- 3. Create closing document ---
        const closingDoc: Omit<DailyClosing, 'id' | 'closedAt'> = {
            date: startOfDayTimestamp,
            closedByUserId: user.id,
            closedByUserName: user.name,
            totalRevenue: totalRevenue,
            totalDinheiro,
            totalCredito,
            totalDebito,
            totalServiceFee: totalServiceFee,
            totalCustomers: totalCustomers,
            totalCompletedOrders: completedOrders.length,
            cancelledItems: cancelledItems,
            totalCancelledValue: totalCancelledValue,
        };

        await addDoc(collection(db, "dailyClosings"), {
            ...closingDoc,
            closedAt: serverTimestamp()
        });
        
        toast({
            title: "Caixa Fechado com Sucesso!",
            description: `O relatório para ${format(today, "dd/MM/yyyy")} foi gerado.`,
        });

    } catch (error) {
        console.error("Error during closing process: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao Fechar o Caixa",
            description: "Ocorreu um problema ao gerar o relatório do dia.",
        })
    } finally {
        setIsClosing(false);
        setConfirming(false);
    }
  }

  const handleReopenCashier = async () => {
    if (!lastClosing) return;

    setIsClosing(true);
    try {
        await deleteDoc(doc(db, "dailyClosings", lastClosing.id));
        toast({
            title: "Caixa Reaberto!",
            description: "O relatório de fechamento de hoje foi excluído."
        });
    } catch (error) {
        console.error("Error reopening cashier:", error);
        toast({
            variant: "destructive",
            title: "Erro ao Reabrir Caixa",
            description: "Não foi possível excluir o relatório de fechamento."
        });
    } finally {
        setIsClosing(false);
        setReopening(false);
    }
  }


  return (
    <>
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-headline font-bold text-foreground">Relatórios de Fechamento</h1>
          <p className="text-muted-foreground">
            Visualize o histórico de fechamentos de caixa ou realize o fechamento do dia.
          </p>
        </div>
        <div className="flex gap-2">
            {isClosedToday && user?.role === 'Chefe' && (
                 <Button onClick={() => setReopening(true)} disabled={isClosing} variant="destructive">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reabrir Caixa do Dia
                </Button>
            )}
            <Button onClick={() => setConfirming(true)} disabled={isClosing || isClosedToday}>
                <BookCheck className="mr-2 h-4 w-4" />
                {isClosedToday ? 'Dia Já Fechado' : 'Realizar Fechamento do Dia'}
            </Button>
        </div>
      </div>

      {isClosedToday && lastClosing && (
        <Alert variant="default">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Fechamento de Hoje Já Realizado</AlertTitle>
            <AlertDescription>
                O caixa de hoje foi fechado por {lastClosing.closedByUserName} às {format(lastClosing.closedAt, 'HH:mm:ss')}.
                Um novo fechamento só poderá ser realizado amanhã.
            </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Fechamentos</CardTitle>
          <CardDescription>
            Uma lista de todos os relatórios diários gerados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Faturamento</TableHead>
                <TableHead>Clientes</TableHead>
                <TableHead>Pedidos Pagos</TableHead>
                <TableHead>Fechado por</TableHead>
                <TableHead>Horário Fechamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {closings.map((closing) => (
                <TableRow key={closing.id}>
                   <TableCell className="font-medium">{format(closing.date, 'dd/MM/yyyy')}</TableCell>
                   <TableCell>R$ {closing.totalRevenue.toFixed(2)}</TableCell>
                   <TableCell>{closing.totalCustomers}</TableCell>
                   <TableCell>{closing.totalCompletedOrders}</TableCell>
                   <TableCell>{closing.closedByUserName}</TableCell>
                   <TableCell>{format(closing.closedAt, 'HH:mm:ss')}</TableCell>
                </TableRow>
              ))}
               {closings.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">
                          Nenhum fechamento de caixa realizado ainda.
                      </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {closings.length > 0 && (
          <Card>
            <CardHeader>
                 <CardTitle className="flex items-center gap-2"><FileText /> Último Relatório Detalhado</CardTitle>
                 <CardDescription>
                     Detalhes do último fechamento realizado em {format(closings[0].date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.
                 </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {closings[0].totalRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">+ R$ {closings[0].totalServiceFee.toFixed(2)} de serviço</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clientes Atendidos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{closings[0].totalCustomers}</div>
                        <p className="text-xs text-muted-foreground">Total de check-ins no dia</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Itens Cancelados</CardTitle>
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{closings[0].cancelledItems.length}</div>
                        <p className="text-xs text-muted-foreground">Prejuízo de R$ {closings[0].totalCancelledValue.toFixed(2)}</p>
                    </CardContent>
                </Card>
                <div className="col-span-full grid md:grid-cols-3 gap-6">
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total em Dinheiro</CardTitle>
                            <Banknote className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">R$ {(closings[0].totalDinheiro || 0).toFixed(2)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total em Crédito</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">R$ {(closings[0].totalCredito || 0).toFixed(2)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total em Débito</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">R$ {(closings[0].totalDebito || 0).toFixed(2)}</div>
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
             {closings[0].cancelledItems.length > 0 && (
                <CardFooter className="flex-col items-start">
                    <h4 className="font-semibold mb-2">Lista de Itens Cancelados</h4>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Qtd.</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {closings[0].cancelledItems.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell className="text-right">R$ {(item.price * item.quantity).toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                     </Table>
                </CardFooter>
             )}
          </Card>
      )}
    </div>

     {/* Closing Confirmation Dialog */}
      <Dialog open={isConfirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Fechamento de Caixa</DialogTitle>
            <DialogDescription>
                Você está prestes a realizar o fechamento do caixa para o dia de hoje,{' '}
                <span className="font-bold">{format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>.
                Esta ação irá consolidar todas as vendas e gerar um relatório final para o dia.
                <br /><br />
                <span className="font-semibold text-destructive">Esta ação não pode ser desfeita, a menos que você seja um Chefe.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isClosing}>Cancelar</Button>
            </DialogClose>
            <Button onClick={handleClosingProcess} disabled={isClosing}>
              {isClosing ? "Processando..." : "Confirmar e Fechar o Dia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    {/* Reopening Confirmation Dialog */}
      <Dialog open={isReopening} onOpenChange={setReopening}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Reabertura de Caixa</DialogTitle>
            <DialogDescription>
                Você está prestes a <span className="font-bold">excluir o relatório de fechamento</span> do dia de hoje.
                Isso irá reabrir o caixa, permitindo que novas vendas sejam registradas e um novo fechamento seja feito mais tarde.
                <br /><br />
                <span className="font-semibold text-destructive">Esta ação não pode ser desfeita.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isClosing}>Cancelar</Button>
            </DialogClose>
            <Button onClick={handleReopenCashier} disabled={isClosing} variant="destructive">
              {isClosing ? "Excluindo..." : "Confirmar e Reabrir Caixa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

    

    