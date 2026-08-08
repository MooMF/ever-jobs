import { Module } from '@nestjs/common';
import { TripactionsService } from './tripactions.service';

@Module({ providers: [TripactionsService], exports: [TripactionsService] })
export class TripactionsModule {}
