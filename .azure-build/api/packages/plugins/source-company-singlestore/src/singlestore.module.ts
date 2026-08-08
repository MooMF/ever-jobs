import { Module } from '@nestjs/common';
import { SinglestoreService } from './singlestore.service';

@Module({ providers: [SinglestoreService], exports: [SinglestoreService] })
export class SinglestoreModule {}
