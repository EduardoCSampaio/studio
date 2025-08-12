
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
import { Badge } from "@/components/ui/badge"
import { type SystemEvent } from "@/lib/data"
import { collection, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { format } from "date-fns"
import { AlertTriangle, Info, XCircle } from "lucide-react"

export default function SystemHealthPage() {
  const [events, setEvents] = React.useState<SystemEvent[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const eventsQuery = query(collection(db, "system_events"), orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const eventsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: (doc.data().timestamp as Timestamp)?.toDate(),
      })) as SystemEvent[];
      setEvents(eventsList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching system events: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [])

  const getVariantForLevel = (level: SystemEvent['level']): "default" | "secondary" | "destructive" | "outline" => {
    switch (level) {
      case 'info': return 'default'
      case 'warning': return 'secondary'
      case 'error': return 'destructive'
      default: return 'outline'
    }
  }

  const getIconForLevel = (level: SystemEvent['level']) => {
      switch(level) {
          case 'info': return <Info className="h-4 w-4 mr-2" />;
          case 'warning': return <AlertTriangle className="h-4 w-4 mr-2" />;
          case 'error': return <XCircle className="h-4 w-4 mr-2" />;
          default: return null;
      }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-headline font-bold text-foreground">Saúde do Sistema</h1>
        <p className="text-muted-foreground">
          Visualize logs de eventos, avisos e erros que ocorrem na plataforma.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Log de Eventos</CardTitle>
          <CardDescription>
            Uma lista de eventos do sistema, com os mais recentes no topo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Horário</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Mensagem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Carregando eventos...
                  </TableCell>
                </TableRow>
              ) : events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Nenhum evento registrado no sistema.
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      {event.timestamp ? format(event.timestamp, 'dd/MM/yyyy HH:mm:ss') : 'Carregando...'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getVariantForLevel(event.level)}>
                        <div className="flex items-center">
                           {getIconForLevel(event.level)}
                           <span>{event.level.charAt(0).toUpperCase() + event.level.slice(1)}</span>
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>{event.message}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
