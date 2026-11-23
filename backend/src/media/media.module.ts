import {
  Controller,
  Get,
  Global,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Response } from 'express';
import { type Connection, mongo } from 'mongoose';
import { randomUUID } from 'node:crypto';

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
};

/**
 * Product photos live in MongoDB (GridFS bucket "media") so they survive restarts on
 * hosts with ephemeral disks (e.g. Render's free plan). Public URLs stay `/uploads/<file>`.
 */
@Injectable()
export class MediaService {
  private bucket?: mongo.GridFSBucket;

  constructor(@InjectConnection() private readonly connection: Connection) {}

  private get files() {
    if (!this.connection.db) throw new Error('Database not connected');
    this.bucket ??= new mongo.GridFSBucket(this.connection.db, { bucketName: 'media' });
    return this.bucket;
  }

  static extensionFor(contentType: string) {
    return EXT_BY_TYPE[contentType] ?? '';
  }

  /** Stores an image and returns its public URL path. */
  async save(buffer: Buffer, contentType: string): Promise<string> {
    const filename = `${randomUUID()}${MediaService.extensionFor(contentType)}`;
    await new Promise<void>((resolve, reject) => {
      const upload = this.files.openUploadStream(filename, { metadata: { contentType } });
      upload.once('error', reject).once('finish', () => resolve());
      upload.end(buffer);
    });
    return `/uploads/${filename}`;
  }

  async find(filename: string) {
    const [file] = await this.files.find({ filename }).limit(1).toArray();
    return file ?? null;
  }

  open(filename: string) {
    return this.files.openDownloadStreamByName(filename);
  }
}

/** Serves stored photos at /api/uploads/:filename (the frontend maps /uploads/* here). */
@Controller('uploads')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Get(':filename')
  async get(@Param('filename') filename: string, @Res() res: Response) {
    if (!/^[\w.-]+$/.test(filename)) throw new NotFoundException();
    const file = await this.media.find(filename);
    if (!file) throw new NotFoundException();

    res.setHeader('Content-Type', (file.metadata?.contentType as string) ?? 'application/octet-stream');
    res.setHeader('Content-Length', String(file.length));
    // Filenames are random and never reused, so browsers and CDNs may cache them forever.
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    this.media
      .open(filename)
      .once('error', () => res.destroy())
      .pipe(res);
  }
}

@Global()
@Module({
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
