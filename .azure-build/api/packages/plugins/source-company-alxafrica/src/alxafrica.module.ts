import { Module } from '@nestjs/common';
import { AlxafricaService } from './alxafrica.service';

@Module({ providers: [AlxafricaService], exports: [AlxafricaService] })
export class AlxafricaModule {}
