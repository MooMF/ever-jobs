import { Module } from '@nestjs/common';
import { AcryldataService } from './acryldata.service';

@Module({ providers: [AcryldataService], exports: [AcryldataService] })
export class AcryldataModule {}
