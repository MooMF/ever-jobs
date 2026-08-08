import { Module } from '@nestjs/common';
import { AerospikeService } from './aerospike.service';

@Module({ providers: [AerospikeService], exports: [AerospikeService] })
export class AerospikeModule {}
