
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
import { PlusCircle, Pencil } from "lucide-react"
import { type Product } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, addDoc, query, where, doc, updateDoc } from "firebase/firestore"
import { useAuth } from "@/hooks/use-auth"

export default function ProductsPage() {
  const { getChefeId } = useAuth();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isAddDialogOpen, setAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = React.useState(false);

  const [newProductName, setNewProductName] = React.useState("");
  const [newProductPrice, setNewProductPrice] = React.useState("");
  const [newProductDepartment, setNewProductDepartment] = React.useState<"Cozinha" | "Bar" | "Geral" | "">("");
  
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);

  const { toast } = useToast();

  React.useEffect(() => {
    const chefeId = getChefeId();
    if (!chefeId) return;

    const productsCol = collection(db, 'products');
    const q = query(productsCol, where("chefeId", "==", chefeId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const productList = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                price: data.price,
                department: data.department
            } as Product;
        });
        setProducts(productList);
    });

    return () => unsubscribe();
  }, [getChefeId])
  
  const resetAddForm = () => {
    setNewProductName("");
    setNewProductPrice("");
    setNewProductDepartment("");
    setAddDialogOpen(false);
  }

  const handleAddProduct = async () => {
    const chefeId = getChefeId();
    if (!newProductName || !newProductPrice || !newProductDepartment || !chefeId) {
        toast({
            variant: "destructive",
            title: "Erro ao adicionar produto",
            description: "Por favor, preencha todos os campos.",
        });
        return;
    }

    try {
        await addDoc(collection(db, "products"), {
            name: newProductName,
            price: parseFloat(newProductPrice),
            department: newProductDepartment,
            chefeId: chefeId,
        });

        toast({
            title: "Produto Adicionado",
            description: `${newProductName} foi adicionado ao cardápio.`,
        });

        resetAddForm();
    } catch (error) {
        console.error("Error adding product: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao salvar produto",
            description: "Ocorreu um erro ao salvar o produto no banco de dados.",
        });
    }
  };
  
  const handleOpenEditDialog = (product: Product) => {
    setEditingProduct(product);
    setEditDialogOpen(true);
  }
  
  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    
    const { id, name, price, department } = editingProduct;

    if (!name || !price || !department) {
       toast({
            variant: "destructive",
            title: "Campos obrigatórios",
            description: "Todos os campos devem ser preenchidos.",
        });
        return;
    }

    const productRef = doc(db, "products", id);

    try {
        await updateDoc(productRef, {
            name: name,
            price: Number(price),
            department: department
        });
         toast({
            title: "Produto Atualizado!",
            description: `As informações de ${name} foram atualizadas.`,
        });
        setEditDialogOpen(false);
        setEditingProduct(null);
    } catch (error) {
         console.error("Error updating product: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao Atualizar",
            description: "Ocorreu um erro ao atualizar o produto.",
        });
    }
  }


  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-headline font-bold text-foreground">Produtos</h1>
            <p className="text-muted-foreground">
              Gerencie os itens do cardápio do seu restaurante.
            </p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Produto
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Lista de Produtos</CardTitle>
            <CardDescription>
              Uma lista completa de todos os produtos disponíveis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Produto</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.department}</TableCell>
                    <TableCell className="text-right">R$ {product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(product)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar Produto</span>
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
                 {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Nenhum produto encontrado. Clique em "Adicionar Produto" para começar.
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
            <DialogTitle>Adicionar Novo Produto</DialogTitle>
            <DialogDescription>
              Preencha os detalhes do novo item do cardápio.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                className="col-span-3"
                placeholder="Ex: Cheeseburger"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Preço
              </Label>
              <Input
                id="price"
                type="number"
                value={newProductPrice}
                onChange={(e) => setNewProductPrice(e.target.value)}
                className="col-span-3"
                placeholder="Ex: 29.90"
              />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="department" className="text-right">
                Departamento
              </Label>
                <Select
                    value={newProductDepartment}
                    onValueChange={(value) => setNewProductDepartment(value as "Cozinha" | "Bar" | "Geral")}
                >
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione um departamento" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Cozinha">Cozinha</SelectItem>
                        <SelectItem value="Bar">Bar</SelectItem>
                        <SelectItem value="Geral">Geral</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={resetAddForm}>Cancelar</Button>
            </DialogClose>
            <Button onClick={handleAddProduct}>Adicionar Produto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>
              Altere os detalhes do produto selecionado.
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                    Nome
                </Label>
                <Input
                    id="edit-name"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                    className="col-span-3"
                />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-price" className="text-right">
                    Preço
                </Label>
                <Input
                    id="edit-price"
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})}
                    className="col-span-3"
                />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-department" className="text-right">
                    Departamento
                </Label>
                    <Select
                        value={editingProduct.department}
                        onValueChange={(value) => setEditingProduct({...editingProduct, department: value as "Cozinha" | "Bar" | "Geral"})}
                    >
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecione um departamento" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Cozinha">Cozinha</SelectItem>
                            <SelectItem value="Bar">Bar</SelectItem>
                            <SelectItem value="Geral">Geral</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            </DialogClose>
            <Button onClick={handleUpdateProduct}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

    