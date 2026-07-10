import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { CartItem, Product } from "../types";

interface CartContextType {
    items: CartItem[];          
    addToCart: (product: Product, quantity?: number ) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    cartCount: number;
    cartTotal: number;
    isCartOpen: boolean;
    setIsCartOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({children} : {children : ReactNode}) {
    const [items, setItems] = useState<CartItem[]>(() => {
        const saved = localStorage.getItem("app_cart");
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem("app_cart", JSON.stringify(items));
    }, [items]);

    const [ isCartOpen, setIsCartOpen ] = useState(false);
    let cartCount = items.length;
    let cartTotal = items.reduce((sum, item) => sum+item.product.price * item.quantity, 0);
    

    const addToCart = (product: Product, quantity=1)=> {
        setItems((prev) => {
            const existing = prev.find((item) => item.product._id === product._id);
            if(existing){
                return prev.map((item) => item.product._id === product._id ? {...item, quantity: item.quantity + quantity} : item)
            }
            return [...prev, {product, quantity}];
        })
        setIsCartOpen(true);

    }

    const removeFromCart = (productId: string) => {
        setItems((prev) => (
            prev.filter((item) => item.product._id !== productId)
        ))
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if(quantity <= 0){
            return removeFromCart(productId);
        }
        setItems((prev) => (
             prev.map((item) => item.product._id === productId ? {...item, quantity}: item)
        ))
    }

    const clearCart = () => {
        setItems([]);
        setIsCartOpen(false);
    }

    return <CartContext.Provider value={{
        items,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen
    }}>
        {children}
    </CartContext.Provider >
}

export function useCart () {
    const context = useContext(CartContext);
    if(!context) throw new Error("use cart must be used within cartProvider");
    return context;
}