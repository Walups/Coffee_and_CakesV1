const limitDB = {

    nome_completo: 255,
    cpf: 11,
    telefone: 11

}

export const clientValidators = (data: any) =>{

    if(data.nome_completo && data.nome_completo.length > limitDB.nome_completo){
        return "Nome muito grande"
    }

    if(data.cpf)

}