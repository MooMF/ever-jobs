import { Module } from '@nestjs/common';
import { CoreWeaveService } from './coreweave.service';

@Module({ providers: [CoreWeaveService], exports: [CoreWeaveService] })
export class CoreWeaveModule {}
