import { Module } from '@nestjs/common';
import { AcommerceService } from './acommerce.service';

@Module({ providers: [AcommerceService], exports: [AcommerceService] })
export class AcommerceModule {}
