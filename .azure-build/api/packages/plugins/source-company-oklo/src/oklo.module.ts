import { Module } from '@nestjs/common';
import { OkloService } from './oklo.service';

@Module({ providers: [OkloService], exports: [OkloService] })
export class OkloModule {}
