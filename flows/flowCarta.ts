const { addKeyword } = require("@bot-whatsapp/bot");

export const flowCarta = new addKeyword(['1'])
    .addAnswer('Desea que le adjunte la carta?, escriba *si* o *no*', {
        caputre: true
    })
    .addAnswer('🎴 te adjunto nuestra carta', { 
            media: './images/1316_carta.jpg'
        }
    )