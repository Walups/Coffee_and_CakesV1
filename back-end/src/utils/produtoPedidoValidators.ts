const limitDB = {

    observacao: 255

}

export const produtoPedidoValidators = (data: any) =>{

    if(data.observacao && data.observacao.length > limitDB.observacao){
        return "observacao muito grande"
    }

    if(data.quant !== undefined && data.quant < 0){
        return "quantidade inválida"
    }

    if(data.valor_produto_pedido !== undefined && data.valor_produto_pedido < 0) {
        return "valor do produto errado"
    }

}