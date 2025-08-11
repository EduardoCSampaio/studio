
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
import { PlusCircle } from "lucide-react"
import { type User } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { collection, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function UsersPage() {
  const [users, setUsers] = React.useState<User[]>([])

  React.useEffect(() => {
    const usersCol = collection(db, 'users');
    const unsubscribe = onSnapshot(usersCol, (snapshot) => {
        const userList = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                email: data.email,
                role: data.role,
            } as User;
        });
        setUsers(userList);
    });

    return () => unsubscribe();
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-headline font-bold text-foreground">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie os funcionários do seu restaurante.
          </p>
        </div>
        <Button disabled>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Usuário
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            Uma lista de todos os funcionários e seus cargos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cargo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.role}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Nenhum usuário encontrado. Faça login com diferentes perfis para popular esta lista.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
