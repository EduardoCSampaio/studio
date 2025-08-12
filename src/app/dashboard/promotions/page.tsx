
"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
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
import { PlusCircle, Percent, Trash2 } from "lucide-react"
import { type Product, type Promotion } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, addDoc, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { useAuth } from "@/hooks/use-auth"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function PromotionsPage() {
  const { user, getChefeId } = useAuth();
  const [promotions, setPromotions] = React.useState<Promotion[]>([]);
  const [allProducts, setAllProducts] = React.useState<Product[]>([]);
  const [isDialogOpen, setDialogOpen] = React.useState(false);

  const [newPromotionName, setNewPromotionName] = React.useState("");
  const [selectedProducts, setSelectedProducts] = React.useState<Product[]>([]);
  const [discountPercentage, setDiscountPercentage] = React.useState("0");

  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    const chefeId = getChefeId();
    if (!user || !chefeId) return;

    const productsQuery = query(collection(db, 'products'), where("chefeId", "==", chefeId));
    const promotionsQuery = query(collection(db, 'promotions'), where("chefeId", "==", chefeId));

    const unsubProducts = onSnapshot(productsQuery, (snapshot) => {
        const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
        setAllProducts(productList);
    });

    const unsubPromotions = onSnapshot(promotionsQuery, (snapshot) => {
        const promotionList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Promotion[];
        setPromotions(promotionList);
    });

    return () => {
        unsubProducts();
        unsubPromotions();
    };
  }, [user, getChefeId])

  const originalPrice = React.useMemo(() => {
    return selectedProducts.reduce((total, product) => total + product.price, 0);
  }, [selectedProducts]);

  const finalPrice = React.useMemo(() => {
    const discount = parseFloat(discountPercentage) / 100;
    return originalPrice * (1 - discount);
  }, [originalPrice, discountPercentage]);

  const handleProductSelect = (product: Product, checked: boolean | string) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, product]);
    } else {
      setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
    }
  };

  const resetDialog = () => {
    setNewPromotionName("");
    setSelectedProducts([]);
    setDiscountPercentage("0");
    setDialogOpen(false);
  }

  const handleAddPromotion = async () => {
    const chefeId = getChefeId();
    if (!newPromotionName || selectedProducts.length === 0 || !chefeId) {
      toast({
        variant: "destructive",
        title: "Campos Obrigatórios",
        description: "Preencha o nome da promoção e selecione ao menos um produto.",
      });
      return;
    }

    setIsLoading(true);
    try {
        const promotionToAdd: Omit<Promotion, 'id'> = {
            name: newPromotionName,
            products: selectedProducts,
            originalPrice: originalPrice,
            discountPercentage: parseFloat(discountPercentage),
            finalPrice: finalPrice,
            chefeId: chefeId,
            isActive: true,
        };

        await addDoc(collection(db, "promotions"), promotionToAdd);

        toast({
            title: "Promoção Criada!",
            description: `A promoção "${newPromotionName}" foi salva.`,
        });

        resetDialog();
    } catch (error) {
        console.error("Error adding promotion: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao Salvar",
            description: "Não foi possível criar a promoção.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeletePromotion = async (promotionId: string) => {
    setIsLoading(true);
    try {
        await deleteDoc(doc(db, "promotions", promotionId));
        toast({
            title: "Promoção Removida",
            description: "A promoção foi removida com sucesso.",
        });
    } catch (error) {
        console.error("Error deleting promotion: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao Remover",
            description: "Não foi possível remover a promoção.",
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
            <h1 className="text-4xl font-headline font-bold text-foreground">Promoções</h1>
            <p className="text-muted-foreground">
              Crie e gerencie promoções e combos para seus clientes.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Criar Promoção
          </Button>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {promotions.map((promo) => (
                <Card key={promo.id}>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-start">
                            <span>{promo.name}</span>
                             <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeletePromotion(promo.id)} disabled={isLoading}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                                <span className="sr-only">Remover promoção</span>
                            </Button>
                        </CardTitle>
                        <CardDescription>
                            {promo.products.map(p => p.name).join(' + ')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="text-sm text-muted-foreground line-through">
                            De: R$ {promo.originalPrice.toFixed(2)}
                        </div>
                        <div className="text-2xl font-bold text-primary">
                            Por: R$ {promo.finalPrice.toFixed(2)}
                        </div>
                         <Badge variant="secondary">{promo.discountPercentage}% OFF</Badge>
                    </CardContent>
                </Card>
            ))}
             {promotions.length === 0 && (
                <Card className="col-span-full">
                    <CardContent className="h-48 flex flex-col items-center justify-center text-center">
                        <h3 className="text-lg font-semibold">Nenhuma promoção criada ainda</h3>
                        <p className="text-muted-foreground">Clique em "Criar Promoção" para começar a oferecer combos e descontos.</p>
                    </CardContent>
                </Card>
            )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Criar Nova Promoção</DialogTitle>
            <DialogDescription>
              Monte um combo, dê um nome e aplique um desconto percentual.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="promo-name">Nome da Promoção</Label>
              <Input id="promo-name" value={newPromotionName} onChange={(e) => setNewPromotionName(e.target.value)} placeholder="Ex: Combo Família"/>
            </div>
            
            <div className="space-y-2">
                <Label>Selecione os Produtos</Label>
                <ScrollArea className="h-60 rounded-md border p-4">
                    <div className="space-y-2">
                    {allProducts.map(product => (
                        <div key={product.id} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`product-${product.id}`} 
                                onCheckedChange={(checked) => handleProductSelect(product, checked)}
                                checked={selectedProducts.some(p => p.id === product.id)}
                            />
                            <label
                                htmlFor={`product-${product.id}`}
                                className="flex-1 flex justify-between text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                <span>{product.name}</span>
                                <span className="text-muted-foreground">R$ {product.price.toFixed(2)}</span>
                            </label>
                        </div>
                    ))}
                    </div>
                </ScrollArea>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="promo-discount">Desconto (%)</Label>
                    <div className="relative">
                        <Input id="promo-discount" type="number" value={discountPercentage} onChange={(e) => setDiscountPercentage(e.target.value)} placeholder="Ex: 20"/>
                        <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                </div>

                 <div className="space-y-2 text-right">
                    <Label>Preço Original</Label>
                    <p className="text-lg font-semibold line-through text-muted-foreground">R$ {originalPrice.toFixed(2)}</p>
                </div>
            </div>

             <div className="text-right mt-2">
                <Label>Preço Final com Desconto</Label>
                <p className="text-3xl font-bold text-primary">R$ {finalPrice.toFixed(2)}</p>
            </div>
            
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={resetDialog} disabled={isLoading}>Cancelar</Button>
            </DialogClose>
            <Button onClick={handleAddPromotion} disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar Promoção"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
