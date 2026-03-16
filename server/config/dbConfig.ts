import { Pool } from "pg";

const sslConfig = process.env.PG_SSL === "false" 
    ? false 
    : { rejectUnauthorized: process.env.NODE_ENV !== "production" ? false : true };

const pool = new Pool({
    connectionString: process.env.PG_CONNECTION_STRING,
    ssl: sslConfig,
});

pool.on('connect', async (client) => {
    try {
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
        await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    } catch (error) {
        console.error('Error initializing extensions:', error);
    }
});

export default pool;