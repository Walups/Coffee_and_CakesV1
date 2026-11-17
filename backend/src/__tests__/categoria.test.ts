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

describe('Fluxo de Gestão e Atualização de Categorias (Integração)', () => {
  let adminUserId: string | null = null;
  let adminToken: string | null = null;
  let clienteUserId: string | null = null;
  let clienteToken: string | null = null;
  let createdCategoriaId: string | null = null;

  const timestamp = Date.now();
  const adminUser = {
    nome_completo: 'Admin Teste Categoria',
    cpf: generateValidCPF(),
    email: `admin_cat_${timestamp}@coffeecakes.test`,
    telefone: '5541988887777',
    password: 'passwordAdmin123',
  };

  const clienteUser = {
    nome_completo: 'Cliente Teste Categoria',
    cpf: generateValidCPF(),
    email: `cliente_cat_${timestamp}@coffeecakes.test`,
    telefone: '5541977776666',
    password: 'passwordCliente123',
  };

  beforeAll(async () => {
    // 1. Cadastra usuário admin de teste
    const resRegisterAdmin = await request(app)
      .post('/usuario/register')
      .send(adminUser);

    expect(resRegisterAdmin.status).toBe(201);
    adminUserId = resRegisterAdmin.body?.usuario?.id_usuario;
    expect(adminUserId).toBeTruthy();

    // Promove usuário de teste para 'admin' tanto na tabela pública quanto nos metadados do auth
    const updateResult = await supabase
      .from('usuario')
      .update({ role: 'admin' })
      .eq('id_usuario', adminUserId!)
      .select();

    expect(updateResult.error).toBeNull();

    await supabase.auth.admin.updateUserById(adminUserId!, {
      user_metadata: { role: 'admin' },
      app_metadata: { role: 'admin' },
    });

    // Login do admin para obter token
    const resLoginAdmin = await request(app)
      .post('/usuario/login')
      .send({ email: adminUser.email, password: adminUser.password });

    expect(resLoginAdmin.status).toBe(200);
    adminToken = resLoginAdmin.body?.token;
    expect(adminToken).toBeTruthy();

    // 2. Cadastra usuário cliente de teste para validação de role
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
    // Limpeza obrigatória dos dados criados no Supabase
    try {
      if (createdCategoriaId) {
        await supabase.from('categoria').delete().eq('id_categoria', createdCategoriaId);
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
      console.error('Falha na limpeza pós-teste de categorias:', err);
    }
  });

  describe('POST /categoria (Criação de categoria)', () => {
    it('deve criar uma nova categoria com sucesso e retornar status 201', async () => {
      expect(adminToken).toBeTruthy();

      const novaCategoria = {
        nome_categoria: `Cafés Especiais ${timestamp}`,
        desconto_categoria: 0.1,
        img_banner: 'https://exemplo.com/banner_cafe.jpg',
      };

      const response = await request(app)
        .post('/categoria')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(novaCategoria);

      if (response.status !== 201) {
        console.error('ERRO NO POST /categoria:', response.body);
      }

      expect(response.status).toBe(201);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const categoria = response.body[0];
      expect(categoria).toHaveProperty('id_categoria');
      expect(categoria.nome_categoria).toBe(novaCategoria.nome_categoria);
      expect(categoria.desconto_categoria).toBe(0.1);
      expect(categoria.img_banner).toBe(novaCategoria.img_banner);

      createdCategoriaId = categoria.id_categoria;
    });

    it('deve retornar 400 se nome_categoria for menor que 3 caracteres', async () => {
      const response = await request(app)
        .post('/categoria')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome_categoria: 'Ca' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('erros');
    });
  });

  describe('GET /categoria (Listagem de categorias)', () => {
    it('deve listar categorias com status 200', async () => {
      const response = await request(app).get('/categoria');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const encontrada = response.body.find(
        (c: { id_categoria: string }) => c.id_categoria === createdCategoriaId
      );
      expect(encontrada).toBeDefined();
    });

    it('deve buscar categoria por ID com status 200', async () => {
      expect(createdCategoriaId).toBeTruthy();

      const response = await request(app).get(`/categoria/${createdCategoriaId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id_categoria', createdCategoriaId);
    });
  });

  describe('PATCH /categoria/:id_categoria (Atualização de categoria já criada)', () => {
    it('deve atualizar o nome_categoria com sucesso e retornar status 200 com contrato correto', async () => {
      expect(createdCategoriaId).toBeTruthy();
      expect(adminToken).toBeTruthy();

      const nomeAtualizado = `Cafés Gourmet Atualizado ${timestamp}`.slice(0, 32);

      const response = await request(app)
        .patch(`/categoria/${createdCategoriaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome_categoria: nomeAtualizado });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('mensagem', 'Categoria atualizada');
      expect(response.body).toHaveProperty('categoria');

      const catAtualizada = Array.isArray(response.body.categoria)
        ? response.body.categoria[0]
        : response.body.categoria;

      expect(catAtualizada.nome_categoria).toBe(nomeAtualizado);
    });

    it('deve atualizar o desconto_categoria de uma categoria já existente', async () => {
      expect(createdCategoriaId).toBeTruthy();
      expect(adminToken).toBeTruthy();

      const response = await request(app)
        .patch(`/categoria/${createdCategoriaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ desconto_categoria: 0.25 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('mensagem', 'Categoria atualizada');

      const catAtualizada = Array.isArray(response.body.categoria)
        ? response.body.categoria[0]
        : response.body.categoria;

      expect(catAtualizada.desconto_categoria).toBe(0.25);
    });

    it('deve atualizar múltiplos campos (nome, desconto e img_banner) de uma categoria já criada', async () => {
      expect(createdCategoriaId).toBeTruthy();
      expect(adminToken).toBeTruthy();

      const payload = {
        nome_categoria: `Cafés e Doces ${timestamp}`.slice(0, 32),
        desconto_categoria: 0.05,
        img_banner: 'https://exemplo.com/novo_banner.png',
      };

      const response = await request(app)
        .patch(`/categoria/${createdCategoriaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('mensagem', 'Categoria atualizada');

      const catAtualizada = Array.isArray(response.body.categoria)
        ? response.body.categoria[0]
        : response.body.categoria;

      expect(catAtualizada.nome_categoria).toBe(payload.nome_categoria);
      expect(catAtualizada.desconto_categoria).toBe(payload.desconto_categoria);
      expect(catAtualizada.img_banner).toBe(payload.img_banner);
    });

    it('deve falhar com 400 se o desconto_categoria for negativo', async () => {
      expect(createdCategoriaId).toBeTruthy();
      expect(adminToken).toBeTruthy();

      const response = await request(app)
        .patch(`/categoria/${createdCategoriaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ desconto_categoria: -0.1 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('erros');
      expect(response.body.erros).toContain(
        'desconto_categoria não pode ser negativo ou maior que o valor do produto'
      );
    });

    it('deve falhar com 400 se o desconto_categoria for maior ou igual a 1 (ex: 1.25)', async () => {
      expect(createdCategoriaId).toBeTruthy();
      expect(adminToken).toBeTruthy();

      const response = await request(app)
        .patch(`/categoria/${createdCategoriaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ desconto_categoria: 1.25 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('erros');
    });

    it('deve falhar com 400 se nenhum campo válido for fornecido para atualização', async () => {
      expect(createdCategoriaId).toBeTruthy();
      expect(adminToken).toBeTruthy();

      const response = await request(app)
        .patch(`/categoria/${createdCategoriaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('erros');
      expect(response.body.erros).toContain('Nenhum campo válido foi fornecido para atualização');
    });

    it('deve falhar com 401 se a requisição de atualização não contiver token de autenticação', async () => {
      expect(createdCategoriaId).toBeTruthy();

      const response = await request(app)
        .patch(`/categoria/${createdCategoriaId}`)
        .send({ nome_categoria: 'Tentativa Sem Token' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('erro');
    });

    it('deve falhar com 403 se um usuário comum (role cliente) tentar atualizar categoria', async () => {
      expect(createdCategoriaId).toBeTruthy();
      expect(clienteToken).toBeTruthy();

      const response = await request(app)
        .patch(`/categoria/${createdCategoriaId}`)
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({ nome_categoria: 'Tentativa Por Cliente' });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('erro', 'acesso negado, permissão insuficiente');
    });
  });

  describe('PATCH /categoria/:id_categoria/softdelete (Desativação de categoria)', () => {
    it('deve desativar a categoria com status 200', async () => {
      expect(createdCategoriaId).toBeTruthy();
      expect(adminToken).toBeTruthy();

      const response = await request(app)
        .patch(`/categoria/${createdCategoriaId}/softdelete`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('mensagem', 'Categoria desativado!!');
    });
  });
});
