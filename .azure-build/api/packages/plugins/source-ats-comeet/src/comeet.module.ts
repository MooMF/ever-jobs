import { Module } from '@nestjs/common';
import { ComeetService } from './comeet.service';

@Module({ providers: [ComeetService], exports: [ComeetService] })
export class ComeetModule {}
