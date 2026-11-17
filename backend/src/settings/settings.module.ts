import { Body, Controller, Get, Injectable, Module, Put, UseGuards } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { AdminGuard } from '../auth/auth.guard.js';
import { Settings, SettingsSchema, type SettingsUpdate, settingsUpdateSchema } from './settings.schema.js';

@Injectable()
export class SettingsService {
  constructor(@InjectModel(Settings.name) private readonly settings: Model<Settings>) {}

  async get() {
    const doc = await this.settings
      .findOneAndUpdate({}, {}, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true })
      .lean();
    const { _id, __v, createdAt, updatedAt, ...rest } = doc as unknown as Record<string, unknown>;
    return rest;
  }

  async update(dto: SettingsUpdate) {
    await this.settings.updateOne({}, { $set: dto }, { upsert: true, setDefaultsOnInsert: true });
    return this.get();
  }
}

@Controller()
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('settings')
  get() {
    return this.settings.get();
  }

  @Put('admin/settings')
  @UseGuards(AdminGuard)
  update(@Body({ schema: settingsUpdateSchema }) dto: SettingsUpdate) {
    return this.settings.update(dto);
  }
}

@Module({
  imports: [MongooseModule.forFeature([{ name: Settings.name, schema: SettingsSchema }])],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
