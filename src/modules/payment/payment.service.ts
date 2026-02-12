import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import Stripe from 'stripe';
import { PaymentStatus, Prisma } from '@prisma/client';
import { confirPaymentDto } from './dto/payment-confirm.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';

@Injectable()
export class PaymentService {
  private stripe: Stripe
  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-01-28.clover',
    });
  }
  async create(createPaymentDto: CreatePaymentDto, userId: string): Promise<{ success: boolean; data: { clientSecret: string; paymentId: string; }; message: string; }> {
    const { orderId, amount, currency = 'INR', description } = createPaymentDto;
    const order = await this.prisma.order.findUnique({
      where: {
        id: orderId,
        userId,
      },
    });
    if (!order) {
      throw new NotFoundException("Order not found")
    }
    const existingPayment = await this.prisma.payment.findFirst({
      where: { orderId }
    })

    if (existingPayment && existingPayment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException("Payment already completed")
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata: {
        orderId,
        userId,
      },
      description,
    })

    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        userId,
        amount,
        currency,
        status: PaymentStatus.PENDING,
        paymentMethod: 'STRIPE',
        transactionId: paymentIntent.id,
      },
    })

    return {
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret!,
        paymentId: payment.id,
      },
      message: "Payment intent created successfully"
    }
  }

  async verify(confirPaymentDto: confirPaymentDto, userId: string) {
    const { paymentIntentId, orderId } = confirPaymentDto;
    const payment = await this.prisma.payment.findFirst({
      where: {
        userId,
        orderId,
        transactionId: paymentIntentId,
      },
    });
    if (!payment) {
      throw new NotFoundException("Payment not found")
    }
    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException("Payment already completed")
    }
    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      throw new BadRequestException("Payment not completed")
    }
    const [updatePayment] = await this.prisma.$transaction([
      this.prisma.payment.update({
        where: {
          id: payment.id
        },
        data: {
          status: PaymentStatus.COMPLETED,

        }
      })
    ]);
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
    })
    if (order?.cartId) {
      await this.prisma.cart.update({
        where: {
          id: order.cartId,
        },
        data: {
          checkout: true,
        }
      })
    }
    return {
      success: true,
      data: this.mapToPaymentResponse(updatePayment),
      message: "Payment confirmed successfully"
    }

  }


  private mapToPaymentResponse(payment: {
    id: string;
    userId: string;
    amount: Prisma.Decimal;
    currency: string;
    status: PaymentStatus;
    paymentMethod: string;
    transactionId: string;
    orderId: string;
    createdAt: Date;
    updatedAt: Date;
  }): PaymentResponseDto {
    return {
      id: payment.id,
      userId: payment.userId,
      amount: payment.amount.toNumber(),
      currency: payment.currency,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      orderId: payment.orderId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }
  }
  async findAll(userId: string): Promise<{ success: boolean; data: PaymentResponseDto[]; message: string; }> {
    const payments = await this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    })
    return {
      success: true,
      data: payments.map((payment) => this.mapToPaymentResponse(payment)),
      message: "Payments retrieved successfully"
    }
  }

  async findOne(userId: string, id: string): Promise<{ success: boolean; data: PaymentResponseDto; message: string; }> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    })
    if (!payment) {
      throw new NotFoundException("Payment not found")
    }
    return {
      success: true,
      data: this.mapToPaymentResponse(payment),
      message: "Payment retrieved successfully"
    }
  }

  async findOneByOrderId(userId: string, orderId: string): Promise<{ success: boolean; data: PaymentResponseDto; message: string; }> {
    const payment = await this.prisma.payment.findFirst({
      where: { orderId, userId },
    })
    if (!payment) {
      throw new NotFoundException("Payment not found")
    }
    return {
      success: true,
      data: payment ? this.mapToPaymentResponse(payment) : null,
      message: "Payment retrieved successfully"
    }
  }

}
