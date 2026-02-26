import { Pool } from "pg";

const sslConfig = process.env.PG_SSL === "false" 
    ? false 
    : { rejectUnauthorized: process.env.NODE_ENV !== "production" ? false : true };

const pool = new Pool({
    connectionString: process.env.PG_CONNECTION_STRING,
    ssl: sslConfig,
});

export default pool;