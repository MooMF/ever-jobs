import { Module } from '@nestjs/common';
import { OzowService } from './ozow.service';

@Module({ providers: [OzowService], exports: [OzowService] })
export class OzowModule {}
