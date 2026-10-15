import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

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