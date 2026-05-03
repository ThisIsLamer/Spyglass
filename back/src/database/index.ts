import { MikroORM, RequestContext } from '@mikro-orm/mariadb';
import config from './mikro-orm.config.js';

export let orm: MikroORM;

export async function initializeDatabase() {
  try {
    orm = await MikroORM.init(config);
    console.log('MikroORM connected successfully.');

    const migrator = orm.migrator;
    await migrator.up();
    console.log('Database schema synchronized.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}

export { RequestContext };
