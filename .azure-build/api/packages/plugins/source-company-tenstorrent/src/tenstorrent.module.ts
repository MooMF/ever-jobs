import { Module } from '@nestjs/common';
import { TenstorrentService } from './tenstorrent.service';

@Module({ providers: [TenstorrentService], exports: [TenstorrentService] })
export class TenstorrentModule {}
