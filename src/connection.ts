import {config, connect} from 'mssql'


let _connection: any;

export async function getConnection() {
    const configUrl = 'Server=10.0.0.2,1433;Database=clerkSLC;User Id=logistikadb;Password=SisLogCo*1603;Encrypt=false;trustServerCertificate=true'
    const configuration: config = {
        database: 'clerkSLC',
        server: '10.0.0.2',
        user: 'logistikadb',
        password: 'SisLogCo*1603',
        port: 1433,
        options: {
            trustServerCertificate: true,
            encrypt: true
        }
    }

    if (_connection) return _connection;

    try {
        const pool = await connect(configuration);
        // console.log('CONNECTED')
        return pool;
    } catch (e) {
        console.log('ERROR');
        console.log();
    }
}