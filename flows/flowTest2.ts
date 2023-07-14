import { addKeyword, EVENTS } from "@bot-whatsapp/bot";
import { ClassInformacionPedido } from "../clases/info.pedido.class";
import { SqliteDatabase } from "../services/sqlite.services";

export class FlowTest2 {
    private infoPedido: ClassInformacionPedido;
    private _cliente: any;
    private _nomCliente: string;
    private _num_telefono: string;
    private dataBase: SqliteDatabase;


    constructor(database: SqliteDatabase) {
        this.dataBase = database;
        // this.infoPedido = infoPedido;
        // this._cliente = this.infoPedido.getCliente();
        // this._nomCliente = this._cliente.getNombrePila();
        // this._num_telefono = this._cliente.getCelular();
        this.startFlow()
    }

    async startFlow(): addKeyword {
        return addKeyword(['1', '2', EVENTS.VOICE_NOTE])
            .addAction(async (ctx, { endFlow, flowDynamic, provider }) => {
                this.infoPedido = new ClassInformacionPedido();
                this.infoPedido = await this.dataBase.getInfoPedido(ctx.from);
                console.log('_cliente', this.infoPedido.getCliente());
                // this._cliente = this.infoPedido.getCliente();
                // this._nomCliente = this._cliente.getNombrePila();
                // console.log('_nomCliente ====== ', this._nomCliente);
                // this._num_telefono = this._cliente.getCelular();
            })
            .addAnswer(
                '🤖 Hola, soy Piter su asistente virtual.',
                null,
                async (ctx, { endFlow, flowDynamic, provider }) => {
                    flowDynamic(`👋 Hola ${this._nomCliente} tel:${this._num_telefono}, bienvenido a Restobar. , escribe:`);
                }
            )
            .addAnswer(
                'dime tu pedido',
                {
                    capture: true,
                },
                async (ctx, { fallBack, flowDynamic, provider }) => {
                    console.log('ctx', ctx);
                    const userResponse = ctx.body.toLowerCase().trim();
                    const _rpt = `tu: ${this._nomCliente} respondiste ${userResponse}`;
                    await fallBack(_rpt);
                }
            );
    }
}
