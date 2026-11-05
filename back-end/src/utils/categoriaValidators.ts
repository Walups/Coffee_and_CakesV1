const limitDB = {
    nome_categoria: 32,
    img_banner: 500
};

export const stringClear = (value: any): string => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().replace(/\s+/g, ' ');
};

export const categoriaValidatorsPayload = (body: Record<string, any>, isUpdate = false) => {
    const erros: string[] = [];
    const dadosLimpos: Record<string, any> = {};
    const { nome_categoria, desconto_categoria, img_banner, active } = body || {};

    if (!isUpdate) {
        if (!nome_categoria) erros.push("nome_categoria é obrigatório");
    }

    if (nome_categoria !== undefined) {
        const nomeLimpo = stringClear(nome_categoria);

        if (typeof nome_categoria !== 'string') {
            erros.push("nome_categoria deve ser uma string");
        } else if (nomeLimpo.length > limitDB.nome_categoria) {
            erros.push("nome_categoria muito grande");
        } else if (nomeLimpo.length < 3) {
            erros.push("nome_categoria muito curto");
        } else {
            dadosLimpos.nome_categoria = nomeLimpo;
        }
    }

    if (desconto_categoria !== undefined && desconto_categoria !== null) {
        if (typeof desconto_categoria !== 'number' || Number.isNaN(desconto_categoria)) {
            erros.push("desconto_categoria deve ser um número");
        } else if (desconto_categoria < 0 || desconto_categoria >= 1) {
            erros.push("desconto_categoria não pode ser negativo ou maior que o valor do produto");
        } else {
            dadosLimpos.desconto_categoria = Number(desconto_categoria.toFixed(2));
        }
    }

    if (img_banner !== undefined && img_banner !== null) {
        const imgBannerLimpa = stringClear(img_banner);

        if (typeof img_banner !== 'string') {
            erros.push("img_banner deve ser uma string");
        } else if (imgBannerLimpa.length > limitDB.img_banner) {
            erros.push("img_banner muito grande");
        } else {
            dadosLimpos.img_banner = imgBannerLimpa;
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