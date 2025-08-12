
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PlusCircle, Trash2 } from "lucide-react"
import { type User, UserRole } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { collection, onSnapshot, addDoc, query, where, doc, deleteDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
import { Separator } from "@/components/ui/separator"

const availableRoles: UserRole[] = ['Portaria', 'Garçom', 'Bar', 'Caixa', 'Cozinha'];

export default function UsersPage() {
  const { user, getChefeId } = useAuth()
  const [users, setUsers] = React.useState<User[]>([])
  const [isAddDialogOpen, setAddDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const [newUser, setNewUser] = React.useState({
    name: "",
    email: "",
    password: "",
    role: "" as UserRole | "",
    chefePassword: ""
  });

  React.useEffect(() => {
    const chefeId = getChefeId();
    if (!chefeId) return;

    const usersCol = collection(db, 'users');
    const q = query(usersCol, where("chefeId", "==", chefeId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const userList = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                email: data.email,
                role: data.role,
            } as User;
        });
        setUsers(userList.filter(u => u.role !== 'Chefe'));
    });

    return () => unsubscribe();
  }, [getChefeId])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, value } = e.target;
      setNewUser(prev => ({ ...prev, [id]: value }));
  }

  const handleRoleChange = (value: UserRole) => {
      setNewUser(prev => ({ ...prev, role: value }));
  }
  
  const handleAddUser = async () => {
    const chefeId = getChefeId();
    const currentChefe = user; 
    
    if (!newUser.name || !newUser.email || !newUser.password || !newUser.role || !chefeId || !currentChefe) {
        toast({
            variant: "destructive",
            title: "Campos Obrigatórios",
            description: "Por favor, preencha todos os campos para criar o usuário.",
        });
        return;
    }
     if (!newUser.chefePassword) {
        toast({ variant: "destructive", title: "Senha necessária", description: "A senha do Chefe é necessária para autorizar a criação." });
        return;
    }

    setIsLoading(true);
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
        
        await addDoc(collection(db, "users"), {
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            chefeId: chefeId,
        });

        toast({
            title: "Usuário Adicionado Com Sucesso!",
            description: `${newUser.name} foi adicionado e já pode fazer login.`,
        });
        
        setNewUser({ name: "", email: "", password: "", role: "", chefePassword: "" });
        setAddDialogOpen(false);

    } catch (error: any) {
        let description = "Ocorreu um erro ao salvar o novo usuário.";
        if (error.code === 'auth/email-already-in-use') {
            description = "Este e-mail já está em uso por outra conta.";
        } else if (error.code === 'auth/weak-password') {
            description = "A senha é muito fraca. Use pelo menos 6 caracteres.";
        }
        console.error("Error adding user: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao Adicionar Usuário",
            description: description,
        });
    } finally {
        if (currentChefe.email) {
            try {
                // Re-autentica o chefe para restaurar a sessão original
                await signInWithEmailAndPassword(auth, currentChefe.email, newUser.chefePassword);
            } catch (reauthError: any) {
                console.error("Failed to re-authenticate Chefe:", reauthError);
                toast({
                    variant: "destructive",
                    title: "Sua sessão expirou ou a senha está incorreta",
                    description: "Não foi possível re-autenticar. Por favor, tente novamente ou faça login de novo."
                });
            }
        }
        setIsLoading(false);
    }
  }

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsLoading(true);

    try {
        await deleteDoc(doc(db, "users", userToDelete.id));
        toast({
            title: "Usuário Removido",
            description: `O usuário ${userToDelete.name} foi removido do banco de dados. Lembre-se de removê-lo também do Firebase Authentication para bloquear o acesso.`
        });
        setUserToDelete(null);
        setDeleteDialogOpen(false);
    } catch (error) {
        console.error("Error deleting user: ", error);
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
            <h1 className="text-4xl font-headline font-bold text-foreground">Usuários</h1>
            <p className="text-muted-foreground">
              Gerencie os funcionários do seu restaurante.
            </p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Usuário
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Lista de Funcionários</CardTitle>
            <CardDescription>
              Uma lista de todos os funcionários e seus cargos.
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
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={'secondary'}>{user.role}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(user)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Remover Usuário</span>
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Nenhum usuário encontrado. Clique em "Adicionar Usuário" para começar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

       <Dialog open={isAddDialogOpen} onOpenChange={(isOpen) => {
           setAddDialogOpen(isOpen);
           if (!isOpen) {
               setNewUser({ name: "", email: "", password: "", role: "", chefePassword: "" });
           }
       }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo funcionário. Ele usará o e-mail e senha para fazer login. O processo é automático.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nome
              </Label>
              <Input id="name" value={newUser.name} onChange={handleInputChange} placeholder="Ex: João da Silva" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="email">
                E-mail
              </Label>
              <Input id="email" type="email" value={newUser.email} onChange={handleInputChange} placeholder="Ex: joao@email.com" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="password">
                Senha
              </Label>
              <Input id="password" type="password" value={newUser.password} onChange={handleInputChange} placeholder="Mínimo 6 caracteres" />
            </div>
            <div className="space-y-2">
               <Label htmlFor="role">
                Cargo
              </Label>
                <Select value={newUser.role} onValueChange={handleRoleChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione um cargo" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableRoles.map(role => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Separator className="my-4" />
             <div className="space-y-2">
               <Label htmlFor="chefePassword">
                Sua Senha de Chefe
              </Label>
              <Input id="chefePassword" type="password" value={newUser.chefePassword} onChange={handleInputChange} placeholder="Confirme sua senha para autorizar" />
               <p className="text-xs text-muted-foreground">
                    Para sua segurança, precisamos que você confirme sua senha de Chefe para criar um novo usuário.
                </p>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline" disabled={isLoading}>Cancelar</Button>
            </DialogClose>
            <Button onClick={handleAddUser} disabled={isLoading}>{isLoading ? "Adicionando..." : "Adicionar Usuário"}</Button>
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
                    Para remover completamente o acesso, você também deve excluir este usuário do console do <b>Firebase Authentication</b>. Esta é uma medida de segurança.
                </AlertDescription>
            </Alert>
            <DialogFooter className="mt-4">
                 <DialogClose asChild>
                    <Button variant="outline" disabled={isLoading}>Cancelar</Button>
                </DialogClose>
                <Button onClick={handleDeleteUser} variant="destructive" disabled={isLoading}>
                    {isLoading ? "Removendo..." : "Sim, Remover"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

    