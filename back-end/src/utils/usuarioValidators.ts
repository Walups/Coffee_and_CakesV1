const limitDB = {

    nome_completo: 255,
    cpf: 11,
    telefone: 13,
    email: 255,
    role: 15

}

export const usuarioValidators = (data: any) =>{

    if(data.nome_completo && data.nome_completo.length > limitDB.nome_completo){
        return "Nome muito grande"
    }

    if(data.cpf && data.cpf.length == limitDB.cpf){
        return
    }

}