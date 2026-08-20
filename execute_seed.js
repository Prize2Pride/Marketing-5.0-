const fs = require('fs');
const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  console.log('Connected to database.');
  
  const sql = fs.readFileSync('seed_data.sql', 'utf8');
  console.log('Executing seed data...');
  
  try {
    await connection.query(sql);
    console.log('Seed data executed successfully.');
  } catch (err) {
    console.error('Error executing seed data:', err.message);
  } finally {
    await connection.end();
  }
}

main();
