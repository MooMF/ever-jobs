import { Module } from '@nestjs/common';
import { CultureampService } from './cultureamp.service';

@Module({ providers: [CultureampService], exports: [CultureampService] })
export class CultureampModule {}
