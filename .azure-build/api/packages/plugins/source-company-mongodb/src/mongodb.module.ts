import { Module } from '@nestjs/common';
import { MongoDbService } from './mongodb.service';

@Module({ providers: [MongoDbService], exports: [MongoDbService] })
export class MongoDbModule {}
