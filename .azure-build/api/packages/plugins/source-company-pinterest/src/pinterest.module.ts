import { Module } from '@nestjs/common';
import { PinterestService } from './pinterest.service';

@Module({ providers: [PinterestService], exports: [PinterestService] })
export class PinterestModule {}
