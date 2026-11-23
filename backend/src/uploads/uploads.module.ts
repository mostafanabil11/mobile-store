import {
  BadRequestException,
  Controller,
  Module,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminGuard } from '../auth/auth.guard.js';
import { MediaService } from '../media/media.module.js';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

/** Admin photo uploads. Files are kept in memory briefly, then stored in MongoDB via MediaService. */
@Controller('admin/uploads')
@UseGuards(AdminGuard)
export class UploadsController {
  constructor(private readonly media: MediaService) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED.has(file.mimetype)) cb(null, true);
        else cb(new BadRequestException('Only JPG, PNG, WebP or AVIF images are allowed'), false);
      },
    }),
  )
  async upload(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files?.length) throw new BadRequestException('No files uploaded');
    const urls = await Promise.all(files.map((f) => this.media.save(f.buffer, f.mimetype)));
    return { urls };
  }
}

@Module({ controllers: [UploadsController] })
export class UploadsModule {}
