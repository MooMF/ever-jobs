import { Module } from '@nestjs/common';
import { ShopmonkeyService } from './shopmonkey.service';

@Module({ providers: [ShopmonkeyService], exports: [ShopmonkeyService] })
export class ShopmonkeyModule {}
