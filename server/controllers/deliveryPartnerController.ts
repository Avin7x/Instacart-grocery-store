import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


const generateToken = (id: string) => {
    return jwt.sign({id, role: "delivery"}, process.env.JWT_SECRET as string, {
        expiresIn: "30d"
    });
}

// login partner
// POST /api/delivery/login
export const loginPartner = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if(!email || !password) {
        return res.status(400).json({message: "Please provide all required fields."});
    }

    const partner = await prisma.deliveryPartner.findUnique({
        where: {email: email.trim().toLowerCase()}
    });

    if(!partner) {
        return res.status(400).json({message: "Invalid email or password."})
    }

    if(!partner.isActive){
        return res.status(403).json({message: "Your account has been deactivated."})
    }

    if(!await bcrypt.compare(password.trim(), partner.password)) {
        return res.status(400).json({message: "Invalid email or password."})
    }


    const token = generateToken(partner.id);
    
    const {password: _, ...updatedPartner} = partner;
    
    return res.json({partner: updatedPartner, token});
} 

// Get assigned deliveries
// GET /api/delivery/my-deliveries
export const getMyDeliveries = async (req: Request, res: Response) => {
    const { status } = req.query;

    const where: any = {deliveryPartnerId: req.partner!.id};
    
    if(status === "active"){
        where.status = {in: ["Assigned", "Packed", "Out for delivery"]};
    } else if(status === "completed") {
        where.status = {in: ["Delivered", "Cancelled"]};
    }

    const orders = await prisma.order.findMany({
        where,
        include: {user: {select: {name: true, email: true, phone: true}}},
        orderBy: {createdAt: "desc"}
    });

    return res.json({orders});
}

// Get single delivery detail
// GET /api/delivery/my-deliveries/:id
export const getDeliveryDetail = async (req: Request, res: Response) => {
    const order = await prisma.order.findFirst({
        where: {id: req.params.id as string, deliveryPartnerId: req.partner!.id},
        include: {user: {select: {name: true, email: true, phone: true}}}
    });

    if(!order) {
        return res.status(404).json({message: 'Delivery not found'});
    }

    return res.json({order});
}

// complete delivery with otp
// PUT /api/delivery/my-deliveries/:id/complete
export const completeDelivery = async (req: Request, res: Response) => {
    const { otp } = req.body;

    const order = await prisma.order.findFirst({
        where: {id: req.params.id as string, deliveryPartnerId: req.partner!.id}
    });


    if(!order || order.status === "Cancelled" || order.status === "Delivered") {
        return res.status(400).json({message: "Invalid request"});
    }

    if(order.deliveryOtp !== otp ) {
        return res.status(500).json({message: "Invalid OTP"})
    }

    const history = order.statusHistory as any[];
    history.push({status: "Delivered", note: "Deliveried by partner", timestamp: new Date()});

    const updatedOrder = await prisma.order.update({
        where: {id: order.id},
        data: {status: "Delivered", statusHistory: history, deliveryOtp: ''}
    });

    return res.json({order: updatedOrder, message: "Delivery completed successfully"});
}


// Cancel delivery
// PUT /api/delivery/my-deliveries/:id/cancel
export const cancelDelivery = async (req: Request, res: Response) => {
    const { reason } = req.body;

    const order = await prisma.order.findFirst({
        where: {id: req.params.id as string, deliveryPartnerId: req.partner!.id}
    });

    if(order!.status === "Delivered"){
        return res.status(400).json({message: "Cannot cancel an already delivered order"});
    }
    
    const history = order!.statusHistory as any[];
    history.push({status: "Cancelled", note: reason || "", timestamp: new Date()});

    const updatedOrder = await prisma.order.update({
        where: {id: order!.id},
        data: {status: "Cancelled", statusHistory: history};
    });

    return res.json({order: updatedOrder, message: "Delivery cancelled"});
}

