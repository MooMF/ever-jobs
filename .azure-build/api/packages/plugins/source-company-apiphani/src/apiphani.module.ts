import { Module } from '@nestjs/common';
import { ApiphaniService } from './apiphani.service';

@Module({ providers: [ApiphaniService], exports: [ApiphaniService] })
export class ApiphaniModule {}
