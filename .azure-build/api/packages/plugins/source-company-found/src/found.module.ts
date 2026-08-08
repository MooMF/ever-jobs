import { Module } from '@nestjs/common';
import { FoundService } from './found.service';

@Module({ providers: [FoundService], exports: [FoundService] })
export class FoundModule {}
