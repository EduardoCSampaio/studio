
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
import { PlusCircle, Trash2 } from "lucide-react"
import { type User, UserRole } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { collection, onSnapshot, addDoc, query, where, doc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

export default function AdminPage() {
  const [chefs, setChefs] = React.useState<User[]>([])
  const [isAddDialogOpen, setAddDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const [newChefe, setNewChefe] = React.useState({
    name: "",
    email: "",
    password: "",
  });

  React.useEffect(() => {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where("role", "==", "Chefe"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const chefList = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                email: data.email,
                role: data.role,
            } as User;
        });
        setChefs(chefList);
    });

    return () => unsubscribe();
  }, [])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, value } = e.target;
      setNewChefe(prev => ({ ...prev, [id]: value }));
  }
  
  const handleAddChefe = async () => {
    if (!newChefe.name || !newChefe.email || !newChefe.password) {
        toast({
            variant: "destructive",
            title: "Campos Obrigatórios",
            description: "Por favor, preencha todos os campos para criar o usuário Chefe.",
        });
        return;
    }

    setIsLoading(true);
    
    try {
        await addDoc(collection(db, "users"), {
            name: newChefe.name,
            email: newChefe.email,
            role: "Chefe" as UserRole,
        });

        toast({
            title: "Usuário Chefe Registrado",
            description: `${newChefe.name} foi adicionado. Agora, crie a conta de autenticação para este e-mail no console do Firebase.`,
        });
        
        // Reset form
        setNewChefe({ name: "", email: "", password: "" });
        setAddDialogOpen(false);

    } catch (error) {
         console.error("Error adding Chefe: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao Adicionar Chefe",
            description: "Ocorreu um erro ao salvar o novo usuário.",
        });
    } finally {
        setIsLoading(false);
    }
  }

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  }

  const handleDeleteChefe = async () => {
    if (!userToDelete) return;
    setIsLoading(true);

    try {
        await deleteDoc(doc(db, "users", userToDelete.id));
        toast({
            title: "Usuário Removido",
            description: `O usuário ${userToDelete.name} foi removido do banco de dados. Lembre-se de removê-lo também do Firebase Authentication.`
        });
        setUserToDelete(null);
        setDeleteDialogOpen(false);
    } catch (error) {
        console.error("Error deleting Chefe: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao Remover Usuário",
            description: "Não foi possível remover o usuário do banco de dados."
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-headline font-bold text-foreground">Admin</h1>
            <p className="text-muted-foreground">
              Gerencie as contas Chefe (seus clientes) do sistema.
            </p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Chefe
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Lista de Chefes</CardTitle>
            <CardDescription>
              Uma lista de todos os usuários com permissão de Chefe (clientes do sistema).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email (Login)</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chefs.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={'default'}>{user.role}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(user)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Remover Chefe</span>
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {chefs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Nenhum Chefe encontrado. Clique em "Adicionar Chefe" para começar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

       <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Chefe</DialogTitle>
            <DialogDescription>
                Preencha os dados do novo gestor. Isso o registrará no sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input id="name" value={newChefe.name} onChange={handleInputChange} className="col-span-3" placeholder="Ex: Gerson" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                E-mail
              </Label>
              <Input id="email" type="email" value={newChefe.email} onChange={handleInputChange} className="col-span-3" placeholder="Ex: gerson@restaurante.com" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Senha
              </Label>
              <Input id="password" type="password" value={newChefe.password} onChange={handleInputChange} className="col-span-3" placeholder="Senha de acesso" />
            </div>
          </div>
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Ação Manual Necessária!</AlertTitle>
            <AlertDescription>
                Após adicionar, você precisará criar este usuário (com mesmo e-mail e senha) no console do <b>Firebase Authentication</b> para que o login funcione.
            </AlertDescription>
          </Alert>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline" disabled={isLoading}>Cancelar</Button>
            </DialogClose>
            <Button onClick={handleAddChefe} disabled={isLoading}>{isLoading ? "Adicionando..." : "Adicionar Chefe"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Confirmar Remoção</DialogTitle>
                <DialogDescription>
                    Tem certeza que deseja remover o usuário <b>{userToDelete?.name}</b>? Esta ação removerá o registro do banco de dados.
                </DialogDescription>
            </DialogHeader>
             <Alert variant="destructive" className="mt-4">
                <AlertTitle>Ação Manual Necessária!</AlertTitle>
                <AlertDescription>
                    Para remover completamente o acesso, você também deve excluir este usuário do console do <b>Firebase Authentication</b>.
                </AlertDescription>
            </Alert>
            <DialogFooter className="mt-4">
                 <DialogClose asChild>
                    <Button variant="outline" disabled={isLoading}>Cancelar</Button>
                </DialogClose>
                <Button onClick={handleDeleteChefe} variant="destructive" disabled={isLoading}>
                    {isLoading ? "Removendo..." : "Sim, Remover"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

    