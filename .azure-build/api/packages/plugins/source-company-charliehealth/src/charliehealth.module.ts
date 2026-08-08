import { Module } from '@nestjs/common';
import { CharlieHealthService } from './charliehealth.service';

@Module({ providers: [CharlieHealthService], exports: [CharlieHealthService] })
export class CharlieHealthModule {}
