const lemitDB = {

    nfe: 9,
    status: 15

}

export const stringClear = (value: any): string => {
  if(typeof value !== 'string'){
    return ''
  }
  return value.trim().replace(/\s+/g, ' ');
}

export const pedidoValidatorsPayload = (body: Record<string, any>, isUpdate = false) => {
    const erros: string[] = [];
    const dadosLimpos: Record<string,any> = {};
    const regexUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const{id_usuario, id_endereco, status, valor_total} = body || {};

    if(!isUpdate){
        if(!id_usuario) erros.push("id_usuario é obrigatório");
        if(!id_endereco) erros.push("id_endereco é obrigatório");
        if(!status) erros.push("status é obrigatório");
        if(!valor_total) erros.push("valor_total é obrigatório");
    }

    if(id_usuario !== undefined){



    }
}