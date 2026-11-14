import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import pedidoRoutes from './routes/pedidoRoutes';
import produtoRoutes from './routes/produtoRoutes';
import usuarioRoutes from './routes/usuarioRoutes';
import enderecoRoutes from './routes/enderecoRoutes';
import categoriaRoutes from './routes/categoriaRoutes';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/pedido', pedidoRoutes);
app.use('/produto', produtoRoutes);
app.use('/usuario', usuarioRoutes);
app.use('/endereco', enderecoRoutes);
app.use('/categoria', categoriaRoutes);

app.get('/', (req: Request, res: Response) => {
    res.json({ 
        status: "Sucesso", 
        mensagem: "☕ API do Coffee & Cakes rodando 100% em TypeScript!" 
    });
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`\n✅ SUCESSO: Servidor TS ativo na porta ${PORT}!\n`);
    });
}

export { app };
export default app;
