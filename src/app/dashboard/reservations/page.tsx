
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
import { type Reservation } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { format } from "date-fns"
import { collection, addDoc, onSnapshot, query, where, Timestamp, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Badge } from "@/components/ui/badge"

export default function ReservationsPage() {
  const { user } = useAuth()
  const [reservations, setReservations] = React.useState<Reservation[]>([])
  const [isDialogOpen, setDialogOpen] = React.useState(false)
  const [newReservation, setNewReservation] = React.useState({
      name: "",
      pax: "",
      phone: "",
      time: "",
      tableId: "",
      notes: ""
  })
  const { toast } = useToast()

  React.useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfToday = Timestamp.fromDate(today);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfTomorrow = Timestamp.fromDate(tomorrow);

    const q = query(collection(db, "reservations"), 
        where("reservationTime", ">=", startOfToday),
        where("reservationTime", "<", startOfTomorrow)
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
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, value } = e.target;
      setNewReservation(prev => ({...prev, [id]: value}));
  }

  const handleAddReservation = async () => {
    if (!newReservation.name || !newReservation.pax || !newReservation.time || !user) {
      toast({
        variant: "destructive",
        title: "Campos Obrigatórios",
        description: "Por favor, preencha Nome, Pessoas e Horário.",
      })
      return
    }

    try {
        const [hours, minutes] = newReservation.time.split(':');
        const reservationDate = new Date();
        reservationDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

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

        setNewReservation({ name: "", pax: "", phone: "", time: "", tableId: "", notes: "" })
        setDialogOpen(false)
    } catch (error) {
        console.error("Error adding reservation: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao Salvar",
            description: "Ocorreu um erro ao salvar a reserva no banco de dados.",
        })
    }
  }
  
  const canAddReservation = user && (user.role === 'Chefe' || user.role === 'Caixa');

  const getStatusVariant = (status: Reservation['status']) => {
      switch (status) {
          case 'Confirmada': return 'default'
          case 'Aguardando': return 'secondary'
          case 'Cancelada': return 'destructive'
          default: return 'outline'
      }
  }


  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-headline font-bold text-foreground">Reservas do Dia</h1>
            <p className="text-muted-foreground">
              Gerencie e visualize as reservas de hoje.
            </p>
          </div>
          {canAddReservation && (
            <Button onClick={() => setDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Reserva
            </Button>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Lista de Reservas</CardTitle>
            <CardDescription>
              Uma lista de todas as reservas confirmadas para hoje.
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((reservation) => (
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
                  </TableRow>
                ))}
                 {reservations.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">
                            Nenhuma reserva para hoje.
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
            <DialogTitle>Nova Reserva</DialogTitle>
            <DialogDescription>
              Preencha os detalhes para criar uma nova reserva para hoje.
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
    </>
  )
}
