import 'dotenv/config';
import express, { Request, Response } from 'express';
import pedidoRoutes from './routes/pedidoRoutes';
import produtoRoutes from './routes/produtoRoutes';
import usuarioRoutes from './routes/usuarioRoutes'
import enderecoRoutes from './routes/enderecoRoutes'
import produtoPedidoRoutes from './routes/produtoPedidoRoutes'
import categoriaRoutes from './routes/categoriaRoutes'


const app = express();
app.use(express.json());
app.use('/pedido', pedidoRoutes);
app.use('/produto', produtoRoutes);
app.use('/usuario', usuarioRoutes);
app.use('/endereco', enderecoRoutes);
app.use('/produtoPedido', produtoPedidoRoutes);
app.use('/categoria', categoriaRoutes);

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