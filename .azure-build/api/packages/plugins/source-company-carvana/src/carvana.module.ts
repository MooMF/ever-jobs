import { Module } from '@nestjs/common';
import { CarvanaService } from './carvana.service';

@Module({ providers: [CarvanaService], exports: [CarvanaService] })
export class CarvanaModule {}
