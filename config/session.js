import session from 'express-session';
import MongoStore from 'connect-mongo';

export default function sessionConfig(app) {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'secret-key',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/medistore' }),
      cookie: { maxAge: 1000 * 60 * 60 * 2 }, // 2 hours
    })
  );
}