
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
import { collection, onSnapshot, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

const availableRoles: UserRole[] = ['Portaria', 'Garçom', 'Bar', 'Caixa', 'Cozinha'];

export default function UsersPage() {
  const [users, setUsers] = React.useState<User[]>([])
  const [isDialogOpen, setDialogOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const [newUser, setNewUser] = React.useState({
    name: "",
    email: "",
    password: "",
    role: "" as UserRole | ""
  });

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
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, value } = e.target;
      setNewUser(prev => ({ ...prev, [id]: value }));
  }

  const handleRoleChange = (value: UserRole) => {
      setNewUser(prev => ({ ...prev, role: value }));
  }
  
  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password || !newUser.role) {
        toast({
            variant: "destructive",
            title: "Campos Obrigatórios",
            description: "Por favor, preencha todos os campos para criar o usuário.",
        });
        return;
    }

    setIsLoading(true);
    
    // In a real-world scenario, you would use a Cloud Function to create the user in Firebase Auth.
    // For this prototype, we'll add the user to the 'users' collection in Firestore.
    // The administrator would then need to create the corresponding user in Firebase Authentication.
    try {
        await addDoc(collection(db, "users"), {
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
        });

        toast({
            title: "Usuário Adicionado",
            description: `${newUser.name} foi adicionado. Agora, crie a autenticação para ${newUser.email} no console do Firebase.`,
        });
        
        // Reset form
        setNewUser({ name: "", email: "", password: "", role: "" });
        setDialogOpen(false);

    } catch (error) {
         console.error("Error adding user: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao Adicionar Usuário",
            description: "Ocorreu um erro ao salvar o novo usuário.",
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
                      <Badge variant={user.role === 'Chefe' ? 'default' : 'secondary'}>{user.role}</Badge>
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
              <Input id="password" type="password" value={newUser.password} onChange={handleInputChange} className="col-span-3" placeholder="Senha de acesso" />
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
          <DialogFooter>
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
