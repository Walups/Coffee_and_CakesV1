const lemitDB = { 
    cep: 8,
    logradouro: 255,
    cidade: 255,
    uf: 2,
    complemento: 255,
    numero: 10
}

export const stringClear = (value: any): string => {
  if(typeof value !== 'string'){
    return ''
  }
  return value.trim().replace(/\s+/g, ' ');
}

const regexUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const enderecoValidatorsPayload = (body: Record<string,any>, isUpdate = false) => {
    const erros: string[] = [];
    const dadosLimpos: Record<string, any> = {};
    const {id_usuario, cep, logradouro, cidade, uf, complemento, numero} = body || {};

    if(!isUpdate){
        if(!id_usuario) erros.push("id_usuario é obrigatório");
        if(!cep) erros.push("cep é obrigatório");
        if(!logradouro) erros.push("logradouro é obrigatório");
        if(!cidade) erros.push("cidade é obrigatório");
        if(!numero) erros.push("numero é obrigatório");
        if(!uf) erros.push("uf é obrigatório");
    }

    if(id_usuario !== undefined){
        const id_usuarioLimpo = stringClear(id_usuario);

        if(!regexUUID.test(id_usuarioLimpo)){
            erros.push("id_usuario inválido");
        }else{
            dadosLimpos.id_usuario = id_usuarioLimpo;
        }
    }

    if(cep !== undefined){
        const cepLimpo = stringClear(cep).replace(/\D/g, '');

        if(typeof cep !== 'string'){
            erros.push("cep deve ser uma string")
        }else if(cepLimpo.length !== lemitDB.cep){
            erros.push("cep deve conter 8 digítos")
        }else{
            dadosLimpos.cep = cepLimpo;
        }
    }

    if(logradouro !== undefined){
        const logradouroLimpo = stringClear(logradouro);

        if(typeof logradouro !== 'string'){
            erros.push("logradouro deve ser uma string")
        }else if(logradouroLimpo.length > lemitDB.logradouro){
            erros.push("logradouro  muito grande")
        }else if(logradouroLimpo.length < 3){
            erros.push("logradouro muito curto")
        }else{
            dadosLimpos.logradouro = logradouroLimpo;
        }
    }

    if(cidade !== undefined){
        const cidadeLimpo = stringClear(cidade);
        
        if(typeof cidade !== 'string'){
            erros.push("cidade deve ser uma string")
        }else if(cidadeLimpo.length > lemitDB.cidade){
            erros.push("cidade  muito grande");
        }else if(cidadeLimpo.length < 3){
            erros.push("cidade muito curto");
        }else{
            dadosLimpos.cidade = cidadeLimpo;
        }
    }

    if(numero !== undefined){
        const numeroLimpo = stringClear(numero)

        if(typeof numero !== 'string'){
            erros.push("Número deve ser uma string");
        }else if(numeroLimpo.length > lemitDB.numero){
            erros.push("numero deve conter até 10 caracteres");
        }else{
            dadosLimpos.numero = numeroLimpo;
        }
    }

    if(uf !== undefined){
        const ufLimpo = stringClear(uf).toUpperCase();

        if(typeof uf !== 'string'){
            erros.push("UF deve ser uma String")
        }else if(ufLimpo.length !== lemitDB.uf){
            erros.push("UF deve conter apenas 2 caracteres")
        }else{
            dadosLimpos.uf = ufLimpo
        }
    }

    if(complemento !== undefined && complemento !== null){
        const complementoLimpo = stringClear(complemento)

        if(typeof complemento !== 'string'){
            erros.push("complemento precisa ser uma string");
        }else if(complementoLimpo.length > lemitDB.complemento){
            erros.push("Complemento muito grande");
        }else{
            dadosLimpos.complemento = complementoLimpo;
        }
    }

    if(isUpdate && Object.keys(dadosLimpos).length === 0 && erros.length === 0){
        erros.push("Nenhum campo válido foi fornecido para atualização");
    }

    return{
        valido: erros.length === 0,
        erros,
        dadosLimpos
    };
};
    
