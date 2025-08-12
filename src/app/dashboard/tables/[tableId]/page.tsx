
"use client"

import * as React from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
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
import { ShoppingCart, Trash2, Send, Star } from "lucide-react"
import { type OrderItem, type Product, type Customer, type Promotion } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { Separator } from "@/components/ui/separator"
import { collection, getDocs, doc, query, where, addDoc, serverTimestamp, getDocs as getDocsFromQuery, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Badge } from "@/components/ui/badge"


export default function OrderPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter()
  const { toast } = useToast()
  const { user, getChefeId } = useAuth()

  const wristbandId = params.tableId as string;
  const tableIdFromQuery = searchParams.get('tableId');
  
  const [orderItems, setOrderItems] = React.useState<OrderItem[]>([])
  const [allProducts, setAllProducts] = React.useState<Product[]>([]);
  const [allPromotions, setAllPromotions] = React.useState<Promotion[]>([]);
  const [customer, setCustomer] = React.useState<Customer | null>(null);
  const [pageTitle, setPageTitle] = React.useState<string>(`Comanda...`);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    const chefeId = getChefeId();
    if (!chefeId) return;

    // Fetch Products
    const productsCol = collection(db, 'products');
    const qProducts = query(productsCol, where("chefeId", "==", chefeId));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
        const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
        setAllProducts(productList);
    });

    // Fetch Promotions
    const promotionsCol = collection(db, 'promotions');
    const qPromotions = query(promotionsCol, where("chefeId", "==", chefeId), where("isActive", "==", true));
    const unsubPromotions = onSnapshot(qPromotions, (snapshot) => {
        const promotionList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Promotion[];
        setAllPromotions(promotionList);
    });

    // Fetch Customer
    const fetchCustomer = async () => {
        if (wristbandId) {
            const customersRef = collection(db, "customers");
            const q = query(customersRef, 
                where("wristbandId", "==", parseInt(wristbandId, 10)),
                where("chefeId", "==", chefeId)
            );
            const querySnapshot = await getDocsFromQuery(q);

            if (!querySnapshot.empty) {
                const customerDoc = querySnapshot.docs[0];
                const customerData = { id: customerDoc.id, ...customerDoc.data() } as Customer;
                setCustomer(customerData);
                const tableInfo = tableIdFromQuery ? ` | Mesa ${tableIdFromQuery}` : (customerData.tableId ? ` | Mesa ${customerData.tableId}` : '');
                setPageTitle(`Comanda #${wristbandId} - ${customerData.name}${tableInfo}`);
            } else {
                setPageTitle(`Detalhes da Comanda #${wristbandId}`);
            }
        }
    };
    fetchCustomer();
    
    setOrderItems([]);

    return () => {
        unsubProducts();
        unsubPromotions();
    };

  }, [wristbandId, tableIdFromQuery, getChefeId]);


  const handleAddItem = (product: Product) => {
    setOrderItems(prevItems => {
      const existingItem = prevItems.find(item => item.productId === product.id && !item.promotionId)
      if (existingItem) {
        return prevItems.map(item =>
          item.productId === product.id && !item.promotionId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevItems, { 
        productId: product.id, 
        name: product.name, 
        price: product.price, 
        quantity: 1, 
        department: product.department 
      }]
    })
    toast({
      title: "Item Adicionado",
      description: `${product.name} foi adicionado ao pedido.`,
    })
  }

  const handleAddPromotion = (promotion: Promotion) => {
    const discountMultiplier = 1 - (promotion.discountPercentage / 100);

    const itemsFromPromo: OrderItem[] = promotion.products.map(product => ({
        productId: product.id,
        name: product.name,
        price: product.price * discountMultiplier,
        quantity: 1,
        department: product.department,
        promotionId: promotion.id,
    }));
    
    setOrderItems(prevItems => [...prevItems, ...itemsFromPromo]);
    
    toast({
        title: "Promoção Adicionada!",
        description: `"${promotion.name}" foi adicionada ao pedido.`,
    });
  };
  
  const handleRemoveItem = (productId: string, promotionId?: string) => {
    setOrderItems(prevItems => {
        const itemIndex = prevItems.findIndex(item => item.productId === productId && item.promotionId === promotionId);

        if (itemIndex === -1) return prevItems;

        const item = prevItems[itemIndex];
        
        if (item.quantity > 1) {
            const newItems = [...prevItems];
            newItems[itemIndex] = { ...item, quantity: item.quantity - 1 };
            return newItems;
        }

        return prevItems.filter((_, index) => index !== itemIndex);
    });
  };


  const calculateTotal = (items: OrderItem[]) => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const handleSendOrder = async () => {
    const chefeId = getChefeId();
    if (!user || !chefeId) {
      toast({
        variant: "destructive",
        title: "Erro de Autenticação",
        description: "Você precisa estar logado para enviar um pedido.",
      })
      return
    }

    if (orderItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Pedido Vazio",
        description: "Adicione itens antes de enviar o pedido.",
      })
      return
    }
    
    setIsSubmitting(true);

    try {
      const subtotal = calculateTotal(orderItems);
      const serviceFee = subtotal * 0.1;
      const total = subtotal + serviceFee;

      const newOrder = {
          comandaId: wristbandId,
          customerId: customer?.id,
          customerName: customer?.name,
          waiterId: user.id,
          waiterName: user.name,
          status: 'Pending' as const,
          createdAt: serverTimestamp(),
          printedAt: null,
          tableId: tableIdFromQuery ? parseInt(tableIdFromQuery, 10) : customer?.tableId || null,
          chefeId: chefeId,
          items: orderItems,
          total: total
      };

      await addDoc(collection(db, "orders"), newOrder);

      toast({
        title: "Pedido Enviado com Sucesso!",
        description: `O pedido para a comanda ${wristbandId} foi enviado para os departamentos.`,
      })
      
      if (user?.role === 'Garçom') {
          router.push("/dashboard/waiter");
      } else {
          router.push("/dashboard/customers");
      }

    } catch(error) {
        console.error("Error sending order: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao Enviar Pedido",
            description: "Ocorreu um erro ao salvar o pedido no banco de dados.",
        })
    } finally {
        setIsSubmitting(false);
    }
  }

  const kitchenProducts = allProducts.filter(p => p.department === "Cozinha")
  const barProducts = allProducts.filter(p => p.department === "Bar")
  const generalProducts = allProducts.filter(p => p.department === "Geral")
  
  return (
    <>
    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <h1 className="text-4xl font-headline font-bold text-foreground">{pageTitle}</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Menu de Produtos e Promoções</CardTitle>
            <CardDescription>Adicione itens ou combos ao pedido da comanda.</CardDescription>
          </CardHeader>
          <CardContent>
              {allPromotions.length > 0 && (
                  <>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Star className="text-amber-500"/>Promoções</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                        {allPromotions.map((promo) => (
                        <Button key={promo.id} variant="outline" className="h-auto flex flex-col items-start p-3 border-amber-500/50 hover:bg-amber-500/10" onClick={() => handleAddPromotion(promo)}>
                            <div className="w-full flex justify-between items-center">
                                <span className="font-semibold text-primary">{promo.name}</span>
                                <span className="text-sm font-bold text-primary">R$ {promo.finalPrice.toFixed(2)}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{promo.products.map(p => p.name).join(' + ')}</span>
                        </Button>
                        ))}
                    </div>
                    <Separator className="my-6"/>
                  </>
              )}

              <h3 className="text-lg font-semibold mb-2">Cozinha</h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {kitchenProducts.map((product) => (
                  <Button key={product.id} variant="outline" className="h-auto flex flex-col items-start p-3" onClick={() => handleAddItem(product)}>
                      <span className="font-semibold">{product.name}</span>
                      <span className="text-sm text-muted-foreground">R$ {product.price.toFixed(2)}</span>
                  </Button>
                ))}
                 {kitchenProducts.length === 0 && <p className="text-muted-foreground text-sm col-span-full">Nenhum produto da cozinha disponível.</p>}
              </div>
               <h3 className="text-lg font-semibold mb-2">Bar</h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                 {barProducts.map((product) => (
                  <Button key={product.id} variant="outline" className="h-auto flex flex-col items-start p-3" onClick={() => handleAddItem(product)}>
                      <span className="font-semibold">{product.name}</span>
                      <span className="text-sm text-muted-foreground">R$ {product.price.toFixed(2)}</span>
                  </Button>
                ))}
                {barProducts.length === 0 && <p className="text-muted-foreground text-sm col-span-full">Nenhum produto do bar disponível.</p>}
              </div>
              <h3 className="text-lg font-semibold mb-2">Geral</h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                 {generalProducts.map((product) => (
                  <Button key={product.id} variant="outline" className="h-auto flex flex-col items-start p-3" onClick={() => handleAddItem(product)}>
                      <span className="font-semibold">{product.name}</span>
                      <span className="text-sm text-muted-foreground">R$ {product.price.toFixed(2)}</span>
                  </Button>
                ))}
                {generalProducts.length === 0 && <p className="text-muted-foreground text-sm col-span-full">Nenhum produto do departamento geral disponível.</p>}
              </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
         <h1 className="text-4xl font-headline font-bold text-foreground opacity-0">.</h1>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart /> Pedido Atual
                </CardTitle>
                <CardDescription>Itens adicionados a esta comanda.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderItems.length > 0 ? (
                  orderItems.map((item, index) => (
                    <TableRow key={`${item.productId}-${index}`}>
                      <TableCell className="font-medium">
                        {item.name}
                        {item.promotionId && <Badge variant="secondary" className="ml-2">Promo</Badge>}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell className="text-right">R$ {(item.price * item.quantity).toFixed(2)}</TableCell>
                       <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.productId, item.promotionId)} disabled={isSubmitting}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">Nenhum item no pedido.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
           {orderItems.length > 0 && (
            <>
              <Separator />
              <CardFooter className="flex flex-col gap-4 !p-6">
                <div className="w-full flex justify-between text-muted-foreground text-sm">
                    <span>Subtotal</span>
                    <span>R$ {calculateTotal(orderItems).toFixed(2)}</span>
                </div>
                <div className="w-full flex justify-between text-muted-foreground text-sm">
                    <span>Taxa de Serviço (10%)</span>
                    <span>R$ {(calculateTotal(orderItems) * 0.1).toFixed(2)}</span>
                </div>
                <div className="w-full flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>R$ {(calculateTotal(orderItems) * 1.1).toFixed(2)}</span>
                </div>
                <div className="w-full flex gap-2">
                    <Button className="w-full" size="lg" onClick={handleSendOrder} disabled={isSubmitting}>
                        <Send className="mr-2 h-4 w-4" />
                        {isSubmitting ? 'Enviando...' : 'Enviar Pedido'}
                    </Button>
                </div>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
    </>
  )
}
