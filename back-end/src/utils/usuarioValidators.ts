const limitDB = {
  nome_completo: 255,
  cpf: 11,
  email: 255,
  telefone: 13,
  role: 15,
};

export const validarcpf = (cpfRaw: string): {valido: boolean; cpfLimpo: string} => {
  const cpfLimpo = cpfRaw.replace(/\D/g, '');

  if (cpfLimpo.length !== limitDB.cpf || /^(\d)\1{10}$/.test(cpfLimpo)) {
    return { valido: false, cpfLimpo: '' };
  }

  let soma = 0;
  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.substring(9, 10))) {
    return { valido: false, cpfLimpo: '' };
  }

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.substring(10, 11))) {
    return { valido: false, cpfLimpo: '' };
  }

  return { valido: true, cpfLimpo };
};

export const tratartelefone = (telRaw: string): { valido: boolean; telFormatado: string } => {
  let telLimpo = telRaw.replace(/\D/g, '');

  if (telLimpo.startsWith('0')) {
    telLimpo = telLimpo.substring(1);
  }

  if (telLimpo.length === 10 || telLimpo.length === 11) {
    telLimpo = `55${telLimpo}`;
  }

  const telValido = telLimpo.length === 12 || telLimpo.length === 13

  if (!telValido || !telLimpo.startsWith('55')) {
    return { valido: false, telFormatado: '' };
  }

  return { valido: true, telFormatado: telLimpo };
};

export const stringClear = (value: any): string => {
  if(typeof value !== 'string'){
    return ''
  }
  return value.trim().replace(/\s+/g, ' ');
}

export const usuarioValidatorsPayload = (body: Record<string, any>, isUpdate = false) => {
  const erros: string[] = [];
  const dadosSanitizados: Record<string, any> = {};

  const { nome_completo, cpf, email, telefone, role, active, senha } = body || {};

  if (!isUpdate) {
    if (!nome_completo) erros.push("nome_completo é obrigatório.");
    if (!cpf) erros.push("cpf é obrigatório.");
    if (!email) erros.push("email é obrigatório.");
    if (!telefone) erros.push("telefone é obrigatório.");
    if (!senha) erros.push("senha é obrigatória");
  }

  if (senha !== undefined) {

    if(typeof senha !== 'string'){
      erros.push("senha dele ser uma string")
    }      
    if (senha.length < 6) {
        erros.push("senha deve ter no mínimo 6 caracteres");
    }
  }

  if (nome_completo !== undefined) {
    const nomeLimpo = stringClear(nome_completo)

    if (typeof nomeLimpo !== 'string'){
      erros.push("nome_completo deve ser uma string")
    }else if  (nomeLimpo.length < 3) {
      erros.push("nome_completo deve ter pelo menos 3 caracteres.");
    } else if (nomeLimpo.length > limitDB.nome_completo) {
      erros.push(`nome_completo excede o limite de ${limitDB.nome_completo} caracteres.`);
    } else {
      dadosSanitizados.nome_completo = nomeLimpo;
    }
  }

  if (cpf !== undefined) {
    if (typeof cpf !== 'string') {
      erros.push("cpf deve ser uma string.");
    } else {
      const { valido, cpfLimpo } = validarcpf(cpf);
      if (!valido) erros.push("cpf informado é inválido.");
      else dadosSanitizados.cpf = cpfLimpo;
    }
  }

  if (email !== undefined) {
    const emailLimpo = stringClear(email).toLowerCase()
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof emailLimpo !== 'string' || !regexEmail.test(emailLimpo)) {
      erros.push("Formato de email inválido.");
    } else if (emailLimpo.length > limitDB.email) {
      erros.push(`email excede o limite de ${limitDB.email} caracteres.`);
    } else {
      dadosSanitizados['email'] = emailLimpo
    }
  }

  if (telefone !== undefined) {
    if (typeof telefone !== 'string') {
      erros.push("telefone deve ser uma string.");
    } else {
      const { valido, telFormatado } = tratartelefone(telefone);
      if (!valido) erros.push("telefone inválido. Envie DDD + número (ex: 41999998888).");
      else dadosSanitizados.telefone = telFormatado;
    }
  }

  if (role !== undefined) {
    const roleLimpa = stringClear(role).toLowerCase()
    const roleDefault = ['cliente', 'admin', 'funcionario'];

    if (typeof roleLimpa !== 'string' || roleLimpa.length === 0) {
      erros.push("role deve ser um texto válido.");
    } else if (!roleDefault.includes(roleLimpa)){
      erros.push(`role inválida`)
    }else {
      dadosSanitizados.role = role.trim();
    }
  }

  if (active !== undefined) {
    if (typeof active !== 'boolean') {
      erros.push("active deve ser booleano (true ou false).");
    } else {
      dadosSanitizados.active = active;
    }
  }

  if (isUpdate && Object.keys(dadosSanitizados).length === 0 && erros.length === 0) {
    erros.push("Nenhum campo válido foi fornecido para atualização.");
  }

  return {
    valido: erros.length === 0,
    erros,
    dadosSanitizados
  };
};