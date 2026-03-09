import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, QrCode, Receipt, Tag, User, X, CheckCircle2, ChevronRight } from "lucide-react";

const CATEGORIES = ["All", "Food", "Drinks", "Snacks", "Combos"];

const PRODUCTS = [
  { id: 1, name: "Chicken Adobo Rice", price: 180, category: "Food", emoji: "🍗" },
  { id: 2, name: "Pork Sinigang Set", price: 220, category: "Food", emoji: "🍲" },
  { id: 3, name: "Beef Fried Rice", price: 160, category: "Food", emoji: "🍚" },
  { id: 4, name: "Pancit Canton", price: 150, category: "Food", emoji: "🍜" },
  { id: 5, name: "Bottled Water", price: 30, category: "Drinks", emoji: "💧" },
  { id: 6, name: "Iced Coffee", price: 120, category: "Drinks", emoji: "☕" },
  { id: 7, name: "Mango Juice", price: 85, category: "Drinks", emoji: "🥭" },
  { id: 8, name: "Royal Cola 1L", price: 55, category: "Drinks", emoji: "🥤" },
  { id: 9, name: "Chippy BBQ", price: 35, category: "Snacks", emoji: "🍟" },
  { id: 10, name: "Skyflakes", price: 25, category: "Snacks", emoji: "🍪" },
  { id: 11, name: "Combo Meal A", price: 270, category: "Combos", emoji: "🍱" },
  { id: 12, name: "Combo Meal B", price: 320, category: "Combos", emoji: "🥡" },
];

interface CartItem { id: number; name: string; price: number; qty: number; emoji: string; }

