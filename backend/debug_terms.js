import mysql from 'mysql2/promise';

async function run() {
    const connection = await mysql.createConnection({
        host: 'vallery.catmgckfixum.sa-east-1.rds.amazonaws.com',
        user: 'robsonrr',
        password: 'Best94364811082',
        database: 'mak'
    });

    try {
        const [rows] = await connection.execute('SELECT id, terms, nat_op, ativo FROM mak.terms LIMIT 10');
        console.log(JSON.stringify(rows, null, 2));

        const [count] = await connection.execute('SELECT COUNT(*) as total FROM mak.terms WHERE ativo=1');
        console.log('Active count:', count[0].total);
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

run();
