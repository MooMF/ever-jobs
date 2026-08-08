import { Module } from '@nestjs/common';
import { AlphasenseService } from './alphasense.service';

@Module({ providers: [AlphasenseService], exports: [AlphasenseService] })
export class AlphasenseModule {}
