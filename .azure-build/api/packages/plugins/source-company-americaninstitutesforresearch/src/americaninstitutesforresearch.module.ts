import { Module } from '@nestjs/common';
import { AmericaninstitutesforresearchService } from './americaninstitutesforresearch.service';

@Module({ providers: [AmericaninstitutesforresearchService], exports: [AmericaninstitutesforresearchService] })
export class AmericaninstitutesforresearchModule {}