export default function POSScreen() {
  const { currentBusiness } = useApp();
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "qr">("cash");
  const [paid, setPaid] = useState(false);

  const filtered = PRODUCTS.filter(p =>
    (activeCategory === "All" || p.category === activeCategory) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  function addToCart(p: typeof PRODUCTS[0]) {
    setCart(prev => {
      const exists = prev.find(c => c.id === p.id);
      if (exists) return prev.map(c => c.id === p.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...p, qty: 1 }];
    });
  }

  function updateQty(id: number, delta: number) {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c).filter(c => c.qty > 0));
  }

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const discountAmt = subtotal * (discount / 100);
  const total = subtotal - discountAmt;

  function handleConfirmPayment() {
    setPaid(true);
    setTimeout(() => { setPaid(false); setShowPayment(false); setCart([]); setDiscount(0); }, 2500);
  }

  return (
    <AppLayout title="POS Checkout">
      <div className="flex gap-4 h-[calc(100vh-8rem)]">
        {/* Products panel */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Search + categories */}
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3 shadow-card">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="bg-transparent text-sm outline-none flex-1" />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={cn("px-4 py-2 rounded-xl text-sm font-semibold transition-all", activeCategory === cat ? "bg-primary text-primary-foreground shadow-primary" : "bg-card text-muted-foreground border border-border hover:bg-secondary")}>
                {cat}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto scrollbar-thin pb-2">
            {filtered.map(p => {
              const inCart = cart.find(c => c.id === p.id);
              return (
                <motion.button key={p.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => addToCart(p)}
                  className={cn("bg-card border-2 rounded-2xl p-4 text-left transition-all shadow-card relative", inCart ? "border-primary" : "border-border hover:border-primary/40")}>
                  {inCart && <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{inCart.qty}</span>}
                  <div className="text-3xl mb-2">{p.emoji}</div>
                  <p className="text-sm font-semibold text-foreground leading-tight">{p.name}</p>
                  <p className="text-primary font-bold text-base mt-1">₱ {p.price}</p>
                  <p className="text-[10px] text-muted-foreground">{p.category}</p>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Cart panel */}
        <div className="w-80 xl:w-96 flex flex-col bg-card border border-border rounded-2xl shadow-card overflow-hidden flex-shrink-0">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-bold text-foreground">Current Order</h3>
              <p className="text-xs text-muted-foreground">{cart.length} items in cart</p>
            </div>
            <button onClick={() => setCart([])} className="text-xs text-danger hover:bg-danger-muted px-2 py-1 rounded-lg transition-colors">Clear</button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
            {cart.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <ShoppingCartEmpty />
                <p className="text-sm mt-3 font-medium">Cart is empty</p>
                <p className="text-xs">Tap a product to add</p>
              </div>
            )}
            {cart.map(item => (
              <motion.div key={item.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 bg-secondary rounded-xl px-3 py-2.5">
                <span className="text-xl">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-primary font-bold">₱ {item.price}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-secondary"><Minus className="w-3 h-3" /></button>
                  <span className="text-sm font-bold w-5 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-lg bg-primary text-white flex items-center justify-center hover:opacity-90"><Plus className="w-3 h-3" /></button>
                </div>
                <span className="text-xs font-bold text-foreground w-14 text-right">₱ {(item.price * item.qty).toLocaleString()}</span>
              </motion.div>
            ))}
          </div>

          {/* Totals */}
          <div className="p-4 border-t border-border space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Discount</span>
              <div className="ml-auto flex gap-1">
                {[0, 5, 10, 20].map(d => (
                  <button key={d} onClick={() => setDiscount(d)} className={cn("text-xs px-2 py-0.5 rounded-md font-semibold transition-colors", discount === d ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:bg-border")}>
                    {d === 0 ? "None" : `${d}%`}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>₱ {subtotal.toLocaleString()}</span></div>
              {discount > 0 && <div className="flex justify-between text-danger"><span>Discount ({discount}%)</span><span>-₱ {discountAmt.toLocaleString()}</span></div>}
              <div className="flex justify-between font-bold text-lg text-foreground pt-1 border-t border-border"><span>Total</span><span className="text-primary">₱ {total.toLocaleString()}</span></div>
            </div>
            <button onClick={() => cart.length > 0 && setShowPayment(true)} className={cn("w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all", cart.length > 0 ? "gradient-primary text-white shadow-primary hover:opacity-95" : "bg-muted text-muted-foreground cursor-not-allowed")}>
              <CreditCard className="w-4 h-4" /> Proceed to Payment <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Payment modal */}
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
                  <p className="text-muted-foreground text-sm">Total: <span className="text-primary font-bold text-lg">₱ {total.toLocaleString()}</span></p>
                  <p className="text-xs text-muted-foreground">Printing receipt...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-5 border-b border-border">
                    <h3 className="font-bold text-lg text-foreground">Payment</h3>
                    <button onClick={() => setShowPayment(false)} className="p-2 rounded-lg hover:bg-secondary"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="bg-primary/5 rounded-xl p-4 text-center">
                      <p className="text-muted-foreground text-sm">Amount Due</p>
                      <p className="text-4xl font-bold text-primary font-display mt-1">₱ {total.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-2">Payment Method</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: "cash", icon: Banknote, label: "Cash" },
                          { key: "card", icon: CreditCard, label: "Card" },
                          { key: "qr", icon: QrCode, label: "QR Pay" },
                        ].map(({ key, icon: Icon, label }) => (
                          <button key={key} onClick={() => setPaymentMethod(key as any)} className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all", paymentMethod === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/30")}>
                            <Icon className={cn("w-6 h-6", paymentMethod === key ? "text-primary" : "text-muted-foreground")} />
                            <span className="text-xs font-semibold">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <button onClick={handleConfirmPayment} className="w-full py-4 gradient-primary text-white rounded-xl font-bold text-base shadow-primary hover:opacity-95 transition-opacity flex items-center justify-center gap-2">
                      <Receipt className="w-5 h-5" /> Confirm {paymentMethod === "cash" ? "Cash" : paymentMethod === "card" ? "Card" : "QR"} Payment
                    </button>
                  </div>
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
