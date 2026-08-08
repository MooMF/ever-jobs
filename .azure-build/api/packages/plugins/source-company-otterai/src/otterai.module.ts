import { Module } from '@nestjs/common';
import { OtteraiService } from './otterai.service';

@Module({ providers: [OtteraiService], exports: [OtteraiService] })
export class OtteraiModule {}
