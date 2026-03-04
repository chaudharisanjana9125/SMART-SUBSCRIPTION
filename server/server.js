const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/insights', require('./routes/insights'));
app.use('/api/pricing', require('./routes/pricing'));

app.use(express.static(path.join(__dirname, '..', 'clients')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'clients', 'index.html'));
});

const port = process.env.PORT || 5000;
connectDB(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/subsense').then(() => {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
});
