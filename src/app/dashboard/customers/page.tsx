
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
import { customers as initialCustomers, type Customer } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export default function CustomersPage() {
  const [customers, setCustomers] = React.useState<Customer[]>([])
  const [isDialogOpen, setDialogOpen] = React.useState(false)
  const [newCustomerName, setNewCustomerName] = React.useState("")
  const [newCustomerCpf, setNewCustomerCpf] = React.useState("")
  const [newCustomerBirthDate, setNewCustomerBirthDate] = React.useState("")
  const [newWristbandId, setNewWristbandId] = React.useState("")
  const { toast } = useToast()

  React.useEffect(() => {
    // This needs to be in a useEffect to avoid hydration errors
    setCustomers(initialCustomers.map(c => ({...c, checkIn: new Date(c.checkIn)})));
  }, []);

  const handleAddCustomer = () => {
    const dateParts = newCustomerBirthDate.split('/');
    const birthDate = dateParts.length === 3 ? new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`) : new Date('');

    if (!newCustomerName || !newWristbandId || !newCustomerCpf || !newCustomerBirthDate || isNaN(birthDate.getTime())) {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar cliente",
        description: "Por favor, preencha todos os campos corretamente.",
      })
      return
    }

    const newCustomer: Customer = {
      id: `cust${customers.length + 1}`,
      name: newCustomerName,
      cpf: newCustomerCpf,
      birthDate: birthDate,
      wristbandId: parseInt(newWristbandId, 10),
      checkIn: new Date(),
    }

    setCustomers(prevCustomers => [...prevCustomers, newCustomer])
    
    toast({
      title: "Cliente Adicionado",
      description: `${newCustomer.name} foi cadastrado com a pulseira #${newCustomer.wristbandId}.`,
    })

    // Reset form and close dialog
    setNewCustomerName("")
    setNewCustomerCpf("")
    setNewCustomerBirthDate("")
    setNewWristbandId("")
    setDialogOpen(false)
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-headline font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground">
              Gerencie o check-in de clientes e suas pulseiras.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Cliente
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
            <CardDescription>
              Uma lista de todos os clientes que fizeram check-in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Data de Nascimento</TableHead>
                  <TableHead>ID da Pulseira</TableHead>
                  <TableHead>Horário do Check-in</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.cpf}</TableCell>
                    <TableCell>{format(customer.birthDate, 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{customer.wristbandId}</TableCell>
                    <TableCell>{format(customer.checkIn, 'dd/MM/yyyy HH:mm:ss')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Cliente</DialogTitle>
            <DialogDescription>
              Cadastre um novo cliente e associe a uma pulseira.
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
                placeholder="Ex: DD/MM/AAAA"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="wristbandId" className="text-right">
                Pulseira
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
