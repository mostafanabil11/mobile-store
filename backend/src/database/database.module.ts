import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Connects to MONGODB_URI. When it is empty (local development only), an
 * embedded MongoDB is started with its data kept in ./.mongo-data so the
 * project runs before a real database is available.
 */
async function resolveUri(config: ConfigService): Promise<string> {
  const uri = config.get<string>('MONGODB_URI');
  if (uri) return uri;

  if (config.get<string>('NODE_ENV') === 'production') {
    throw new Error('MONGODB_URI is required in production');
  }

  const logger = new Logger('Database');
  logger.warn('MONGODB_URI is empty — starting a local embedded MongoDB for development');
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const dbPath = join(process.cwd(), '.mongo-data');
  mkdirSync(dbPath, { recursive: true });
  const server = await MongoMemoryServer.create({
    instance: { dbPath, storageEngine: 'wiredTiger', port: 27099 },
  });
  return server.getUri('store');
}

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        uri: await resolveUri(config),
      }),
    }),
  ],
})
export class DatabaseModule {}
