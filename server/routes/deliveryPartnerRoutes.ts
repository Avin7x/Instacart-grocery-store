import express from "express";
import { cancelDelivery, completeDelivery, getDeliveryDetail, getMyDeliveries, loginPartner, updateDeliveryStatus, updateLiveLocation } from "../controllers/deliveryPartnerController.js";
import deliveryAuth from "../middlewares/deliveryAuth.js";

const deliveryPartnerRouter = express.Router();

deliveryPartnerRouter.post('/login', loginPartner);

// All routes below require authentication
deliveryPartnerRouter.use(deliveryAuth);

deliveryPartnerRouter.get('/my-deliveries', getMyDeliveries);

deliveryPartnerRouter.get('/my-deliveries/:id', getDeliveryDetail);

deliveryPartnerRouter.put('/my-deliveries/:id/complete', completeDelivery);

deliveryPartnerRouter.put('/my-deliveries/:id/cancel', cancelDelivery);

deliveryPartnerRouter.put('/my-deliveries/:id/status', updateDeliveryStatus);

deliveryPartnerRouter.put('/my-deliveries/:id/location', updateLiveLocation);


export default deliveryPartnerRouter;