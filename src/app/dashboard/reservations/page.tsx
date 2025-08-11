
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
import { PlusCircle, Calendar as CalendarIcon, Pencil, Search } from "lucide-react"
import { type Reservation } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { collection, addDoc, onSnapshot, query, where, Timestamp, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

export default function ReservationsPage() {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date())
  const [reservations, setReservations] = React.useState<Reservation[]>([])
  const [nameFilter, setNameFilter] = React.useState("")
  
  // States for new reservation dialog
  const [isAddDialogOpen, setAddDialogOpen] = React.useState(false)
  const [newReservation, setNewReservation] = React.useState({
      name: "",
      pax: "",
      phone: "",
      date: format(new Date(), 'yyyy-MM-dd'),
      time: "",
      tableId: "",
      notes: ""
  })

  // States for edit reservation dialog
  const [isEditDialogOpen, setEditDialogOpen] = React.useState(false);
  const [selectedReservation, setSelectedReservation] = React.useState<Reservation | null>(null);
  const [editingTableId, setEditingTableId] = React.useState("");

  const { toast } = useToast()

  React.useEffect(() => {
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfDayTimestamp = Timestamp.fromDate(startOfDay);

    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    const endOfDayTimestamp = Timestamp.fromDate(endOfDay);

    const q = query(collection(db, "reservations"), 
        where("reservationTime", ">=", startOfDayTimestamp),
        where("reservationTime", "<=", endOfDayTimestamp)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reservationList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          reservationTime: (doc.data().reservationTime as Timestamp).toDate(),
      })) as Reservation[];
      setReservations(reservationList.sort((a,b) => a.reservationTime.getTime() - b.reservationTime.getTime()));
    });

    return () => unsubscribe();
  }, [selectedDate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, value } = e.target;
      setNewReservation(prev => ({...prev, [id]: value}));
  }

  const handleAddReservation = async () => {
    if (!newReservation.name || !newReservation.pax || !newReservation.time || !user) {
      toast({
        variant: "destructive",
        title: "Campos Obrigatórios",
        description: "Por favor, preencha Nome, Pessoas, Data e Horário.",
      })
      return
    }

    try {
        const [year, month, day] = newReservation.date.split('-').map(Number);
        const [hours, minutes] = newReservation.time.split(':').map(Number);
        
        const reservationDate = new Date(year, month - 1, day, hours, minutes);

        const reservationToAdd = {
          name: newReservation.name,
          pax: parseInt(newReservation.pax, 10),
          phone: newReservation.phone,
          reservationTime: Timestamp.fromDate(reservationDate),
          tableId: newReservation.tableId,
          notes: newReservation.notes,
          status: 'Confirmada' as const,
          createdBy: user.id,
        }

        await addDoc(collection(db, "reservations"), reservationToAdd)
        
        toast({
          title: "Reserva Adicionada",
          description: `Reserva para ${newReservation.name} foi adicionada com sucesso.`,
        })

        setNewReservation({ name: "", pax: "", phone: "", date: format(new Date(), 'yyyy-MM-dd'), time: "", tableId: "", notes: "" })
        setAddDialogOpen(false)
    } catch (error) {
        console.error("Error adding reservation: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao Salvar",
            description: "Ocorreu um erro ao salvar a reserva no banco de dados.",
        })
    }
  }

  const handleOpenEditDialog = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setEditingTableId(reservation.tableId || "");
    setEditDialogOpen(true);
  }

  const handleUpdateTableId = async () => {
      if (!selectedReservation) return;

      const reservationRef = doc(db, "reservations", selectedReservation.id);
      try {
          await updateDoc(reservationRef, {
              tableId: editingTableId
          });
          toast({
              title: "Mesa Atualizada!",
              description: `A reserva de ${selectedReservation.name} foi atualizada para a mesa ${editingTableId}.`
          });
          setEditDialogOpen(false);
          setSelectedReservation(null);
      } catch (error) {
           console.error("Error updating table ID: ", error);
            toast({
                variant: "destructive",
                title: "Erro ao Atualizar",
                description: "Não foi possível atualizar a mesa da reserva.",
            })
      }
  }
  
  const canAddReservation = user && (user.role === 'Chefe' || user.role === 'Caixa');
  const canEditReservation = user && (user.role === 'Chefe' || user.role === 'Caixa' || user.role === 'Garçom');

  const getStatusVariant = (status: Reservation['status']) => {
      switch (status) {
          case 'Confirmada': return 'default'
          case 'Aguardando': return 'secondary'
          case 'Cancelada': return 'destructive'
          default: return 'outline'
      }
  }
  
  const filteredReservations = reservations.filter(reservation =>
    reservation.name.toLowerCase().includes(nameFilter.toLowerCase())
  );


  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-headline font-bold text-foreground">Reservas</h1>
            <p className="text-muted-foreground">
              Gerencie e visualize as reservas por data e nome.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Filtrar por nome..."
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    className="pl-9 w-full sm:w-[200px]"
                />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[240px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            {canAddReservation && (
              <Button className="w-full sm:w-auto" onClick={() => setAddDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nova Reserva
              </Button>
            )}
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Lista de Reservas</CardTitle>
            <CardDescription>
              Uma lista de todas as reservas para a data selecionada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Horário</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Pessoas</TableHead>
                  <TableHead>Mesa</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  {canEditReservation && <TableHead>Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                     <TableCell className="font-medium">{format(reservation.reservationTime, 'HH:mm')}</TableCell>
                     <TableCell>{reservation.name}</TableCell>
                     <TableCell>{reservation.pax}</TableCell>
                     <TableCell>{reservation.tableId || 'N/A'}</TableCell>
                     <TableCell>{reservation.phone || 'N/A'}</TableCell>
                     <TableCell>
                         <Badge variant={getStatusVariant(reservation.status)}>
                            {reservation.status}
                         </Badge>
                     </TableCell>
                     {canEditReservation && (
                        <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(reservation)}>
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Alterar Mesa</span>
                            </Button>
                        </TableCell>
                     )}
                  </TableRow>
                ))}
                 {filteredReservations.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={canEditReservation ? 7 : 6} className="text-center h-24">
                            Nenhuma reserva encontrada para os filtros aplicados.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add Reservation Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nova Reserva</DialogTitle>
            <DialogDescription>
              Preencha os detalhes para criar uma nova reserva.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome*
              </Label>
              <Input id="name" value={newReservation.name} onChange={handleInputChange} className="col-span-3"/>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pax" className="text-right">
                Pessoas*
              </Label>
              <Input id="pax" type="number" value={newReservation.pax} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Data*
              </Label>
              <Input id="date" type="date" value={newReservation.date} onChange={handleInputChange} className="col-span-3"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Horário*
              </Label>
              <Input id="time" type="time" value={newReservation.time} onChange={handleInputChange} className="col-span-3"/>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Telefone
              </Label>
              <Input id="phone" value={newReservation.phone} onChange={handleInputChange} className="col-span-3"/>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tableId" className="text-right">
                Mesa
              </Label>
              <Input id="tableId" value={newReservation.tableId} onChange={handleInputChange} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Observações
              </Label>
              <Input id="notes" value={newReservation.notes} onChange={handleInputChange} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleAddReservation}>Adicionar Reserva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

       {/* Edit Reservation Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Alterar Mesa da Reserva</DialogTitle>
             {selectedReservation && (
                 <DialogDescription>
                    Alterando a mesa para a reserva de <span className="font-semibold">{selectedReservation.name}</span>.
                </DialogDescription>
             )}
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-tableId" className="text-right">
                Nº da Mesa
              </Label>
              <Input 
                id="edit-tableId" 
                value={editingTableId} 
                onChange={(e) => setEditingTableId(e.target.value)} 
                className="col-span-3" 
                placeholder="Ex: 12"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleUpdateTableId}>Salvar Alteração</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
