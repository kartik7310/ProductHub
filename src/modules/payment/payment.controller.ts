import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guards';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/common/decorator/get-user.decorator';
import { PaymentApiResponseDto } from './dto/payment-response.dto';
import { confirPaymentDto } from './dto/payment-confirm.dto';

@Controller('payment')
@UseGuards(JwtAuthGuard)
@ApiTags('payment')
@ApiBearerAuth("JWT-auth")

export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @Post("payment-intent")
  @ApiOperation({ summary: "Create a payment intent" })
  @ApiResponse({ status: 201, description: "Payment intent created successfully" })
  @ApiResponse({ status: 400, description: "Invalid request" })
  create(@Body() createPaymentDto: CreatePaymentDto, @GetUser('id') userId: string) {
    return this.paymentService.create(createPaymentDto, userId);
  }

  @Post("verify")
  @ApiOperation({ summary: "Verify a payment" })
  @ApiResponse({ status: 200, description: "Payment confirmed successfully", type: PaymentApiResponseDto })
  @ApiResponse({ status: 400, description: "Invalid request" })
  verify(@Body() verifyPaymentDto: confirPaymentDto, @GetUser('id') userId: string) {
    return this.paymentService.verify(verifyPaymentDto, userId);
  }

  @Get("all")
  @ApiOperation({ summary: "Get all payments" })
  @ApiResponse({ status: 200, description: "Payments retrieved successfully", type: [PaymentApiResponseDto] })
  findAll(@GetUser('id') userId: string) {
    return this.paymentService.findAll(userId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a payment" })
  @ApiParam({ name: "id", description: "Payment ID", example: "234" })
  @ApiResponse({ status: 200, description: "Payment retrieved successfully", type: PaymentApiResponseDto })

  findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.paymentService.findOne(id, userId);
  }

  @Get("order/:orderId")
  @ApiOperation({ summary: "Get a payment" })
  @ApiParam({ name: "orderId", description: "Order ID", example: "234" })
  @ApiResponse({ status: 200, description: "Payment retrieved successfully", type: PaymentApiResponseDto })
  findOneByOrderId(@Param('orderId') orderId: string, @GetUser('id') userId: string) {
    return this.paymentService.findOneByOrderId(orderId, userId);
  }
}
