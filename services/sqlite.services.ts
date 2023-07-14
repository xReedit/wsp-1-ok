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
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS records (
        id TEXT PRIMARY KEY,
        data TEXT
      );
    `;

        this.db.run(createTableQuery);
    }

    update(id: string, newData: any): void {
        const updateQuery = `
      UPDATE records
      SET data = ?
      WHERE id = ?;
    `;

        this.db.run(updateQuery, [JSON.stringify(newData), id]);
    }

    get(id: string): any | null {
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
                    resolve(row ? JSON.parse(row.data) : null);
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
        this.db.get('SELECT * FROM records WHERE id = ?', [id], (error, row) => {
            if (error) {
                console.error('Error al consultar la base de datos:', error);
                return;
            }

            if (row) {
                // El registro existe, actualizar
                this.db.run('UPDATE records SET data = ? WHERE id = ?', [JSON.stringify(data), id], (error) => {
                    if (error) {
                        console.error('Error al actualizar el registro:', error);
                        return;
                    }
                    console.log('Registro actualizado exitosamente');
                });
            } else {
                // El registro no existe, agregar nuevo
                this.db.run('INSERT INTO records (id, data) VALUES (?, ?)', [id, JSON.stringify(data)], (error) => {
                    if (error) {
                        console.error('Error al agregar el nuevo registro:', error);
                        return;
                    }
                    console.log('Nuevo registro agregado exitosamente');
                });
            }
        });
    }

    delete(id: string): void {
        const deleteQuery = `
      DELETE FROM records
      WHERE id = ?;
    `;

        this.db.run(deleteQuery, [id]);
    }

    close(): void {
        this.db.close();
    }

    async getInfoPedido(id: string): Promise<ClassInformacionPedido> {
        let infoPedido = new ClassInformacionPedido()
        const _infoPedido = <ClassInformacionPedido>await this.get(id)
        infoPedido.setInfoPedidoFromSql(_infoPedido)

        return infoPedido;        
    }
}