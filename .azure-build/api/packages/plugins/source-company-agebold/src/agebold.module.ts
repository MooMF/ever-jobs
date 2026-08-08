import { Module } from '@nestjs/common';
import { AgeboldService } from './agebold.service';

@Module({ providers: [AgeboldService], exports: [AgeboldService] })
export class AgeboldModule {}
