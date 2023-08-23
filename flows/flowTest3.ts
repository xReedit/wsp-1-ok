import { addKeyword, EVENTS } from "@bot-whatsapp/bot";
// const { addKeyword } = require('@bot-whatsapp/bot')

const flujoUno = addKeyword("1")            
            .addAnswer("hola llegaste al flowUno"
            , { capture: true }
            , async (ctx, { fallBack }) => {
                const userResponse = ctx.body;
                await fallBack('escribite en UNO:' + userResponse)
            }
)


const flujoDos = () => {
    return addKeyword("2")
    .addAnswer("hola llegaste al flowDOS"
        , { capture: true }
        , async (ctx, { gotoFlow, fallBack }) => {
            const userResponse = ctx.body;
            await fallBack('escribite en DOS:' + userResponse)
        }
    )    
}        

const flujoTres = addKeyword("3")
    .addAnswer("hola llegaste al flowTres"
        , { capture: true }
        , async (ctx, { gotoFlow, fallBack }) => {
            const userResponse = ctx.body;
            await fallBack('escribite en TRES:' + userResponse)
        }
    )                


export const flowPrincipalTest = addKeyword([EVENTS.WELCOME])
    .addAnswer( 'Hola que tal', null,
        async (ctx, { flowDynamic, endFlow, gotoFlow }) => {
        const userResponse = ctx.body;
        console.log('userResponse', userResponse);
        switch (userResponse) {
            case '1':
                await flowDynamic('vamos al flow 1')
                await gotoFlow(flujoUno)
                break;
            case '2':
                await flowDynamic('vamos al flow 2')
                await gotoFlow(flujoDos)
                break;
            case '3':
                await flowDynamic('vamos al flow 3')
                await gotoFlow(flujoTres)
                break;                
            }
        }, [flujoUno, flujoDos, flujoTres])



