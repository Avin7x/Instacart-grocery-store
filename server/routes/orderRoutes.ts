import express from "express"
import auth from "../middlewares/auth.js";
import { createOrder, gerOrderLocation, getAllOrders, getOrder, getUserOrders, updateOrderStatus } from "../controllers/orderController.js";
import admin from "../middlewares/admin.js";

const orderRouter = express.Router();

orderRouter.post('/', auth, createOrder);
orderRouter.get('/', auth, getUserOrders);
orderRouter.get('/:id', auth, getOrder);
orderRouter.put('/:id/status', auth, admin, updateOrderStatus);
orderRouter.get('/all', auth, admin, getAllOrders);
orderRouter.get('/:id/location', auth, gerOrderLocation);

export default orderRouter;