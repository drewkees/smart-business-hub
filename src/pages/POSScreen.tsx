import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Minus, CreditCard, Banknote, QrCode, Receipt, Tag, X, CheckCircle2, ChevronRight, Package, Loader2 } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createStockMovement, listInventoryItems, type InventoryItemRow } from "@/lib/inventory";
import { listItemCategories } from "@/lib/itemCategories";
import { createOrder } from "@/lib/orders";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  photoUrl: string | null;
  currentStock: number;
};

type CartItem = Product & { qty: number };

const DEMO_PRODUCTS: Product[] = [
  { id: "1", name: "Chicken Adobo Rice", price: 180, category: "Food", photoUrl: null, currentStock: 999 },
  { id: "2", name: "Pork Sinigang Set", price: 220, category: "Food", photoUrl: null, currentStock: 999 },
  { id: "3", name: "Bottled Water", price: 30, category: "Drinks", photoUrl: null, currentStock: 999 },
  { id: "4", name: "Combo Meal A", price: 270, category: "Combos", photoUrl: null, currentStock: 999 },
];

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function ProductImage({ photoUrl, name }: { photoUrl: string | null; name: string }) {
  if (photoUrl) {
    return <img src={photoUrl} alt={name} className="w-14 h-14 rounded-xl object-cover border border-border mb-2" />;
  }
  return (
    <div className="w-14 h-14 rounded-xl border border-border bg-secondary flex items-center justify-center mb-2">
      <Package className="w-6 h-6 text-muted-foreground" />
    </div>
  );
}

