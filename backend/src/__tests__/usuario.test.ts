import { describe, it, expect, afterAll } from 'vitest';
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

describe('Fluxo de Autenticação de Usuário (Integração)', () => {
  let createdUserId: string | null = null;
  let userToken: string | null = null;
  const uniqueTimestamp = Date.now();
  const testUser = {
    nome_completo: 'Usuario Teste Integracao',
    cpf: generateValidCPF(),
    email: `integration_test_${uniqueTimestamp}@coffeecakes.test`,
    telefone: '5541999991234',
    password: 'password123',
  };

  afterAll(async () => {
    // Limpeza obrigatória dos dados criados no Supabase no bloco afterAll
    if (createdUserId) {
      try {
        // 1. Remove da tabela pública usuario
        await supabase.from('usuario').delete().eq('id_usuario', createdUserId);
        // 2. Remove do Supabase Auth via service_role
        await supabase.auth.admin.deleteUser(createdUserId);
      } catch (err) {
        console.error('Falha na limpeza pós-teste do usuário:', err);
      }
    }
  });

  describe('POST /usuario/register', () => {
    it('deve registrar um novo usuário com sucesso e retornar contrato correto', async () => {
      const response = await request(app)
        .post('/usuario/register')
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('mensagem', 'Usuário cadastrado com sucesso!');
      expect(response.body).toHaveProperty('usuario');

      const usuario = response.body.usuario;
      expect(usuario).toHaveProperty('id_usuario');
      expect(usuario.nome_completo).toBe(testUser.nome_completo);
      expect(usuario.cpf).toBe(testUser.cpf);
      expect(usuario.email).toBe(testUser.email.toLowerCase());
      expect(usuario.telefone).toBe(testUser.telefone);
      expect(usuario.role).toBe('cliente');
      expect(usuario.active).toBe(true);

      // Salva o ID para login subsequente e para o afterAll
      createdUserId = usuario.id_usuario;
    });

    it('deve falhar com 400 se o campo password estiver ausente', async () => {
      const { password, ...payloadSemPassword } = testUser;
      const response = await request(app)
        .post('/usuario/register')
        .send(payloadSemPassword);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('erros');
      expect(Array.isArray(response.body.erros)).toBe(true);
      expect(response.body.erros).toContain('password é obrigatório.');
    });

    it('deve falhar com 400 se o campo password for menor que 6 caracteres', async () => {
      const response = await request(app)
        .post('/usuario/register')
        .send({
          ...testUser,
          email: `short_pass_${Date.now()}@coffeecakes.test`,
          cpf: generateValidCPF(),
          password: '123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('erros');
      expect(response.body.erros).toContain('password deve ter no mínimo 6 caracteres');
    });
  });

  describe('POST /usuario/login', () => {
    it('deve realizar login com sucesso e retornar token e perfil do usuário', async () => {
      const response = await request(app)
        .post('/usuario/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('mensagem', 'Login realizado com sucesso!');
      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
      expect(response.body).toHaveProperty('usuario');
      expect(response.body.usuario.id_usuario).toBe(createdUserId);
      expect(response.body.usuario.email).toBe(testUser.email.toLowerCase());
      expect(response.body.usuario.role).toBe('cliente');

      userToken = response.body.token;
    });

    it('deve retornar 401 se a senha for incorreta', async () => {
      const response = await request(app)
        .post('/usuario/login')
        .send({
          email: testUser.email,
          password: 'senha_incorreta_total',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('erro', 'E-mail ou password incorretos');
    });

    it('deve retornar 400 se o campo password não for fornecido', async () => {
      const response = await request(app)
        .post('/usuario/login')
        .send({
          email: testUser.email,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('erros');
      expect(response.body.erros).toContain('E-mail e password são obrigatórios');
    });

    it('deve retornar 400 se o campo email não for fornecido', async () => {
      const response = await request(app)
        .post('/usuario/login')
        .send({
          password: testUser.password,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('erros');
      expect(response.body.erros).toContain('E-mail e password são obrigatórios');
    });
  });

  describe('Controle de Acesso e Proteção de Rotas (authMiddleware e checkRole)', () => {
    it('deve retornar 401 ao tentar acessar rota restrita (/usuario) sem header de Authorization', async () => {
      const response = await request(app).get('/usuario');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('erro', 'Token de acesso não fornecido ou formato inválido');
    });

    it('deve retornar 401 ao tentar acessar com formato de token inválido (sem Bearer)', async () => {
      const response = await request(app)
        .get('/usuario')
        .set('Authorization', 'TokenSemBearerInvalido');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('erro', 'Token de acesso não fornecido ou formato inválido');
    });

    it('deve retornar 401 ao tentar acessar com token expirado ou inválido', async () => {
      const response = await request(app)
        .get('/usuario')
        .set('Authorization', 'Bearer token_invalido_ou_expirado_12345');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('erro', 'Token inválido ou expirado');
    });

    it('deve retornar 403 ao tentar acessar rota administrativa (/usuario) com usuário de role cliente', async () => {
      expect(userToken).toBeTruthy();

      const response = await request(app)
        .get('/usuario')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('erro', 'acesso negado, permissão insuficiente');
    });

    it('deve retornar 403 ao tentar acessar rota administrativa por ID (/usuario/:id_usuario) com usuário de role cliente', async () => {
      expect(userToken).toBeTruthy();
      expect(createdUserId).toBeTruthy();

      const response = await request(app)
        .get(`/usuario/${createdUserId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('erro', 'acesso negado, permissão insuficiente');
    });
  });
});
