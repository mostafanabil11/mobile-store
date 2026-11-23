import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';

/** Cheap liveness check for Render and the keep-alive ping. */
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  check() {
    return { ok: true, db: this.connection.readyState === 1 ? 'up' : 'down' };
  }
}
