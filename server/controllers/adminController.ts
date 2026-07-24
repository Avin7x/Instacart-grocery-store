import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import bcrypt from "bcrypt";

// get Admin dashboard data
export const getAdminStats = async (req: Request, res: Response) => {
    const [totalOrders, totalUsers, totalProducts, outOfStock, totalPartners, recentOrders] = await Promise.all([
        prisma.order.count({
            where: {NOT: [{paymentMethod: "card", isPaid: false}]}
        }),
        
        prisma.user.count(),
        prisma.product.count(),
        prisma.product.count({where: {stock: 0}}),
        prisma.deliveryPartner.count(),
        prisma.order.findMany({
            where: {NOT: [{paymentMethod: "card", isPaid: false}]},
            orderBy: {createdAt: "desc"},
            take: 8,
            include: 
            {
                user: {select: {name: true, email:true}},
                deliveryParnet: {select: {name: true, phone: true}}
            }
        })

    ]);

    return res.json({totalOrders, totalUsers, totalProducts, outOfStock, totalPartners, recentOrders});
}

// get delivery partner list for admin
export const getDeliveryPartners = async (req: Request, res: Response) => {
    const partners = await prisma.deliveryPartner.findMany({
        orderBy: {createdAt: "desc"}
    });

    return res.json({partners});
}

// create delivery partner profile
export const createDeliveryPartner = async (req: Request, res: Response) => {
    const { name, email, password, phone, vehicleType } = req.body;
    if(!name || !email || !password || !phone || !vehicleType) {
        return res.status(400).json({message: "Please provide all required fields."});
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const partner = await prisma.deliveryPartner.create({
        data: { name, email: email.trim().toLowerCase(), password: hashedPassword, phone, vehicleType }
    });

    return res.status(201).json({partner});
}

// update delivery partner
export const updateDeliveryPartner = async (req: Request, res: Response) => {
    const { name, email, password, phone, vehicleType } = req.body;

    const data: any = {};
    if(name) data.name = name;
    if(email) data.email = email;
    if(password) data.password = password;
    if(phone) data.phone = phone;
    if(vehicleType) data.vehicleType = vehicleType;

    try {
        const partner = await prisma.deliveryPartner.update({
            where: {id: req.params.id as string},
            data
        });

        return res.json({partner});
    } catch (error) {
        return res.status(404).json({message: "Partner not found."});
    }
}

// assign delivery partner for order
export const assignDeliveryPartner = async (req: Request, res: Response) => {
    const { partnerId } = req.body;

    if (!partnerId) {
        return res.status(400).json({
             message: "Partner ID is required"
        });
    }

    const order = await prisma.order.findUnique({ where: {id: req.params.id as string}});

    if (!order) {
        return res.status(404).json({
            message: "Order not found"
        });
    }

    const partner = await prisma.deliveryPartner.findUnique({ where: {id: partnerId}});

    if (!partner) {
        return res.status(404).json({
            message: "Delivery partner not found"
        });
    }

    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();

    const history: any[] = Array.isArray(order.statusHistory) ? order.statusHistory: [];

    if (!["Placed", "Confirmed"].includes(order.status)) {
        return res.status(400).json({
            message: "Order cannot be assigned."
        });
    }

    
    const status = "Assigned";
    history.push({
        status: "Assigned",
        note: `Assigned to ${partner.name}`,
        timestamp: new Date()
    });
    

    const updatedOrder =await prisma.order.update({
        where: {id: order.id},
        data: {deliveryPartnerId: partner.id, deliveryOtp: otp, status, statusHistory: history}
    });

    return res.json({order: updatedOrder});
}
