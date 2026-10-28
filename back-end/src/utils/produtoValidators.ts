const limitDB = {

    nome_produto: 32,
    descricao: 255,
    img: 500

}

export const produtoValidators = (data: any) => {

    if(data.nome_produto && data.nome_produto.length > limitDB.nome_produto){
        return "Nome do produto muito grande";
    };
    
    if(data.descricao && data.descricao.length > limitDB.descricao){
        return "Descrição muito grande";
    };

    if(data.img && data.img.length > limitDB.img){
        return "url da imagem muito grande"
    }

    if(data.preco !== undefined && data.preco < 0){
        return "Valor inválido"
    }

    if(data.desconto_preco !== undefined && data.desconto_preco < 0){
        return "Valor inválido"
    }

    return null;


}