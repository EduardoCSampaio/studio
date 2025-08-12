
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
import { PlusCircle, Trash2, Users, ShoppingCart, TrendingUp } from "lucide-react"
import { type User, UserRole } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { collection, onSnapshot, addDoc, query, where, doc, deleteDoc, getDocs, Timestamp, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

type Chefe = User & {
    createdAt?: Timestamp;
    lastLogin?: Timestamp;
    orderCount?: number;
}

const initialClientGrowthData = [
  { name: "Jan", total: 0 }, { name: "Fev", total: 0 }, { name: "Mar", total: 0 },
  { name: "Abr", total: 0 }, { name: "Mai", total: 0 }, { name: "Jun", total: 0 },
  { name: "Jul", total: 0 }, { name: "Ago", total: 0 }, { name: "Set", total: 0 },
  { name: "Out", total: 0 }, { name: "Nov", total: 0 }, { name: "Dez", total: 0 },
]

export default function AdminPage() {
  const [chefs, setChefs] = React.useState<Chefe[]>([])
  const [totalOrders, setTotalOrders] = React.useState(0);
  const [clientGrowthData, setClientGrowthData] = React.useState(initialClientGrowthData);

  const [isAddDialogOpen, setAddDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [isViewTeamDialogOpen, setViewTeamDialogOpen] = React.useState(false);
  
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);
  const [selectedChefe, setSelectedChefe] = React.useState<User | null>(null);
  
  const [teamMembers, setTeamMembers] = React.useState<User[]>([]);
  const [isTeamLoading, setIsTeamLoading] = React.useState(false);
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

    const unsubscribe = onSnapshot(q, async (snapshot) => {
        const chefListPromises = snapshot.docs.map(async (chefDoc) => {
            const data = chefDoc.data();
            
            // Get order count for each chef
            const ordersQuery = query(collection(db, "orders"), where("chefeId", "==", chefDoc.id));
            const ordersSnapshot = await getDocs(ordersQuery);

            return {
                id: chefDoc.id,
                ...data,
                orderCount: ordersSnapshot.size,
                lastLogin: data.lastLogin,
            } as Chefe;
        });
        
        const chefList = await Promise.all(chefListPromises);
        setChefs(chefList);
        updateClientGrowthChart(chefList);
    });

    const ordersCol = collection(db, 'orders');
    const ordersUnsubscribe = onSnapshot(ordersCol, (snapshot) => {
        setTotalOrders(snapshot.size);
    });

    return () => {
        unsubscribe();
        ordersUnsubscribe();
    };
  }, [])
  
  const updateClientGrowthChart = (allChefs: Chefe[]) => {
      const monthlyGrowth = [...initialClientGrowthData];
      allChefs.forEach(chefe => {
          if (chefe.createdAt) {
              const creationDate = chefe.createdAt.toDate();
              const month = creationDate.getMonth();
              monthlyGrowth[month].total += 1;
          }
      });
      setClientGrowthData(monthlyGrowth);
  }
  
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
            createdAt: Timestamp.now(),
        });

        toast({
            title: "Usuário Chefe Registrado",
            description: `${newChefe.name} foi adicionado. Agora, crie a conta de autenticação para este e-mail no console do Firebase.`,
        });
        
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

  const handleViewTeam = async (chefe: User) => {
    setSelectedChefe(chefe);
    setViewTeamDialogOpen(true);
    setIsTeamLoading(true);
    setTeamMembers([]);

    try {
        const usersCol = collection(db, 'users');
        const q = query(usersCol, where("chefeId", "==", chefe.id));
        const querySnapshot = await getDocs(q);
        const teamList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as User[];
        setTeamMembers(teamList);
    } catch (error) {
        console.error("Error fetching team members: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao buscar equipe",
            description: "Não foi possível carregar os funcionários deste Chefe."
        });
    } finally {
        setIsTeamLoading(false);
    }
  }

  const newClientsLast30Days = React.useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoTimestamp = Timestamp.fromDate(thirtyDaysAgo);

    return chefs.filter(chefe => 
        chefe.createdAt && chefe.createdAt >= thirtyDaysAgoTimestamp
    ).length;
  }, [chefs]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-headline font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Gerencie as contas Chefe (seus clientes) e veja as métricas do sistema.
            </p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Cliente
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{chefs.length}</div>
                <p className="text-xs text-muted-foreground">Total de clientes ("Chefes") cadastrados.</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uso da Plataforma</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{totalOrders}</div>
                <p className="text-xs text-muted-foreground">Total de pedidos processados pelo sistema.</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Novos Clientes</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">+{newClientsLast30Days}</div>
                <p className="text-xs text-muted-foreground">Nos últimos 30 dias.</p>
                </CardContent>
            </Card>
        </div>
        
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Lista de Clientes</CardTitle>
                <CardDescription>
                  Uma lista de todos os usuários com permissão de Chefe.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Pedidos</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chefs.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.orderCount || 0}</TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="icon" title="Ver Equipe" onClick={() => handleViewTeam(user)}>
                                <Users className="h-4 w-4 text-primary" />
                                <span className="sr-only">Ver Equipe</span>
                            </Button>
                            <Button variant="ghost" size="icon" title="Remover Chefe" onClick={() => openDeleteDialog(user)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                                <span className="sr-only">Remover Chefe</span>
                            </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {chefs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          Nenhum Chefe encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Crescimento de Clientes</CardTitle>
                    <CardDescription>Novos clientes cadastrados por mês.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={clientGrowthData}>
                          <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                          />
                          <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
      </div>

       <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Cliente (Chefe)</DialogTitle>
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
            <Button onClick={handleAddChefe} disabled={isLoading}>{isLoading ? "Adicionando..." : "Adicionar Cliente"}</Button>
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

      <Dialog open={isViewTeamDialogOpen} onOpenChange={setViewTeamDialogOpen}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Equipe de {selectedChefe?.name}</DialogTitle>
                <DialogDescription>
                    Lista de todos os funcionários cadastrados para este Cliente.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                {isTeamLoading ? (
                    <p>Carregando equipe...</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Email (Login)</TableHead>
                                <TableHead>Cargo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teamMembers.length > 0 ? (
                                teamMembers.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell className="font-medium">{member.name}</TableCell>
                                        <TableCell>{member.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={'secondary'}>{member.role}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        Este Cliente ainda não possui funcionários.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>
            <DialogFooter>
                 <DialogClose asChild>
                    <Button variant="outline">Fechar</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

    