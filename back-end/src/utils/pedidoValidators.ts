const lemitDB = {

    nfe: 9,
    status: 15

}

export const pedidoValidators = (data: any) =>{
    if(data.nfe && data.nfe.length > lemitDB.nfe){
        return "NFE iválida"
    }

    if(data.status && data.status.length > lemitDB.status){
        return "status invalido"
    }
}