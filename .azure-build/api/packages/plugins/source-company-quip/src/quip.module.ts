import { Module } from '@nestjs/common';
import { QuipService } from './quip.service';

@Module({ providers: [QuipService], exports: [QuipService] })
export class QuipModule {}
