const limitDB = {
    nome_produto: 50,
    descricao: 255,
    imagem_produto: 255
};

export const stringClear = (value: any): string => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().replace(/\s+/g, ' ');
};

export const produtoValidatorsPayload = (body: Record<string, any>, isUpdate = false) => {
    const erros: string[] = [];
    const dadosLimpos: Record<string, any> = {};
    const { nome_produto, preco, desconto_produto, descricao, imagem_produto, active } = body || {};

    if (!isUpdate) {
        if (!nome_produto) erros.push("nome_produto é obrigatório");
        if (preco === undefined || preco === null) erros.push("preco é obrigatório");
        if (!imagem_produto) erros.push("Imagem é obrigatória");
    }

    if (nome_produto !== undefined) {
        const nomeLimpo = stringClear(nome_produto);

        if (typeof nome_produto !== 'string') {
            erros.push("nome_produto deve ser uma string");
        } else if (nomeLimpo.length > limitDB.nome_produto) {
            erros.push("nome_produto muito grande");
        } else if (nomeLimpo.length < 3) {
            erros.push("nome_produto muito curto");
        } else {
            dadosLimpos.nome_produto = nomeLimpo;
        }
    }

    if (preco !== undefined) {
        if (typeof preco !== 'number' || Number.isNaN(preco)) {
            erros.push("preco deve ser um número");
        } else if (preco <= 0) {
            erros.push("preco deve ser maior que 0");
        } else {
            dadosLimpos.preco = Number(preco.toFixed(2));
        }
    }

    if (desconto_produto !== undefined && desconto_produto !== null) {
        if (typeof desconto_produto !== 'number' || Number.isNaN(desconto_produto)) {
            erros.push("desconto_produto deve ser um número");
        } else if (desconto_produto < 0) {
            erros.push("desconto_produto não pode ser negativo");
        } else if (typeof preco === 'number' && desconto_produto >= preco) {
            erros.push("desconto_produto não pode ser maior ou igual ao preço");
        } else {
            dadosLimpos.desconto_produto = Number(desconto_produto.toFixed(2));
        }
    }

    if (descricao !== undefined && descricao !== null) {
        const descricaoLimpa = stringClear(descricao);

        if (typeof descricao !== 'string') {
            erros.push("descricao deve ser uma string");
        } else if (descricaoLimpa.length > limitDB.descricao) {
            erros.push("descricao muito grande");
        } else {
            dadosLimpos.descricao = descricaoLimpa;
        }
    }

    if (imagem_produto !== undefined && imagem_produto !== null) {
        const imagemProdutoLimpa = stringClear(imagem_produto);

        if (typeof imagem_produto !== 'string') {
            erros.push("imagem_produto deve ser uma string");
        } else if (imagemProdutoLimpa.length > limitDB.imagem_produto) {
            erros.push("imagem_produto muito grande");
        } else {
            dadosLimpos.imagem_produto = imagemProdutoLimpa;
        }
    }

    if (active !== undefined) {
        if (typeof active !== 'boolean') {
            erros.push("active deve ser um boolean");
        } else {
            dadosLimpos.active = active;
        }
    }

    if (isUpdate && Object.keys(dadosLimpos).length === 0 && erros.length === 0) {
        erros.push("Nenhum campo válido foi fornecido para atualização");
    }

    return {
        valido: erros.length === 0,
        erros,
        dadosLimpos
    };
};