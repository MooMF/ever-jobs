import { Module } from '@nestjs/common';
import { FivetranService } from './fivetran.service';

@Module({ providers: [FivetranService], exports: [FivetranService] })
export class FivetranModule {}
