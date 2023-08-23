// esta funcion devuelve una cadena con la opcion seleccionada
export function getOptionFromNumber(userResponse: string): string  {
    const numberOptions = Number(userResponse)
    if ( isNaN(numberOptions) ) return userResponse

    const listOpciones = [
        {option: 1, text: 'quiero hacer un pedido'},
        {option: 2, text: 'quiero ver la carta'},
        {option: 3, text: 'quiero que me envie un comprobante'},
    ]

    const optionSelected = listOpciones.find(op => op.option === numberOptions)  
    return optionSelected ? optionSelected.text : userResponse    
}

export function getListOptionsBot(): string {
    return [
        '👉 Elige una de las opciones, escribe:',
        '*1*  🥗 para hacer un pedido',
        '*2*  🎴 para enviarte la carta',
        '*3*  📃 para reenviarte un comprobante'
    ].join('\n')
}