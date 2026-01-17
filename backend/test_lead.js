import { LeadRepository } from './src/repositories/lead.repository.js';
import dotenv from 'dotenv';
dotenv.config();

const repo = new LeadRepository();

async function test() {
    try {
        const lead = await repo.findById(667350);
        console.log('LEAD DATA:', JSON.stringify(lead, null, 2));
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
}

test();