export default function POSScreen() {
  const { currentBusiness, currentBranch } = useApp();
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"customer" | "payment">("customer");
  const [customerName, setCustomerName] = useState("");
  const [customerStepError, setCustomerStepError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "qr">("cash");
  const [paid, setPaid] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  function showStockToast(title: string, description: string) {
    toast({
      variant: "destructive",
      title,
      description,
    });
  }

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoadingProducts(true);

        if (!isSupabaseConfigured || !isUuid(currentBusiness.id)) {
          if (!active) return;
          setProducts(DEMO_PRODUCTS);
          setCategories(["All", ...Array.from(new Set(DEMO_PRODUCTS.map((p) => p.category)))]);
          return;
        }

        const [itemRows, categoryRows] = await Promise.all([
          listInventoryItems(currentBusiness.id),
          listItemCategories(currentBusiness.id),
        ]);
        if (!active) return;

        const mappedProducts: Product[] = itemRows.map((row: InventoryItemRow) => ({
          id: row.id,
          name: row.name,
          price: Number(row.unit_price ?? 0),
          category: row.category || "General",
          photoUrl: row.photo_url ?? null,
          currentStock: Number(row.current_stock ?? 0),
        }));

        const dbCategories = categoryRows.filter((c) => c.is_active).map((c) => c.name.trim()).filter(Boolean);
        const itemCategories = mappedProducts.map((p) => p.category).filter(Boolean);
        const allCategories = Array.from(new Set(["All", ...dbCategories, ...itemCategories]));

        setProducts(mappedProducts);
        setCategories(allCategories);
      } catch {
        if (active) {
          setProducts(DEMO_PRODUCTS);
          setCategories(["All", ...Array.from(new Set(DEMO_PRODUCTS.map((p) => p.category)))]);
        }
      } finally {
        if (active) setLoadingProducts(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [currentBusiness.id]);

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (activeCategory === "All" || p.category === activeCategory) &&
          p.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [products, activeCategory, search],
  );

  const stockByItem = useMemo(
    () => new Map(products.map((product) => [product.id, Number(product.currentStock ?? 0)])),
    [products],
  );

  const totalCartQty = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart]);

  function addToCart(p: Product) {
    setCart((prev) => {
      const available = Number(stockByItem.get(p.id) ?? 0);
      const exists = prev.find((c) => c.id === p.id);
      if (exists) {
        const nextQty = exists.qty + 1;
        if (nextQty > available) {
          showStockToast("Insufficient Stock", `${p.name} has only ${available} item(s) available.`);
          return prev;
        }
        return prev.map((c) => (c.id === p.id ? { ...c, qty: nextQty } : c));
      }
      if (available <= 0) {
        showStockToast("Out Of Stock", `${p.name} is currently out of stock.`);
        return prev;
      }
      return [...prev, { ...p, qty: 1 }];
    });
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) => {
      const row = prev.find((c) => c.id === id);
      if (!row) return prev;

      const nextQty = Math.max(0, row.qty + delta);
      const available = Number(stockByItem.get(id) ?? 0);

      if (delta > 0 && nextQty > available) {
        showStockToast("Insufficient Stock", `${row.name} has only ${available} item(s) available.`);
        return prev;
      }

      return prev.map((c) => (c.id === id ? { ...c, qty: nextQty } : c)).filter((c) => c.qty > 0);
    });
  }

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const discountAmt = subtotal * (discount / 100);
  const total = subtotal - discountAmt;

  function openCheckout() {
    if (!cart.length) return;
    const insufficient = cart
      .map((line) => ({
        name: line.name,
        requested: line.qty,
        available: Number(stockByItem.get(line.id) ?? 0),
      }))
      .filter((line) => line.requested > line.available);

    if (insufficient.length > 0) {
      const details = insufficient.map((line) => `${line.name} (${line.available} left)`).join(", ");
      showStockToast("Cannot Proceed To Checkout", `Insufficient stock for: ${details}`);
      return;
    }

    setShowPayment(true);
    setCheckoutStep("customer");
    setCustomerName("");
    setCustomerStepError(null);
    setPaymentError(null);
    setPaymentMethod("cash");
  }

  function continueToPaymentMethod() {
    const name = customerName.trim();
    if (!name) {
      setCustomerStepError("Customer name is required.");
      return;
    }
    setCustomerStepError(null);
    setCheckoutStep("payment");
  }

  function closePaymentModal() {
    if (processingPayment) return;
    setShowPayment(false);
    setCheckoutStep("customer");
    setCustomerStepError(null);
    setPaymentError(null);
  }

  async function handleConfirmPayment() {
    if (!cart.length || processingPayment) return;

    try {
      setProcessingPayment(true);
      setPaymentError(null);

      if (isSupabaseConfigured && isUuid(currentBusiness.id)) {
        const latestItems = await listInventoryItems(currentBusiness.id);
        const stockMap = new Map(latestItems.map((item) => [item.id, Number(item.current_stock ?? 0)]));
        const insufficient = cart
          .map((line) => {
            const available = Number(stockMap.get(line.id) ?? 0);
            return {
              name: line.name,
              requested: line.qty,
              available,
            };
          })
          .filter((line) => line.requested > line.available);

        if (insufficient.length > 0) {
          const details = insufficient.map((line) => `${line.name} (${line.available} left)`).join(", ");
          throw new Error(`Insufficient stock: ${details}`);
        }

        const orderId = await createOrder({
          businessId: currentBusiness.id,
          branchId: isUuid(currentBranch.id) ? currentBranch.id : null,
          customerName: customerName.trim() || "Walk-in",
          paymentMethod,
          status: "completed",
          discountAmount: discountAmt,
          items: cart.map((item) => ({
            itemId: item.id,
            itemName: item.name,
            quantity: item.qty,
            unitPrice: item.price,
          })),
        });

        await Promise.all(
          cart.map((item) =>
            createStockMovement({
              businessId: currentBusiness.id,
              branchId: isUuid(currentBranch.id) ? currentBranch.id : null,
              itemId: item.id,
              movementType: "out",
              quantity: item.qty,
              referenceType: "order",
              referenceId: orderId,
              notes: `POS checkout (${paymentMethod})`,
            }),
          ),
        );
      }

      setPaid(true);
      setTimeout(() => {
        setPaid(false);
        setShowPayment(false);
        setCheckoutStep("customer");
        setCustomerName("");
        setCustomerStepError(null);
        setPaymentError(null);
        setCart([]);
        setDiscount(0);
      }, 2500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save order.";
      setPaymentError(message);
    } finally {
      setProcessingPayment(false);
    }
  }

  return (
    <AppLayout title="POS Checkout">
      <div className="flex gap-4 h-[calc(100vh-8rem)]">
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3 shadow-card">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="bg-transparent text-sm outline-none flex-1"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-primary"
                    : "bg-card text-muted-foreground border border-border hover:bg-secondary",
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto scrollbar-thin pb-2">
            {loadingProducts ? (
              <>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="bg-card border border-border rounded-2xl p-4 shadow-card space-y-2">
                    <Skeleton className="h-14 w-14 rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                ))}
              </>
            ) : filtered.length === 0 ? (
              <div className="col-span-full text-center text-sm text-muted-foreground py-10">No products found.</div>
            ) : (
              filtered.map((p) => {
                const inCart = cart.find((c) => c.id === p.id);
                return (
                  <motion.button
                    key={p.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => addToCart(p)}
                    className={cn(
                      "bg-card border-2 rounded-2xl p-4 text-left transition-all shadow-card relative",
                      inCart ? "border-primary" : "border-border hover:border-primary/40",
                    )}
                  >
                    {inCart && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                        {inCart.qty}
                      </span>
                    )}
                    <ProductImage photoUrl={p.photoUrl} name={p.name} />
                    <p className="text-sm font-semibold text-foreground leading-tight">{p.name}</p>
                    <p className="text-primary font-bold text-base mt-1">P {p.price}</p>
                    <div className="mt-1 flex items-end justify-between">
                      <p className="text-[10px] text-muted-foreground">{p.category}</p>
                      <p className="text-sm font-bold text-foreground">Qty {p.currentStock}</p>
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
        </div>

        <div className="w-80 xl:w-96 flex flex-col bg-card border border-border rounded-2xl shadow-card overflow-hidden flex-shrink-0">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-bold text-foreground">Current Order</h3>
              <p className="text-xs text-muted-foreground">{cart.length} items in cart</p>
            </div>
            <button onClick={() => setCart([])} className="text-xs text-danger hover:bg-danger-muted px-2 py-1 rounded-lg transition-colors">
              Clear
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
            {cart.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <ShoppingCartEmpty />
                <p className="text-sm mt-3 font-medium">Cart is empty</p>
                <p className="text-xs">Tap a product to add</p>
              </div>
            )}
            {cart.map((item) => (
              <motion.div key={item.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 bg-secondary rounded-xl px-3 py-2.5">
                <ProductImage photoUrl={item.photoUrl} name={item.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-primary font-bold">P {item.price}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-secondary">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-bold w-5 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-lg bg-primary text-white flex items-center justify-center hover:opacity-90">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-xs font-bold text-foreground w-14 text-right">P {(item.price * item.qty).toLocaleString()}</span>
              </motion.div>
            ))}
          </div>

          <div className="p-4 border-t border-border space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Discount</span>
              <div className="ml-auto flex gap-1">
                {[0, 5, 10, 20].map((d) => (
                  <button key={d} onClick={() => setDiscount(d)} className={cn("text-xs px-2 py-0.5 rounded-md font-semibold transition-colors", discount === d ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:bg-border")}>
                    {d === 0 ? "None" : `${d}%`}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Total Cart Qty</span><span>{totalCartQty}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>P {subtotal.toLocaleString()}</span></div>
              {discount > 0 && <div className="flex justify-between text-danger"><span>Discount ({discount}%)</span><span>-P {discountAmt.toLocaleString()}</span></div>}
              <div className="flex justify-between font-bold text-lg text-foreground pt-1 border-t border-border"><span>Total</span><span className="text-primary">P {total.toLocaleString()}</span></div>
            </div>
            <button onClick={openCheckout} className={cn("w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all", cart.length > 0 ? "gradient-primary text-white shadow-primary hover:opacity-95" : "bg-muted text-muted-foreground cursor-not-allowed")}>
              <CreditCard className="w-4 h-4" /> Proceed to Payment <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPayment && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-card rounded-2xl shadow-card-lg border border-border w-full max-w-md overflow-hidden">
              {paid ? (
                <div className="p-10 flex flex-col items-center gap-4">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                    <CheckCircle2 className="w-20 h-20 text-success" />
                  </motion.div>
                  <h2 className="text-2xl font-bold font-display text-foreground">Payment Successful!</h2>
                  <p className="text-muted-foreground text-sm">Total: <span className="text-primary font-bold text-lg">P {total.toLocaleString()}</span></p>
                  <p className="text-xs text-muted-foreground">Printing receipt...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-5 border-b border-border">
                    <h3 className="font-bold text-lg text-foreground">Payment</h3>
                    <button onClick={closePaymentModal} className="p-2 rounded-lg hover:bg-secondary"><X className="w-4 h-4" /></button>
                  </div>
                  {checkoutStep === "customer" ? (
                    <div className="p-5 space-y-4">
                      <div className="bg-primary/5 rounded-xl p-4 text-center">
                        <p className="text-muted-foreground text-sm">Amount Due</p>
                        <p className="text-4xl font-bold text-primary font-display mt-1">P {total.toLocaleString()}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">Customer Name</p>
                        <input
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Enter customer name"
                          className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none"
                          autoFocus
                        />
                        {customerStepError && (
                          <p className="text-sm text-danger">{customerStepError}</p>
                        )}
                      </div>
                      <button
                        onClick={continueToPaymentMethod}
                        className="w-full py-4 gradient-primary text-white rounded-xl font-bold text-base shadow-primary hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
                      >
                        Continue to Payment Method <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="p-5 space-y-4">
                      <div className="bg-primary/5 rounded-xl p-4 text-center">
                        <p className="text-muted-foreground text-sm">Amount Due</p>
                        <p className="text-4xl font-bold text-primary font-display mt-1">P {total.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">Customer: {customerName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-2">Payment Method</p>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: "cash", icon: Banknote, label: "Cash" },
                            { key: "card", icon: CreditCard, label: "Card" },
                            { key: "qr", icon: QrCode, label: "QR Pay" },
                          ].map(({ key, icon: Icon, label }) => (
                            <button key={key} onClick={() => setPaymentMethod(key as "cash" | "card" | "qr")} className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all", paymentMethod === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/30")}>
                              <Icon className={cn("w-6 h-6", paymentMethod === key ? "text-primary" : "text-muted-foreground")} />
                              <span className="text-xs font-semibold">{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      {paymentError && (
                        <div className="rounded-lg border border-danger/30 bg-danger-muted/60 px-3 py-2 text-sm text-danger">
                          {paymentError}
                        </div>
                      )}
                      <button
                        onClick={handleConfirmPayment}
                        disabled={processingPayment}
                        className="w-full py-4 gradient-primary text-white rounded-xl font-bold text-base shadow-primary hover:opacity-95 transition-opacity flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                        {processingPayment ? <Loader2 className="w-5 h-5 animate-spin" /> : <Receipt className="w-5 h-5" />}
                        {processingPayment
                          ? "Processing..."
                          : `Confirm ${paymentMethod === "cash" ? "Cash" : paymentMethod === "card" ? "Card" : "QR"} Payment`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

function ShoppingCartEmpty() {
  return (
    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
      <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    </div>
  );
}
