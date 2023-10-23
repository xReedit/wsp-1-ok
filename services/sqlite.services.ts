import sqlite3 from 'sqlite3';
import { ClassInformacionPedido } from '../clases/info.pedido.class';

interface DatabaseRecord {
    id: string;
    data: any;
}

export class SqliteDatabase {
    private db: sqlite3.Database;

    constructor(filePath: string) {
        this.db = new sqlite3.Database(filePath);
        this.createTable();
    }

    private createTable(): void {
        console.log('== creee la tablas records ==');
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS records (
        id TEXT PRIMARY KEY,        
        data TEXT,
        date_register datetime DEFAULT CURRENT_TIMESTAMP
      );
    `;

        this.db.run(createTableQuery);
    }

    update(id: string, newData: any): void {
        console.log('== UPDATE la tablas records ==');
        const updateQuery = `
      UPDATE records
      SET data = ?
      WHERE id = ?;
    `;

        this.db.run(updateQuery, [JSON.stringify(newData), id]);
    }

    // get(id: string): any | null {
    //     const selectQuery = `
    //   SELECT data
    //   FROM records
    //   WHERE id = ?;
    // `;

    //     return new Promise<any | null>((resolve, reject) => {
    //         this.db.get(selectQuery, [id], (err, row: any) => {
    //             if (err) {
    //                 reject(err);
    //             } else {
    //                 resolve(row ? JSON.parse(row.data) : null);
    //             }
    //         });
    //     });
    // }

    get(id: string): Promise<any | null> {
        const selectQuery = `
            SELECT data
            FROM records
            WHERE id = ?;
        `;

        return new Promise<any | null>((resolve, reject) => {
            this.db.get(selectQuery, [id], (err, row: any) => {
                if (err) {
                    reject(err);
                } else {
                    try {
                        // Parse the JSON data and handle potential parsing errors
                        const result = row ? JSON.parse(row.data) : null;
                        resolve(result);
                    } catch (parseError) {
                        reject(parseError);
                    }
                }
            });
        });
    }

    find(query: (item: DatabaseRecord) => boolean): Promise<any[]> {
        const selectQuery = `
      SELECT data
      FROM records;
    `;

        return new Promise<any[]>((resolve, reject) => {
            this.db.all(selectQuery, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const data = rows.map((row: any) => JSON.parse(row.data));
                    const results = data.filter(query);
                    resolve(results);
                }
            });
        });
    }

    // save(id: string, data: any): void {
    //     const insertQuery = `
    //   INSERT INTO records (id, data)
    //   VALUES (?, ?);
    // `;

    //     this.db.run(insertQuery, [id, JSON.stringify(data)]);
    // }

    save(id: string, data: any) {
        id = id.trim();
        // data = data.estructuraInfo
        this.db.get('SELECT * FROM records WHERE id = ?', [id], (error, row) => {
            if (error) {
                console.error('Error al consultar la base de datos:', error);
                return;
            }

            if (row) {
                // El registro existe, actualizar
                this.db.run('UPDATE records SET data = ?, date_register = CURRENT_TIMESTAMP WHERE id = ?', [JSON.stringify(data), id], (error) => {
                    if (error) {
                        console.error('Error al actualizar el registro:', error);
                        return;
                    }
                    console.log('Registro actualizado exitosamente ', id);
                });
            } else {
                // El registro no existe, agregar nuevo
                this.db.run('INSERT INTO records (id, data, date_register) VALUES (?, ?, CURRENT_TIMESTAMP)', [id, JSON.stringify(data), ], (error) => {
                    if (error) {
                        console.error('Error al agregar el nuevo registro:', error);
                        return;
                    }
                    console.log('Nuevo registro agregado exitosamente', id);
                });
            }
        });
    }

    delete(id: string): void {
        console.log('===== delete table records ====', id);
        const deleteQuery = `
      DELETE FROM records
      WHERE id = ?;
    `;

        this.db.run(deleteQuery, [id]);
    }

    close(): void {
        this.db.close();
    }

    // elimina los registros de hace 5 horas para manetener la base de datos limpia
    public deleteRecordsHistory(): Promise<void> {
        const deleteQuery = `
            DELETE FROM records WHERE strftime('%s', 'now') - strftime('%s', date_register) > 18000;
        `;

        return new Promise<void>((resolve, reject) => {
            this.db.run(deleteQuery, [], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async getInfoPedido(id: string): Promise<ClassInformacionPedido> {
        id = id.trim();
        let infoPedido = new ClassInformacionPedido()
        const _infoPedido = <ClassInformacionPedido>await this.get(id)
                
        if (_infoPedido ) {
            console.log('registro encontrado', id);
            infoPedido.setInfoPedidoFromSql(_infoPedido)
        } else {
            console.log('registro NO encontrado', id);
        }
        
        return infoPedido;        
    }

    async getInfoPedidoExists(id: string): Promise<ClassInformacionPedido> {
        id = id.trim();
        let infoPedido = new ClassInformacionPedido()
        const _infoPedido = <ClassInformacionPedido>await this.get(id)


        if (_infoPedido) {
            infoPedido.setInfoPedidoFromSql(_infoPedido)
        } else {
            this.delete(id) // resetea todo el pedido
            this.save(id, infoPedido)
        }

        return infoPedido;
    }

    guadarInfoDataBase(infoPedido: ClassInformacionPedido, ctxFrom) {
        // guardamos en database        
        this.save(ctxFrom, infoPedido)
    }
}