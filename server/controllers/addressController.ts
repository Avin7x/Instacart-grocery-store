import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";


// get user address
// GET /api/addresses
export const getAddresses = async (req: Request, res: Response) => {
    const addresses = await prisma.address.findMany({
        where: {userId: req.user!.id},
        orderBy: {createdAt: "asc"}
    });
    return res.json({addresses});
}

// Add address
// POST /api/addresses
export const addAddress = async (req: Request, res: Response) => {
    const { label, address, city, state, zip, isDefault, lat, lng } = req.body;

    // Required coordinates
    if(lat == null || lng == null){
        return res.status(400).json({message: "Location coordinates are required. Please allow location access."})
    }

    const currentAddresses = await prisma.address.findMany({
        where: {userId: req.user!.id}
    })

    let makeDefault = isDefault;
    if(currentAddresses.length === 0) makeDefault=true;

    // update all addresses default value to false
    if(makeDefault){
        await prisma.address.updateMany({
            where: {userId: req.user!.id},
            data: {isDefault: false}
        });
    }

    await prisma.address.create({
        data: {
            userId: req.user!.id,
            label,
            address,
            city, 
            state, 
            zip, 
            isDefault: makeDefault, 
            lat: Number(lat), 
            lng: Number(lng)

        }
    });

    const addresses = await prisma.address.findMany({
        where: {userId: req.user!.id},
        orderBy: {createdAt: "asc"}
    });

    return res.json({addresses});

}

// update address
// PUT /api/addresses/:id
export const updateAddress = async (req: Request, res: Response) => {
    const { label, address, city, state, zip, isDefault, lat, lng } = req.body;

    // Required coordinates
    if(lat == null || lng == null){
        return res.status(400).json({message: "Location coordinates are required. Please allow location access."})
    }

     // check if address exist
    const existing = await prisma.address.findFirst({
        where: {id: req.params.id as string, userId: req.user!.id}
    });

    if(!existing){
        return res.status(404).json({message: "Address not found"});
    }


    const data: any = {};
    if(label) data.label = label;
    if(address) data.address = address;
    if(city) data.city = city;
    if(state) data.state = state;
    if(zip) data.zip = zip;
    if(isDefault != undefined) data.isDefault = isDefault;
    data.lat = Number(lat);
    data.lng = Number(lng);


    await prisma.$transaction(async (tx) => {
        // Update all addresses' default value to false
        if (isDefault) {
             await tx.address.updateMany({
                where: { userId: req.user!.id },
                data: { isDefault: false }
            });
        }

        // Update the current address
        await tx.address.update({
            where: { id: req.params.id as string },
            data
        });
    });

    // get updated addresses
     const addresses = await prisma.address.findMany({
        where: {userId: req.user!.id},
        orderBy: {createdAt: "asc"}
    });

    return res.json({addresses});

    
}

// Delete address
// DELETE /api/addresses/:id
export const deleteAddress = async (req: Request, res: Response) => {
    const existing = await prisma.address.findFirst({where: {id: req.params.id as string, userId: req.user!.id}});

    if(!existing){
        return res.status(404).json({message: "Address not found."});
    }

    await prisma.address.delete({
        where: {id: req.params.id as string}
    });

    const addresses = await prisma.address.findMany({
        where: {userId: req.user!.id},
        orderBy: {createdAt: "asc"}
    });

    return res.json({addresses});
    
}