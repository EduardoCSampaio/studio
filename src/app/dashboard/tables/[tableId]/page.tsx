
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
import { ShoppingCart, Trash2, Printer } from "lucide-react"
import { type OrderItem, type Product, type Customer } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { Separator } from "@/components/ui/separator"
import { collection, getDocs, doc, getDoc, query, where, addDoc, serverTimestamp, getDocs as getDocsFromQuery } from "firebase/firestore"
import { db } from "@/lib/firebase"


function PrintableReceipt({ items, department, comandaId, tableId, waiterName }: { items: OrderItem[], department: 'Cozinha' | 'Bar', comandaId: string, tableId?: string | null, waiterName: string }) {
    if (items.length === 0) return null;

    return (
        <div className="p-4 bg-white text-black font-mono text-sm border border-dashed border-black mb-4 w-full">
            <div className="text-center mb-4">
                <h2 className="text-lg font-bold">RestoTrack</h2>
                <p>Comanda: #{comandaId} {tableId ? `| Mesa: ${tableId}`: ''}</p>
                <p>Garçom: {waiterName}</p>
                <p>{new Date().toLocaleString()}</p>
            </div>
             <div className="mb-4">
                <h3 className="font-bold border-b border-dashed border-black text-center">--- {department.toUpperCase()} ---</h3>
                {items.map(item => (
                    <p key={item.productId}>{item.quantity}x {item.name}</p>
                ))}
            </div>
        </div>
    );
}

