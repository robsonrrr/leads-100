import { connectDatabase, getDatabase } from '../backend/src/config/database.js';

async function describeTable() {
    try {
        await connectDatabase();
        const db = getDatabase();

        console.log('--- mak.inv ---');
        try {
            const [rows] = await db.query('DESCRIBE mak.inv');
            console.log(rows.map(r => r.Field).join(', '));
        } catch (e) { console.log('Error describing inv:', e.message); }

        console.log('\n--- mak.produtos ---');
        try {
            const [prodRows] = await db.query('DESCRIBE mak.produtos');
            console.log(prodRows.map(r => r.Field).join(', '));
        } catch (e) { console.log('Error describing produtos:', e.message); }

        console.log('\n--- mak.produtos_estoque_por_unidades ---');
        try {
            const [stockRows] = await db.query('DESCRIBE mak.produtos_estoque_por_unidades');
            console.log(stockRows.map(r => r.Field).join(', '));
        } catch (e) { console.log('Error describing stock view:', e.message); }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

describeTable();
