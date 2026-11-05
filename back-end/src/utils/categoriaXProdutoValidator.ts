export const stringClear = (value: any): string => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().replace(/\s+/g, ' ');
};

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const categoriaXProdutoValidatorsPayload = (body: Record<string, any>) => {
    const erros: string[] = [];
    const dadosLimpos: Record<string, any> = {};
    const { id_categoria, id_produto } = body || {};

    
    if (!id_categoria) erros.push("id_categoria é obrigatório");
    if (!id_produto) erros.push("id_produto é obrigatório");
    

    if (id_categoria !== undefined) {
        const idCategoriaLimpo = stringClear(id_categoria);

        if (typeof id_categoria !== 'string') {
            erros.push("id_categoria deve ser uma string");
        } else if (!uuidRegex.test(idCategoriaLimpo)) {
            erros.push("id_categoria deve ser um UUID válido");
        } else {
            dadosLimpos.id_categoria = idCategoriaLimpo;
        }
    }

    if (id_produto !== undefined) {
        const idProdutoLimpo = stringClear(id_produto);

        if (typeof id_produto !== 'string') {
            erros.push("id_produto deve ser uma string");
        } else if (!uuidRegex.test(idProdutoLimpo)) {
            erros.push("id_produto deve ser um UUID válido");
        } else {
            dadosLimpos.id_produto = idProdutoLimpo;
        }
    }

    return {
        valido: erros.length === 0,
        erros,
        dadosLimpos
    };
};