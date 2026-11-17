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
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { diskStorage } from 'multer';
import { AdminGuard } from '../auth/auth.guard.js';

const UPLOAD_DIR = join(process.cwd(), 'uploads');
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

/**
 * Stores product images on local disk and serves them from /uploads.
 * Swap for S3 / Cloudinary later without changing the API shape.
 */
@Controller('admin/uploads')
@UseGuards(AdminGuard)
export class UploadsController {
  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          mkdirSync(UPLOAD_DIR, { recursive: true });
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED.has(file.mimetype)) cb(null, true);
        else cb(new BadRequestException('Only JPG, PNG, WebP or AVIF images are allowed'), false);
      },
    }),
  )
  upload(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files?.length) throw new BadRequestException('No files uploaded');
    return { urls: files.map((f) => `/uploads/${f.filename}`) };
  }
}

@Module({ controllers: [UploadsController] })
export class UploadsModule {}
