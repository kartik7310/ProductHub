import { IsNotEmpty, IsString } from "class-validator";

export class confirPaymentDto {
    @IsNotEmpty()
    @IsString()
    paymentIntentId: string;

    @IsNotEmpty()
    @IsString()
    orderId: string;
}