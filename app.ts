import express, { Application, Request, Response } from 'express';
import { createServer } from "http";
import { Server } from 'socket.io';
import cors from 'cors'; 
import socketsConnect  from './controllers/socket';
import { obtenerFechaHoraPorZonaHoraria, obtenerFechaHoraPorZonaHoraria2, obtenerHoraActualPorZonaHoraria } from './services/utiles';
// import { config } from './config';

// import 'dotenv/config'
// dotenv.config();

// import 'dotenv/config'
// import { config } from "dotenv"
import * as dotenv from 'dotenv'
import { SqliteDatabase } from './services/sqlite.services';
dotenv.config();

const PORT = process.env.PORT
const PORT_SOCKET_CHAT = process.env.PORT_SOCKET

const app = express();
app.use(cors()); 
app.use(express.json());

const httpServer = createServer(app);


var routesPiter = require('./routes/index');
app.use('/piter-bot', routesPiter);

app.use('/', (req: Request, res: Response): void => {
    res.send('Hello Piter Bot !');
});


const io = new Server(httpServer, {
    cors: { origin: '*' },
    pingInterval: 10000,
    pingTimeout: 30000,
    cookie: false,
    allowEIO3: true
}).listen(parseInt(PORT_SOCKET_CHAT))

// crear data base clientes
const database = new SqliteDatabase('database.sqlite');

socketsConnect(io, database)


const fechaActual = obtenerFechaHoraPorZonaHoraria2();
console.log('fechaActual zona lima', fechaActual);

const hora = fechaActual.getHours();
const minutos = fechaActual.getMinutes();

console.log('fechaActual', fechaActual);
console.log('hora', hora);
console.log('minutos', minutos);

// io.on('connection', (socket: any) => {
//     console.log('datos socket', socket.id);

//     // socket.disconnect()

//     io.emit('message', 'Hello bienvenido a piter! el CHAT BOT')
// })




httpServer.listen(PORT, () => {    
    console.log('Server is running.. port  ' + PORT);
    console.log('Server is running socket.. port  ' + parseInt(PORT_SOCKET_CHAT));
});

exports = app;


