import { Module } from '@nestjs/common';
import { ApolloioService } from './apolloio.service';

@Module({ providers: [ApolloioService], exports: [ApolloioService] })
export class ApolloioModule {}
