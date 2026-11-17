import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import { supabase } from '../config/supabase';

function generateValidCPF(): string {
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 9));
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += digits[i] * (10 - i);
  let rest = (sum * 10) % 11;
  const d1 = rest === 10 || rest === 11 ? 0 : rest;
  digits.push(d1);

  sum = 0;
  for (let i = 0; i < 10; i++) sum += digits[i] * (11 - i);
  rest = (sum * 10) % 11;
  const d2 = rest === 10 || rest === 11 ? 0 : rest;
  digits.push(d2);

  return digits.join('');
}

describe('Fluxo de Gestão e Atualização de Produtos (Integração)', () => {
  let adminUserId: string | null = null;
  let adminToken: string | null = null;
  let clienteUserId: string | null = null;
  let clienteToken: string | null = null;
  let createdProdutoId: string | null = null;

  const timestamp = Date.now();
  const adminUser = {
    nome_completo: 'Admin Teste Produto',
    cpf: generateValidCPF(),
    email: `admin_prod_${timestamp}@coffeecakes.test`,
    telefone: '5541988883333',
    password: 'passwordAdminProd123',
  };

  const clienteUser = {
    nome_completo: 'Cliente Teste Produto',
    cpf: generateValidCPF(),
    email: `cliente_prod_${timestamp}@coffeecakes.test`,
    telefone: '5541977772222',
    password: 'passwordClienteProd123',
  };

  beforeAll(async () => {
    // 1. Cadastra admin de teste
    const resRegisterAdmin = await request(app)
      .post('/usuario/register')
      .send(adminUser);

    expect(resRegisterAdmin.status).toBe(201);
    adminUserId = resRegisterAdmin.body?.usuario?.id_usuario;
    expect(adminUserId).toBeTruthy();

    await supabase
      .from('usuario')
      .update({ role: 'admin' })
      .eq('id_usuario', adminUserId!);

    await supabase.auth.admin.updateUserById(adminUserId!, {
      user_metadata: { role: 'admin' },
      app_metadata: { role: 'admin' },
    });

    const resLoginAdmin = await request(app)
      .post('/usuario/login')
      .send({ email: adminUser.email, password: adminUser.password });

    expect(resLoginAdmin.status).toBe(200);
    adminToken = resLoginAdmin.body?.token;
    expect(adminToken).toBeTruthy();

    // 2. Cadastra cliente de teste
    const resRegisterCliente = await request(app)
      .post('/usuario/register')
      .send(clienteUser);

    expect(resRegisterCliente.status).toBe(201);
    clienteUserId = resRegisterCliente.body?.usuario?.id_usuario;
    expect(clienteUserId).toBeTruthy();

    const resLoginCliente = await request(app)
      .post('/usuario/login')
      .send({ email: clienteUser.email, password: clienteUser.password });

    expect(resLoginCliente.status).toBe(200);
    clienteToken = resLoginCliente.body?.token;
    expect(clienteToken).toBeTruthy();
  });

  afterAll(async () => {
    // Limpeza obrigatória dos dados criados no Supabase no afterAll
    try {
      if (createdProdutoId) {
        await supabase.from('produto').delete().eq('id_produto', createdProdutoId);
      }
      if (adminUserId) {
        await supabase.from('usuario').delete().eq('id_usuario', adminUserId);
        await supabase.auth.admin.deleteUser(adminUserId);
      }
      if (clienteUserId) {
        await supabase.from('usuario').delete().eq('id_usuario', clienteUserId);
        await supabase.auth.admin.deleteUser(clienteUserId);
      }
    } catch (err) {
      console.error('Falha na limpeza pós-teste de produtos:', err);
    }
  });

  describe('POST /produto (Criação de produto)', () => {
    it('deve criar um novo produto com sucesso e retornar status 201', async () => {
      expect(adminToken).toBeTruthy();

      const novoProduto = {
        nome_produto: `Cappuccino Especial ${timestamp}`.slice(0, 50),
        preco: 16.5,
        desconto_produto: 2.5,
        imagem_produto: 'https://exemplo.com/cappuccino.png',
        descricao: 'Café expresso cremoso com canela e leite vaporizado',
      };

      const response = await request(app)
        .post('/produto')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(novoProduto);

      expect(response.status).toBe(201);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const produto = response.body[0];
      expect(produto).toHaveProperty('id_produto');
      expect(produto.nome_produto).toBe(novoProduto.nome_produto);
      expect(produto.preco).toBe(16.5);
      expect(produto.desconto_produto).toBe(2.5);

      createdProdutoId = produto.id_produto;
    });

    it('deve falhar com 400 se nome_produto for menor que 3 caracteres', async () => {
      const response = await request(app)
        .post('/produto')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome_produto: 'Oi',
          preco: 10.0,
          imagem_produto: 'https://exemplo.com/img.png',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('erros');
    });
  });

  describe('GET /produto (Listagem de produtos)', () => {
    it('deve listar produtos cadastrados com status 200', async () => {
      const response = await request(app).get('/produto');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      const encontrado = response.body.find(
        (p: { id_produto: string }) => p.id_produto === createdProdutoId
      );
      expect(encontrado).toBeDefined();
    });

    it('deve buscar produto por ID com status 200', async () => {
      expect(createdProdutoId).toBeTruthy();

      const response = await request(app).get(`/produto/${createdProdutoId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id_produto', createdProdutoId);
    });
  });

  describe('PATCH /produto/:id_produto (Atualização de produto já criado)', () => {
    it('deve atualizar o nome_produto e preco com sucesso e retornar status 200 com contrato correto', async () => {
      expect(createdProdutoId).toBeTruthy();
      expect(adminToken).toBeTruthy();

      const nomeAtualizado = `Cappuccino Caramelo ${timestamp}`.slice(0, 50);

      const response = await request(app)
        .patch(`/produto/${createdProdutoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome_produto: nomeAtualizado,
          preco: 19.9,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('mensagem', 'Produto atualizado');
      expect(response.body).toHaveProperty('produto');

      const prodAtualizado = Array.isArray(response.body.produto)
        ? response.body.produto[0]
        : response.body.produto;

      expect(prodAtualizado.nome_produto).toBe(nomeAtualizado);
      expect(prodAtualizado.preco).toBe(19.9);
    });

    it('deve atualizar o desconto_produto de um produto já existente', async () => {
      expect(createdProdutoId).toBeTruthy();
      expect(adminToken).toBeTruthy();

      const response = await request(app)
        .patch(`/produto/${createdProdutoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ desconto_produto: 4.5 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('mensagem', 'Produto atualizado');

      const prodAtualizado = Array.isArray(response.body.produto)
        ? response.body.produto[0]
        : response.body.produto;

      expect(prodAtualizado.desconto_produto).toBe(4.5);
    });

    it('deve atualizar múltiplos campos (nome, preco, desconto, imagem e descricao)', async () => {
      expect(createdProdutoId).toBeTruthy();
      expect(adminToken).toBeTruthy();

      const payload = {
        nome_produto: `Mocha com Chantilly ${timestamp}`.slice(0, 50),
        preco: 22.0,
        desconto_produto: 3.0,
        imagem_produto: 'https://exemplo.com/mocha.png',
        descricao: 'Nova receita com calda de chocolate',
      };

      const response = await request(app)
        .patch(`/produto/${createdProdutoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('mensagem', 'Produto atualizado');

      const prodAtualizado = Array.isArray(response.body.produto)
        ? response.body.produto[0]
        : response.body.produto;

      expect(prodAtualizado.nome_produto).toBe(payload.nome_produto);
      expect(prodAtualizado.preco).toBe(payload.preco);
      expect(prodAtualizado.desconto_produto).toBe(payload.desconto_produto);
      expect(prodAtualizado.imagem_produto).toBe(payload.imagem_produto);
      expect(prodAtualizado.descricao).toBe(payload.descricao);
    });

    it('deve falhar com 400 se o desconto_produto for negativo', async () => {
      expect(createdProdutoId).toBeTruthy();
      expect(adminToken).toBeTruthy();

      const response = await request(app)
        .patch(`/produto/${createdProdutoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ desconto_produto: -5 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('erros');
      expect(response.body.erros).toContain('desconto_produto não pode ser negativo');
    });

    it('deve falhar com 400 se o preco for menor ou igual a 0', async () => {
      expect(createdProdutoId).toBeTruthy();
      expect(adminToken).toBeTruthy();

      const response = await request(app)
        .patch(`/produto/${createdProdutoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ preco: 0 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('erros');
      expect(response.body.erros).toContain('preco deve ser maior que 0');
    });

    it('deve falhar com 400 se nenhum campo válido for fornecido para atualização', async () => {
      expect(createdProdutoId).toBeTruthy();
      expect(adminToken).toBeTruthy();

      const response = await request(app)
        .patch(`/produto/${createdProdutoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('erros');
      expect(response.body.erros).toContain('Nenhum campo válido foi fornecido para atualização');
    });

    it('deve falhar com 401 se a requisição de atualização não contiver token de autenticação', async () => {
      expect(createdProdutoId).toBeTruthy();

      const response = await request(app)
        .patch(`/produto/${createdProdutoId}`)
        .send({ nome_produto: 'Tentativa Sem Token' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('erro');
    });

    it('deve falhar com 403 se um usuário comum (role cliente) tentar atualizar produto', async () => {
      expect(createdProdutoId).toBeTruthy();
      expect(clienteToken).toBeTruthy();

      const response = await request(app)
        .patch(`/produto/${createdProdutoId}`)
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({ nome_produto: 'Tentativa Por Cliente' });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('erro', 'acesso negado, permissão insuficiente');
    });
  });

  describe('PATCH /produto/:id_produto/softdelete (Desativação de produto)', () => {
    it('deve desativar o produto com status 200', async () => {
      expect(createdProdutoId).toBeTruthy();
      expect(adminToken).toBeTruthy();

      const response = await request(app)
        .patch(`/produto/${createdProdutoId}/softdelete`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('mensagem', 'Produto desativado!!');
    });
  });
});
