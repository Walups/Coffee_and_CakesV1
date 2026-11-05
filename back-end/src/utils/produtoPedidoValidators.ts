const lemitDB = {
    observacao: 255
}

export const stringClear = (value: any): string => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().replace(/\s+/g, ' ');
};

const regexUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const produtoPedidoValidatorsPayload = (body: Record<string, any>, isUpdate = false) => {
    const erros: string[] = [];
    const dadosLimpos: Record<string, any> = {};
    const { id_pedido, id_produto, quant, valor_produto_pedido, observacao } = body || {};

    if (!isUpdate) {
        if (!id_pedido) erros.push("id_pedido é obrigatório");
        if (!id_produto) erros.push("id_produto é obrigatório");
        if (quant === undefined || quant === null) erros.push("quant é obrigatório");
        if (valor_produto_pedido === undefined || valor_produto_pedido === null) erros.push("valor_produto_pedido é obrigatório");
    }

    if (id_pedido !== undefined) {
      const id_pedidoLimpo = stringClear(id_pedido);
      
      if (!regexUUID.test(id_pedidoLimpo)) {
        erros.push("id_pedido inválido");
      } else {
        dadosLimpos.id_pedido = id_pedidoLimpo;
      }
    }

    if (id_produto !== undefined) {
      const id_produtoLimpo = stringClear(id_produto);
      
      if (!regexUUID.test(id_produtoLimpo)) {
        erros.push("id_produto inválido");
      } else {
        dadosLimpos.id_produto = id_produtoLimpo;
      }
    }

    if (quant !== undefined) {
      if (typeof quant !== 'number' || Number.isNaN(quant) || !Number.isInteger(quant)) {
        erros.push("quant deve ser um número inteiro");
      } else if (quant <= 0) {
        erros.push("quant deve ser maior que 0");
      } else {
        dadosLimpos.quant = quant;
      }
    }

    if (valor_produto_pedido !== undefined) {
      if (typeof valor_produto_pedido !== 'number' || Number.isNaN(valor_produto_pedido)) {
        erros.push("valor_produto_pedido deve ser um número");
      } else if (valor_produto_pedido <= 0) {
        erros.push("valor_produto_pedido deve ser maior que 0");
      } else {
        dadosLimpos.valor_produto_pedido = Number(valor_produto_pedido.toFixed(2));
      }
    }

    if (observacao !== undefined && observacao !== null) {
      const observacaoLimpa = stringClear(observacao);

      if (typeof observacao !== 'string') {
        erros.push("observacao deve ser uma string");
      } else if (observacaoLimpa.length > lemitDB.observacao) {
        erros.push("observacao excede o limite de 255 caracteres");
      } else {
        dadosLimpos.observacao = observacaoLimpa;
      }
    }

    if (isUpdate && Object.keys(dadosLimpos).length === 0 && erros.length === 0) {
      erros.push("nenhum campo válido foi fornecido para atualização");
    }

    return {
      valido: erros.length === 0,
      erros,
      dadosLimpos
    };
};