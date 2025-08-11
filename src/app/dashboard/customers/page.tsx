
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
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle } from "lucide-react"
import { type Customer } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { format } from "date-fns"
import { collection, addDoc, onSnapshot, query, where, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Link from "next/link"

export default function CustomersPage() {
  const [customers, setCustomers] = React.useState<Customer[]>([])
  const [isDialogOpen, setDialogOpen] = React.useState(false)
  const [newCustomerName, setNewCustomerName] = React.useState("")
  const [newCustomerCpf, setNewCustomerCpf] = React.useState("")
  const [newCustomerBirthDate, setNewCustomerBirthDate] = React.useState("")
  const [newWristbandId, setNewWristbandId] = React.useState("")
  const { toast } = useToast()
  const { user } = useAuth()

  React.useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);

    const q = query(collection(db, "customers"), where("checkIn", ">=", todayTimestamp));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          checkIn: (doc.data().checkIn as Timestamp).toDate(),
          birthDate: (doc.data().birthDate as Timestamp).toDate(),
      })) as Customer[];
      setCustomers(customersList);
    });

    return () => unsubscribe();
  }, []);

  const handleAddCustomer = async () => {
    if (!newCustomerName || !newWristbandId || !newCustomerCpf || !newCustomerBirthDate) {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar cliente",
        description: "Por favor, preencha todos os campos corretamente.",
      })
      return
    }

    try {
        const dateParts = newCustomerBirthDate.split('/');
        const birthDateObject = new Date(+dateParts[2], parseInt(dateParts[1]) - 1, +dateParts[0]);

        if (isNaN(birthDateObject.getTime())) {
            toast({
                variant: "destructive",
                title: "Data de nascimento inválida",
                description: "Por favor, use o formato DD/MM/AAAA.",
            });
            return;
        }

        const newCustomer: Omit<Customer, 'id'> = {
          name: newCustomerName,
          cpf: newCustomerCpf,
          birthDate: birthDateObject,
          wristbandId: parseInt(newWristbandId, 10),
          checkIn: new Date(),
        }

        await addDoc(collection(db, "customers"), newCustomer)
        
        toast({
          title: "Cliente Adicionado",
          description: `${newCustomer.name} foi cadastrado com a pulseira #${newCustomer.wristbandId}.`,
        })

        setNewCustomerName("")
        setNewCustomerCpf("")
        setNewCustomerBirthDate("")
        setNewWristbandId("")
        setDialogOpen(false)
    } catch (error) {
        console.error("Error adding customer: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao salvar cliente",
            description: "Ocorreu um erro ao salvar o cliente no banco de dados.",
        })
    }
  }
  
  const canLaunchOrder = user && ['Chefe', 'Garçom', 'Caixa'].includes(user.role);

  const renderCellContent = (customer: Customer, field: keyof Customer | 'checkInFormatted') => {
      let content;
      if (field === 'checkInFormatted') {
          content = format(customer.checkIn, 'dd/MM/yyyy HH:mm:ss');
      } else if (field === 'tableId') {
          content = customer.tableId || 'N/A';
      }
      else {
          content = customer[field as keyof Customer];
      }

      if (canLaunchOrder) {
          return (
               <Link href={`/dashboard/tables/${customer.wristbandId}`} className="block w-full h-full">
                  {content}
              </Link>
          )
      }
      return content;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-headline font-bold text-foreground">Comandas Individuais</h1>
            <p className="text-muted-foreground">
              Gerencie o check-in de clientes e suas comandas/pulseiras.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Comanda
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Comandas Abertas</CardTitle>
            <CardDescription>
              Uma lista de todos os clientes que fizeram check-in hoje. {canLaunchOrder ? 'Clique em um cliente para lançar um pedido.' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>ID da Comanda/Pulseira</TableHead>
                  <TableHead>Mesa</TableHead>
                  <TableHead>Horário do Check-in</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id} className={canLaunchOrder ? "cursor-pointer hover:bg-muted/50" : ""}>
                     <TableCell className="font-medium">
                        {renderCellContent(customer, 'name')}
                     </TableCell>
                     <TableCell>
                         {renderCellContent(customer, 'wristbandId')}
                    </TableCell>
                    <TableCell>
                         {renderCellContent(customer, 'tableId')}
                    </TableCell>
                    <TableCell>
                         {renderCellContent(customer, 'checkInFormatted')}
                    </TableCell>
                  </TableRow>
                ))}
                 {customers.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center h-24">
                            Nenhuma comanda aberta.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nova Comanda</DialogTitle>
            <DialogDescription>
              Cadastre um novo cliente e associe a uma comanda/pulseira.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                className="col-span-3"
                placeholder="Ex: João da Silva"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cpf" className="text-right">
                CPF
              </Label>
              <Input
                id="cpf"
                value={newCustomerCpf}
                onChange={(e) => setNewCustomerCpf(e.target.value)}
                className="col-span-3"
                placeholder="Ex: 123.456.789-00"
              />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="birthDate" className="text-right">
                Nascimento
              </Label>
              <Input
                id="birthDate"
                value={newCustomerBirthDate}
                onChange={(e) => setNewCustomerBirthDate(e.target.value)}
                className="col-span-3"
                placeholder="DD/MM/AAAA"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="wristbandId" className="text-right">
                Comanda/Pulseira
              </Label>
              <Input
                id="wristbandId"
                type="number"
                value={newWristbandId}
                onChange={(e) => setNewWristbandId(e.target.value)}
                className="col-span-3"
                placeholder="Ex: 101"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleAddCustomer}>Adicionar Cliente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
