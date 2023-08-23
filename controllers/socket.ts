import e from 'express';
import  BotApp  from './piter';
import * as fs from 'fs'
import { SqliteDatabase } from '../services/sqlite.services';

// import dotenv from 'dotenv';
// dotenv.config();

const sessions: { [name: string]: BotApp } = {};

const socketsConnect = (io: any, database: SqliteDatabase) => {
    

    io.on('connection', (socket: any) => {
        console.log('datos socket', socket.id);

        socket.on('disconnect', (reason: any) => {
            console.log('disconnect');            
            socket.disconnect()        
        });


        socket.on('init_bot', (playload: any) => {
            
            const _nameSession = playload.nameSession
            const nameSession: string = _nameSession;
            let  infoSede = playload.infoSede
            // console.log('nombre session', _nameSession); 
            
            let session: BotApp;
            

            // Verificar si ya existe una sesión con el nombre especificado
            if (sessions[nameSession]) {
                session = sessions[nameSession];
                session.updateInfoSede(infoSede)
                try {                      
                    if (session.adapterProviderEvent.globalVendorArgs ) {
                        socket.emit('session_init', true)
                    } else {
                        socket.emit('session_verify', true)
                    }
                } catch (error) {
                    console.log('error', error);
                    socket.emit('session_verify', true)
                }
            } else {
                // Si no existe, crear una nueva sesión
                session = new BotApp(nameSession, infoSede);
                sessions[nameSession] = session;                
                session.init(database);
            }

            // console.log('session', session);

            // console.log('session.adapterProviderEvent', session.adapterProviderEvent);
            // console.log('session.adapterProviderEvent.globalVendorArgs', session.adapterProviderEvent.globalVendorArgs);
            
            // session.adapterProviderEvent.on('ready', () => console.log('Ready'))

            
            // const newBot = new BotApp(_nameSession, infoSede, socket);
            // newBot.init();  

            // eventos
            session.adapterProviderEvent.on('require_action', (data) => {
                // muestra el codigo QR -session NO inciada-

                if ( socket.disconnected ) {
                    try {
                        session.adapterProviderEvent.vendor.logout()                        
                    } catch (error) {                        
                    }
                    return}; 

                console.log('Session no iniciada ', data)
                socket.emit('session_init', false)

                const _nameQr = `${_nameSession}.qr.png`
                setTimeout(() => {
                    fs.readFile(_nameQr, function (err, data) {
                        socket.emit('image_qr_session', "data:image/png;base64," + data.toString("base64"));
                    })
                }, 1500);

            });

            session.adapterProviderEvent.on('ready', (data) => {
                socket.emit('session_init', true)
            });            

            
        })

        socket.on('stop-chat-bot', (nameSession: string) => {
            let session: BotApp;
            session = sessions[nameSession];
            // console.log('session', session);
            try {
                session.adapterProviderEvent.vendor.logout()
                // session.adapterProviderEvent.vendor.end()
            } catch (error) {
                console.log('error', error);
            }
        })

        // acuatlizar informacion de la sede
        socket.on('update-info-sede', (playload: any) => {
            const _nameSession = playload.nameSession
            const nameSession: string = _nameSession;
            let infoSede = playload.infoSede
            
            let session: BotApp;
            

            // Verificar si ya existe una sesión con el nombre especificado
            if (sessions[nameSession]) {
                session = sessions[nameSession];
                session.updateInfoSede(infoSede)
            }
        })

    })
}

export = socketsConnect;