import express, { NextFunction, Request, Response } from "express";
import "dotenv/config";
import cors from "cors";
import authRouter from "./routes/authRoute.js";
import productRouter from "./routes/productRoute.js";
import uploadRouter from "./routes/uploadRoutes.js";

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/upload', uploadRouter);

// error handling
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
    console.log(error);
    res.status(500).json({message: error.message});
})

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});