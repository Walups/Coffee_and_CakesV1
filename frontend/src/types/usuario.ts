export interface IUsuario {
  id_usuario?: string;
  nome_completo: string;
  cpf: string;
  email: string;
  telefone: string;
  role?: 'cliente' | 'admin' | 'funcionario';
  active?: boolean;
}

export interface IRegisterPayload {
  nome_completo: string;
  cpf: string;
  email: string;
  telefone: string;
  senha: string;
}

export interface ILoginResponse {
  token: string;
  usuario: IUsuario;
}