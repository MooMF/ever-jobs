import { Module } from '@nestjs/common';
import { AmendconsultingService } from './amendconsulting.service';

@Module({ providers: [AmendconsultingService], exports: [AmendconsultingService] })
export class AmendconsultingModule {}
