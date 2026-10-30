const lemitDB = { 

    cep: 8,
    lograndouro: 255,
    cidade: 255,
    uf: 2,
    complemento: 255

}

export const enderecoValidators = (data: any) =>{
    if(data.cep && data.cep.length !== lemitDB.cep){
        return "CEP invalido";
    };
    
    if(data.uf && data.uf.length !== lemitDB.uf){
        return "CEP invalido";
    };
    
    if(data.lograndouro && data.lograndouro.length > lemitDB.lograndouro){
        return "Lograndouro inválido"
    }
    
    if(data.cidade && data.cidade.length > lemitDB.cidade){
        return "cidade inválido"
    }
    
    if(data.complemento && data.complemento.length > lemitDB.complemento){
        return "complemento inválido"
    }

}
