require('dotenv').config();
const App = require('./src/core/app');
const app = new App();

app.bootstrap().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});