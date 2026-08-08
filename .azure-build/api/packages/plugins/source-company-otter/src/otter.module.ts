import { Module } from '@nestjs/common';
import { OtterService } from './otter.service';

@Module({ providers: [OtterService], exports: [OtterService] })
export class OtterModule {}
