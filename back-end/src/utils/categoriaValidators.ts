const limitDB = {

    nome_categoria: 32,
    img_banner: 500

}

export const categoriaValidator = (data: any) =>{

    if(data.nome_categoria && data.nome_categoria.length > limitDB.nome_categoria){
        return "Nome da categoria muito grande"
    }

    if(data.img_banner && data.img_banner.length > limitDB.img_banner){
        return "link muito grande"
    }

    if(data.desconto_categoria !== undefined && data.desconto_categoria < 0){
        return "valor de desconto invalido"
    }

}