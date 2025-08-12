
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
import { PlusCircle } from "lucide-react"
import { type User, UserRole } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { collection, onSnapshot, addDoc, query, where, doc, deleteDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"

const availableRoles: UserRole[] = ['Portaria', 'Garçom', 'Bar', 'Caixa', 'Cozinha'];

export default function UsersPage() {
  const { user, getChefeId } = useAuth()
  const [users, setUsers] = React.useState<User[]>([])
  const [isDialogOpen, setDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const [newUser, setNewUser] = React.useState({
    name: "",
    email: "",
    password: "",
    role: "" as UserRole | ""
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
        setUsers(userList);
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
    const currentChefePassword = prompt("Para confirmar, por favor, insira sua senha de Chefe:");


    if (!newUser.name || !newUser.email || !newUser.password || !newUser.role || !chefeId || !currentChefe) {
        toast({
            variant: "destructive",
            title: "Campos Obrigatórios",
            description: "Por favor, preencha todos os campos para criar o usuário.",
        });
        return;
    }
     if (!currentChefePassword) {
        toast({ variant: "destructive", title: "Senha necessária", description: "A senha do Chefe é necessária para autorizar a criação." });
        return;
    }

    setIsLoading(true);
    
    try {
        // 1. Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
        
        // 2. Add user to Firestore database
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
        
        setNewUser({ name: "", email: "", password: "", role: "" });
        setDialogOpen(false);

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
        // 3. Sign the Chefe back in to restore their session
        if (currentChefe.email) {
            try {
                await signInWithEmailAndPassword(auth, currentChefe.email, currentChefePassword);
            } catch (reauthError) {
                console.error("Failed to re-authenticate Chefe:", reauthError);
                toast({
                    variant: "destructive",
                    title: "Sessão Expirada",
                    description: "Não foi possível re-autenticar. Por favor, faça login novamente."
                });
            }
        }
        setIsLoading(false);
    }
  }

  const openDeleteDialog = (user: User) => {
    // Implementar a lógica de deleção se necessário
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
          <Button onClick={() => setDialogOpen(true)}>
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
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      Nenhum usuário encontrado. Clique em "Adicionar Usuário" para começar.
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
            <DialogTitle>Adicionar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo funcionário. Ele usará o e-mail e senha para fazer login.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input id="name" value={newUser.name} onChange={handleInputChange} className="col-span-3" placeholder="Ex: João da Silva" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                E-mail
              </Label>
              <Input id="email" type="email" value={newUser.email} onChange={handleInputChange} className="col-span-3" placeholder="Ex: joao@email.com" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Senha
              </Label>
              <Input id="password" type="password" value={newUser.password} onChange={handleInputChange} className="col-span-3" placeholder="Mínimo 6 caracteres" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="role" className="text-right">
                Cargo
              </Label>
                <Select value={newUser.role} onValueChange={handleRoleChange}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione um cargo" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableRoles.map(role => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
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
    </>
  )
}