export default function OrderPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  // The param is now a wristbandId, but we keep the name for route consistency
  const wristbandId = params.tableId as string;
  const tableIdFromQuery = searchParams.get('tableId');
  
  const [orderItems, setOrderItems] = React.useState<OrderItem[]>([])
  const [allProducts, setAllProducts] = React.useState<Product[]>([]);
  const [customer, setCustomer] = React.useState<Customer | null>(null);
  const [pageTitle, setPageTitle] = React.useState<string>(`Comanda...`);
  const [printableOrder, setPrintableOrder] = React.useState<OrderItem[] | null>(null);
  
  const printRef = React.useRef<HTMLDivElement>(null);


  React.useEffect(() => {
    async function fetchData() {
      // Fetch all products for the menu
      const productsCol = collection(db, 'products');
      const productSnapshot = await getDocs(productsCol);
      const productList = productSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setAllProducts(productList);

      // Fetch the customer data using the wristbandId
      if (wristbandId) {
          const customersRef = collection(db, "customers");
          const q = query(customersRef, where("wristbandId", "==", parseInt(wristbandId, 10)));
          const querySnapshot = await getDocsFromQuery(q);

          if (!querySnapshot.empty) {
            const customerDoc = querySnapshot.docs[0];
            const customerData = { id: customerDoc.id, ...customerDoc.data() } as Customer;
            setCustomer(customerData);
            setPageTitle(`Comanda #${wristbandId} - ${customerData.name}`);
          } else {
            setPageTitle(`Detalhes da Comanda #${wristbandId}`);
          }
      }
      
      setOrderItems([]);
    }

    fetchData();
  }, [wristbandId]);

  React.useEffect(() => {
    if (printableOrder && printRef.current) {
        window.print();
        setPrintableOrder(null); 
    }
  }, [printableOrder]);


  const handleAddItem = (product: Product) => {
    setOrderItems(prevItems => {
      const existingItem = prevItems.find(item => item.productId === product.id)
      if (existingItem) {
        return prevItems.map(item =>
          item.productId === product.id
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
  
  const handleRemoveItem = (productId: string) => {
    setOrderItems(prevItems => {
        const existingItem = prevItems.find(item => item.productId === productId);
        if (existingItem && existingItem.quantity > 1) {
            return prevItems.map(item => 
                item.productId === productId 
                    ? { ...item, quantity: item.quantity - 1 } 
                    : item
            );
        }
        return prevItems.filter(item => item.productId !== productId);
    });
  };


  const calculateTotal = (items: OrderItem[]) => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const handleSendOrder = async () => {
    if (!user) {
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
    
    try {
      const kitchenItems = orderItems.filter(item => item.department === 'Cozinha');
      const barItems = orderItems.filter(item => item.department === 'Bar');

      const baseOrderData = {
          comandaId: wristbandId,
          customerId: customer?.id,
          customerName: customer?.name,
          waiterId: user.id,
          waiterName: user.name,
          status: 'Pending' as const,
          createdAt: serverTimestamp(),
          tableId: tableIdFromQuery ? parseInt(tableIdFromQuery, 10) : customer?.tableId || null,
      };

      if (kitchenItems.length > 0) {
          const kitchenOrder = {
              ...baseOrderData,
              items: kitchenItems,
              total: calculateTotal(kitchenItems),
          };
          await addDoc(collection(db, "orders"), kitchenOrder);
      }
      
      if (barItems.length > 0) {
           const barOrder = {
              ...baseOrderData,
              items: barItems,
              total: calculateTotal(barItems),
          };
          await addDoc(collection(db, "orders"), barOrder);
      }

      toast({
        title: "Pedido(s) Enviado(s)!",
        description: `O pedido para a comanda ${wristbandId} foi enviado para os respectivos departamentos.`,
      })

      if (user.role === 'Garçom') {
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
    }
  }

  const handlePrint = () => {
    if (orderItems.length > 0) {
        setPrintableOrder(orderItems);
    } else {
        toast({
            variant: "destructive",
            title: "Pedido Vazio",
            description: "Não há itens para imprimir."
        });
    }
  }


  const kitchenProducts = allProducts.filter(p => p.department === "Cozinha")
  const barProducts = allProducts.filter(p => p.department === "Bar")
  
  return (
    <>
    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <h1 className="text-4xl font-headline font-bold text-foreground">{pageTitle}</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Menu de Produtos</CardTitle>
            <CardDescription>Adicione itens ao pedido da comanda.</CardDescription>
          </CardHeader>
          <CardContent>
              <h3 className="text-lg font-semibold mb-2">Cozinha</h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {kitchenProducts.map((product) => (
                  <Button key={product.id} variant="outline" className="h-auto flex flex-col items-start p-3" onClick={() => handleAddItem(product)}>
                      <span className="font-semibold">{product.name}</span>
                      <span className="text-sm text-muted-foreground">${product.price.toFixed(2)}</span>
                  </Button>
                ))}
                 {kitchenProducts.length === 0 && <p className="text-muted-foreground text-sm col-span-full">Nenhum produto da cozinha disponível.</p>}
              </div>
               <h3 className="text-lg font-semibold mb-2">Bar</h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                 {barProducts.map((product) => (
                  <Button key={product.id} variant="outline" className="h-auto flex flex-col items-start p-3" onClick={() => handleAddItem(product)}>
                      <span className="font-semibold">{product.name}</span>
                      <span className="text-sm text-muted-foreground">${product.price.toFixed(2)}</span>
                  </Button>
                ))}
                {barProducts.length === 0 && <p className="text-muted-foreground text-sm col-span-full">Nenhum produto do bar disponível.</p>}
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
                  orderItems.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                       <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.productId)}>
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
                <div className="w-full flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${calculateTotal(orderItems).toFixed(2)}</span>
                </div>
                <div className="w-full flex gap-2">
                    <Button className="w-full" size="lg" variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir Comanda
                    </Button>
                    <Button className="w-full" size="lg" onClick={handleSendOrder}>Enviar Pedido</Button>
                </div>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
    
    <div className="printable-area" ref={printRef}>
        {printableOrder && (
            <>
                <PrintableReceipt
                    items={printableOrder.filter(item => item.department === 'Cozinha')}
                    department="Cozinha"
                    comandaId={wristbandId}
                    tableId={tableIdFromQuery}
                    waiterName={user?.name || 'N/A'}
                />
                <PrintableReceipt
                    items={printableOrder.filter(item => item.department === 'Bar')}
                    department="Bar"
                    comandaId={wristbandId}
                    tableId={tableIdFromQuery}
                    waiterName={user?.name || 'N/A'}
                />
            </>
        )}
    </div>
    </>
  )
}
