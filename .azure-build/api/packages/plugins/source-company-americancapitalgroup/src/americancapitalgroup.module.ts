import { Module } from '@nestjs/common';
import { AmericancapitalgroupService } from './americancapitalgroup.service';

@Module({ providers: [AmericancapitalgroupService], exports: [AmericancapitalgroupService] })
export class AmericancapitalgroupModule {}
