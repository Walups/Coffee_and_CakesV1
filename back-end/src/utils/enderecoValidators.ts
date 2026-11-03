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

export const enderecoValidatorPayload = (body: Record<string,any>, isUpdate = false) => {
    const erros: string[] = [];
    const dadosLimpos: Record<string, any> = {};

    const {id_encereco, id_cliente, cep, logradouro, cidade, uf, complemento, numero} = body;

    if(!isUpdate){
        if(!id_cliente) erros.push("id_cliente é obrigatório");
        if(!cep) erros.push("cep é obrigatório");
        if(!logradouro) erros.push("logradouro é obrigatório");
        if(!cidade) erros.push("cidade é obrigatório");
        if(!numero) erros.push("numero é obrigatório");
        if(!uf) erros.push("uf é obrigatório");
    }

    //if id_cliente regex UUID

    if(cep !== undefined){
        const cepLimpo = stringClear(cep).replace(/\D/g, '');

        if(typeof cepLimpo !== 'string'){
            erros.push("cep deve ser uma string")
        }else if(cepLimpo.length !== lemitDB.cep){
            erros.push("cep deve conter 8 digítos")
        }else{
            dadosLimpos.cep = cepLimpo;
        }
    }

    if(logradouro !== undefined){
        const logradouroLimpo = stringClear(logradouro);

        if(typeof logradouroLimpo !== 'string'){
            erros.push("logradouro deve ser uma string")
        }else if(logradouroLimpo.length > lemitDB.logradouro){
            erros.push("logradouro deve muito grande")
        }else if(logradouroLimpo.length < 3){
            erros.push("logradouro muito curto")
        }else{
            dadosLimpos.logradouro = logradouroLimpo;
        }
    }

    if(cidade !== undefined){
        const cidadeLimpo = stringClear(cidade);

        if(typeof cidadeLimpo !== 'string'){
            erros.push("cidade deve ser uma string")
        }else if(cidadeLimpo.length > lemitDB.cidade){
            erros.push("cidade deve muito grande")
        }else if(cidadeLimpo.length < 3){
            erros.push("cidade muito curto")
        }else{
            dadosLimpos.cidade = cidadeLimpo;
        }
    }

}
    
