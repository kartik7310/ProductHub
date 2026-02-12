import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderDto {
    @IsEnum(OrderStatus)
    @IsOptional()
    status?: OrderStatus;

    @IsString()
    @IsOptional()
    trackingNumber?: string


    @IsString()
    @IsOptional()
    notes?: string
}
