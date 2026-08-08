import { Module } from '@nestjs/common';
import { RobinhoodService } from './robinhood.service';

@Module({ providers: [RobinhoodService], exports: [RobinhoodService] })
export class RobinhoodModule {}
