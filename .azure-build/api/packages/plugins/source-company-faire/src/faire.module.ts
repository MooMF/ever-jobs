import { Module } from '@nestjs/common';
import { FaireService } from './faire.service';

@Module({ providers: [FaireService], exports: [FaireService] })
export class FaireModule {}
