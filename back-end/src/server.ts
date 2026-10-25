import 'dotenv/config';
import express, { Request, Response } from 'express';
import pedidoRoutes from './routes/pedidoRoutes';
import produtoRoutes from './routes/produtoRoutes';

const app = express();
app.use(express.json());
app.use('/pedidos', pedidoRoutes);
app.use('/produtos', produtoRoutes);

app.get('/', (req: Request, res: Response) => {
    res.json({ 
        status: "Sucesso", 
        mensagem: "☕ API do Coffee & Cakes rodando 100% em TypeScript!" 
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n✅ SUCESSO: Servidor TS ativo na porta ${PORT}!\n`);
});