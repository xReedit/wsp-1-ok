import { addKeyword, EVENTS } from "@bot-whatsapp/bot";
import { ClassInfoSede } from "../clases/sede";
import { SqliteDatabase } from "../services/sqlite.services";
import { coreFlow } from "../services/flows/coreFlow";

export const flowBot = (infoSede: ClassInfoSede, database: SqliteDatabase) => {    
    return addKeyword(EVENTS.WELCOME)
    .addAction(
        async (ctx, { endFlow, fallBack, flowDynamic, gotoFlow, provider }) => {            
            // database.delete(ctx.from)
            return await coreFlow(true, ctx, infoSede, database, { provider, fallBack, endFlow, flowDynamic, gotoFlow })              
        }
    )
    .addAnswer('...', {capture: true},
        async (ctx, { endFlow, fallBack, flowDynamic, gotoFlow, provider }) => {

            return await coreFlow(false, ctx, infoSede, database, { provider, fallBack, endFlow, flowDynamic, gotoFlow })  

        })        
}   