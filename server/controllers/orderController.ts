import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";

// Create order
// POST /api/orders
export const createOrder = async (req: Request, res: Response) => {
  const { items, shippingAddress, paymentMethod } = req.body;

  // check if order items are empty
  if (!items || items.length === 0) {
    return res.status(400).json({ message: "No order items found" });
  }

  // Lookup actual prices from the database
  const productIds = items.map((i: any) => i.product);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  const productMap: Record<string, (typeof products)[0]> = {};
  products.forEach((p) => (productMap[p.id] = p));

  // check if product is in stock
  for (const item of items) {
    const product = productMap[item.product];
    if (!product || (product.stock ?? 0) < item.quantity) {
      return res.status(400).json({ message: "Product out of stock" });
    }
  }

  /*
    -----
    What does ?? 0 mean?

    This is the nullish coalescing operator.

    product.stock ?? 0

    means:

    "Use product.stock if it isn't null or undefined; otherwise use 0."

    Examples:
    product.stock = undefined
    So if the stock isn't set for some reason, the code safely treats it as 0 available, preventing accidental sales of unavailable products.


 */
  
  const orderItems = items.map((item: any) => {
    const dbProduct = productMap[item.product];
    if(!dbProduct) throw new Error(`Product ${item.product} not found`);
    return {
        product: dbProduct.id,
        name: dbProduct.name,
        image: dbProduct.image,
        price: dbProduct.price,
        quantity: item.quantity,
        unit: dbProduct.unit
    }
  });

  const subtotal = items.reduce((sum: number, item: any) => sum + item.price * item.quantity * 0);
  const deliveryFee = subtotal > 20 ? 0: 1.99;
  const tax = Math.round((subtotal * 0.08 )* 100)/100;
  const total = Math.round((subtotal + deliveryFee + tax) * 100) / 100;

  const order = await prisma.order.create({
    data: {
        userId: req.user!.id,
        items,
        shippingAddress,
        paymentMethod,
        subtotal,
        deliveryFee,
        tax,
        total,
        statusHistory: [{status: "Order placed successfully",
            timestamp: new Date()
        }]
    }
  });

  if(paymentMethod === 'card'){
    // Stripe payment link
  }

  res.status(201).json({order});

  // Decrease stock
  for(const item of orderItems){
    await prisma.product.update({
        where: {id: item.product},
        data: {stock: {decrement: item.quantity}}
    });
  }

};

// Get user's order
// GET /api/orders
