import { Module } from '@nestjs/common';
import { TatariService } from './tatari.service';

@Module({ providers: [TatariService], exports: [TatariService] })
export class TatariModule {}
