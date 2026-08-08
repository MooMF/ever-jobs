import { Module } from '@nestjs/common';
import { AdaptivefinancialconsultingService } from './adaptivefinancialconsulting.service';

@Module({ providers: [AdaptivefinancialconsultingService], exports: [AdaptivefinancialconsultingService] })
export class AdaptivefinancialconsultingModule {}
