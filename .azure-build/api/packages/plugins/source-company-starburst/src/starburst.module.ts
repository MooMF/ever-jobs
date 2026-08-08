import { Module } from '@nestjs/common';
import { StarburstService } from './starburst.service';

@Module({ providers: [StarburstService], exports: [StarburstService] })
export class StarburstModule {}
