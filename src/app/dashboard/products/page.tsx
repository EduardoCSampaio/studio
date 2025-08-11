
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
import { type Product } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, addDoc } from "firebase/firestore"

export default function ProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isDialogOpen, setDialogOpen] = React.useState(false);
  const [newProductName, setNewProductName] = React.useState("");
  const [newProductPrice, setNewProductPrice] = React.useState("");
  const [newProductDepartment, setNewProductDepartment] = React.useState<"Cozinha" | "Bar" | "Geral" | "">("");
  const { toast } = useToast();

  React.useEffect(() => {
    const productsCol = collection(db, 'products');
    const unsubscribe = onSnapshot(productsCol, (snapshot) => {
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
  }, [])

  const handleAddProduct = async () => {
    if (!newProductName || !newProductPrice || !newProductDepartment) {
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
        });

        toast({
            title: "Produto Adicionado",
            description: `${newProductName} foi adicionado ao cardápio.`,
        });

        setNewProductName("");
        setNewProductPrice("");
        setNewProductDepartment("");
        setDialogOpen(false);
    } catch (error) {
        console.error("Error adding product: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao salvar produto",
            description: "Ocorreu um erro ao salvar o produto no banco de dados.",
        });
    }
  };


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
          <Button onClick={() => setDialogOpen(true)}>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.department}</TableCell>
                    <TableCell className="text-right">R$ {product.price.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                 {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      Nenhum produto encontrado. Clique em "Adicionar Produto" para começar.
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
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleAddProduct}>Adicionar Produto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
