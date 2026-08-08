import { Module } from '@nestjs/common';
import { ApollobehaviorservicesService } from './apollobehaviorservices.service';

@Module({ providers: [ApollobehaviorservicesService], exports: [ApollobehaviorservicesService] })
export class ApollobehaviorservicesModule {}
