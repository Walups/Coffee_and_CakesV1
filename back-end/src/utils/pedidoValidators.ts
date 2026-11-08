export const stringClear = (value: any): string => {
  if(typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ');
}

const regexUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const pedidoValidatorsPayload = (body: Record<string, any>, isUpdate = false) => {
    const erros: string[] = [];
    const dadosLimpos: Record<string,any> = {};
    const{id_endereco, status, valor_total, forma_pagamento, itens} = body || {};
    
    // adicionar forma de pagamento
    if(!isUpdate){
        if(!id_endereco) erros.push("id_endereco é obrigatório");
        if(!status) erros.push("status é obrigatório");
        if(!valor_total) erros.push("valor_total é obrigatório");
        if(!forma_pagamento) erros.push("Forma de pagamento é obrigatória");

        if (!Array.isArray(itens) || itens.length === 0) {
            erros.push("O pedido deve conter ao menos um item em 'itens'");
        } else {
            const itensLimpos: any[] = [];
            itens.forEach((item, index) => {
                if (!item.id_produto || !regexUUID.test(item.id_produto)) {
                    erros.push(`Item [${index}]: id_produto inválido`);
                }
                if (typeof item.quant !== 'number' || item.quant <= 0) {
                    erros.push(`Item [${index}]: quant deve ser um número maior que zero`);
                }
                if (typeof item.valor_produto_pedido !== 'number' || item.valor_produto_pedido <= 0) {
                    erros.push(`Item [${index}]: valor_produto_pedido inválido`);
                }

                itensLimpos.push({
                    id_produto: stringClear(item.id_produto),
                    quant: Math.floor(item.quant),
                    valor_produto_pedido: Number(item.valor_produto_pedido.toFixed(2)),
                    observacao: item.observacao ? stringClear(item.observacao) : null
                });
            });
            dadosLimpos.itens = itensLimpos;
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
      }else if(valor_total <= 0){
        erros.push("valor_total não pode ser igual ou inferior a 0");
      }else{
        dadosLimpos.valor_total = Number(valor_total.toFixed(2));
      }
    }

    if (forma_pagamento !== undefined) {
      if (typeof forma_pagamento !== 'string') {
        erros.push("forma_pagamento deve ser uma String");
      } else {
        const formaLimpa = stringClear(forma_pagamento).toLowerCase();
        const formasValidas = ['pix', 'cartao_credito', 'cartao_debito', 'dinheiro'];
        
        if (!formasValidas.includes(formaLimpa)) {
          erros.push("forma_pagamento inválida");
        } else {
          dadosLimpos.forma_pagamento = formaLimpa;
        }
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