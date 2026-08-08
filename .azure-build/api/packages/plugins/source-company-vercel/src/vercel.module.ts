import { Module } from '@nestjs/common';
import { VercelService } from './vercel.service';

@Module({ providers: [VercelService], exports: [VercelService] })
export class VercelModule {}
