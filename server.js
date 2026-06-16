'use strict';

const app = require('./app');
const { isPostgres, ready } = require('./database');

const PORT = process.env.PORT || 3001;

ready.then(() => {
  app.listen(PORT, () => {
    const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
    console.log(`\n🥿  Buy One Shoe server running (${mode}, ${isPostgres ? 'Postgres' : 'SQLite'})`);
    console.log(`   API  → http://localhost:${PORT}/api`);
    console.log(`   App  → http://localhost:${PORT}\n`);
  });
}).catch((err) => {
  console.error('Failed to initialize database');
  console.error(err);
  process.exit(1);
});
