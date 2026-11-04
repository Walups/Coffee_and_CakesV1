export const stringClear = (value: any): string => {
  if(typeof value !== 'string'){
    return ''
  }
  return value.trim().replace(/\s+/g, ' ');
}

const regexUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const pedidoValidatorsPayload = (body: Record<string, any>, isUpdate = false) => {
    const erros: string[] = [];
    const dadosLimpos: Record<string,any> = {};
    const{id_usuario, id_endereco, status, valor_total} = body || {};
    
    if(!isUpdate){
        if(!id_usuario) erros.push("id_usuario é obrigatório");
        if(!id_endereco) erros.push("id_endereco é obrigatório");
        if(!status) erros.push("status é obrigatório");
        if(!valor_total) erros.push("valor_total é obrigatório");
    }

    if(id_usuario !== undefined){
      const id_usuarioLimpo = stringClear(id_usuario);
      
      if(!regexUUID.test(id_usuarioLimpo)){
        erros.push("id_usuário inválido");
      }else{
        dadosLimpos.id_usuario = id_usuarioLimpo;
      }
    }

    if(id_endereco !== undefined){
      const id_enderecoLimpo = stringClear(id_endereco);
      
      if(!regexUUID.test(id_enderecoLimpo)){
        erros.push("id_endereco inválido");
      }else{
        dadosLimpos.id_endereco = id_enderecoLimpo;
      }
    }

    if(status !== undefined){
      const statusLimpo= stringClear(status).toLowerCase();
      const statusValidos = ['aguardando', 'em_preparo', 'pronto', 'cancelado'];


      if(typeof status !== 'string'){
        erros.push("status deve ser um String");
      }else if(!statusValidos.includes(statusLimpo)){
        erros.push("status inválido")
      }else{
        dadosLimpos.status = statusLimpo;
      }
    }

    if(valor_total !== undefined){
      if(typeof valor_total !== 'number' || Number.isNaN(valor_total)){
        erros.push("valor_total deve ser um número");
      }else if(valor_total < 0){
        erros.push("valor_total não pode ser igual ou inferior a 0");
      }else{
        dadosLimpos.valor_total = Number(valor_total.toFixed(2));
      }
    }

    if(isUpdate && Object.keys(dadosLimpos).length === 0 && erros.length === 0) {
      erros.push("nenhum campo válido foi fornecido para atualização")
    }

    return {
      valido: erros.length === 0,
      erros,
      dadosLimpos
    }
}