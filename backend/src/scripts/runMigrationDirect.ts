import pg from 'pg';
import fs from 'fs';
import path from 'path';

async function run() {
  const connectionString = 'postgresql://postgres.augeggvlijscaebcggvk:75487319%40fF@aws-1-us-west-2.pooler.supabase.com:5432/postgres';
  
  const client = new pg.Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Conectando ao banco de dados...');
    await client.connect();
    console.log('Conectado com sucesso!');

    const migrationPath = path.resolve('../supabase/migrations/20260721010000_catalog_licenses.sql');
    console.log(`Lendo arquivo de migração: ${migrationPath}`);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executando DDL no Supabase remoto...');
    await client.query(sql);
    console.log('Tabela catalog_licenses criada e permissões aplicadas com sucesso!');

  } catch (err) {
    console.error('Erro ao executar migração:', err);
  } finally {
    await client.end();
    console.log('Conexão encerrada.');
  }
}

run();
