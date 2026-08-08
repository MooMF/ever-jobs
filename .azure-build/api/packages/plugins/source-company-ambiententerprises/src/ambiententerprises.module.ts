import { Module } from '@nestjs/common';
import { AmbiententerprisesService } from './ambiententerprises.service';

@Module({ providers: [AmbiententerprisesService], exports: [AmbiententerprisesService] })
export class AmbiententerprisesModule {}
