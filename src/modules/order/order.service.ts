import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderApiResponseDto, OrderResponseDto, PaginatedOrderResponseDto } from './dto/response-order.dto';
import { Cart, Order, OrderItem, OrderStatus, Product, User } from '@prisma/client';
import { QueryOrderDto } from './dto/query-order.dto';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) { }
  async create(userId: string, createOrderDto: CreateOrderDto): Promise<OrderApiResponseDto<OrderResponseDto>> {
    const { shippingAddress, items } = createOrderDto;
    if (!items || items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }
    const productIds = items.map((item) => item.productId);
    const order = await this.prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: {
          id: {
            in: productIds,
          },
        },
      });

      const productMap = new Map(products.map((product) => [product.id, product]));
      let totalAmout: number = 0;
      let latestCart: Cart | null = null;
      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }
        const updateded = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },

          },
        });

        if (updateded.count === 0) {
          throw new BadRequestException(`Product ${item.productId} is out of stock`);
        }
        totalAmout += Number(product.price) * item.quantity;
        latestCart = await tx.cart.findFirst({
          where: {
            userId,
            checkout: false,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
      }

      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const newOrder = await tx.order.create({
        data: {
          userId,
          orderNumber,
          status: OrderStatus.PENDING,
          totalAmount: totalAmout,
          shippingAddress,
          cartId: latestCart?.id,
          orderItems: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: productMap.get(item.productId)!.price,
            })),
          },
        },
        include: {
          orderItems: {
            include: {
              product: true
            },
          },
          user: true,
        },
      });

      return this.wrap(newOrder);
    })
    return order



  }

  async findAllForAdmin(userId: string, query: QueryOrderDto): Promise<{ data: OrderApiResponseDto[], total: number, page: number, limit: number }> {
    const { page = 1, limit = 10, status, search } = query;
    const skip = (page - 1) * limit;
    const where: any = { userId };
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [{ id: { contains: search } }, { orderNumber: { contains: search } }]
    }
    const [orders, total] = await Promise.all([
      await this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
          user: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      await this.prisma.order.count({ where })
    ])
    return {
      data: orders.map((o) => this.wrap(o)),
      total,
      page,
      limit,
    }
  }

  async findAllForUser(userId: string, query: QueryOrderDto): Promise<{ data: OrderApiResponseDto[], total: number, page: number, limit: number }> {
    const { page = 1, limit = 10, status, search } = query
    const skip = (page - 1) * limit
    const where: any = { userId };
    if (status) {
      where.status = status
    }
    if (search) {
      where.OR = [{ id: { contains: search } }, { orderNumber: { contains: search } }]
    }
    const [orders, total] = await Promise.all([
      await this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
          user: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      await this.prisma.order.count({ where })
    ])
    return {
      data: orders.map((o) => this.wrap(o)),
      total,
      page,
      limit,
    }
  }

  async findOne(id: string, userId?: string): Promise<OrderApiResponseDto<OrderResponseDto>> {
    const where: any = { id }
    if (userId) {
      where.userId = userId
    }
    const order = await this.prisma.order.findUnique({
      where,
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    return this.wrap(order);
  }

  async update(id: string, updateOrderDto: UpdateOrderDto, userId?: string): Promise<OrderApiResponseDto<OrderResponseDto>> {

    const where: any = { id }
    if (userId) {
      where.userId = userId
    }
    const product = await this.prisma.order.findFirst({
      where
    })
    if (!product) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    const updated = await this.prisma.order.update({
      where: { id },
      data: updateOrderDto,
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });
    return this.wrap(updated);
  }

  async cancle(id: string, userId?: string): Promise<OrderApiResponseDto<OrderResponseDto>> {
    const where: any = { id }
    if (userId) {
      where.userId = userId
    }
    const cancleOrder = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          ...where,
          status: OrderStatus.PENDING
        },
        include: {
          orderItems: true,
        },
      })
      if (!order) {
        throw new NotFoundException(`Order ${id} not found`);
      }
      for (const items of order.orderItems) {
        await tx.product.update({
          where: { id: items.productId },
          data: { stock: { increment: items.quantity } },
        });
      }
      return tx.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED },
        include: {
          orderItems: { include: { product: true } },
          user: true
        },
      });
    })
    return this.wrap(cancleOrder)
  }

  private wrap(
    order: Order & {
      orderItems: (OrderItem & { product: Product })[];
      user: User;
    },
  ): OrderApiResponseDto<OrderResponseDto> {
    return {
      success: true,
      message: 'Order retreived successfully',
      data: this.map(order),
    };
  }

  private map(
    order: Order & {
      orderItems: (OrderItem & { product: Product })[];
      user: User;
    },
  ): OrderResponseDto {
    return {
      id: order.id,
      userId: order.userId,
      status: order.status,
      total: Number(order.totalAmount),
      shippingAddress: order.shippingAddress ?? '',
      items: order.orderItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.price) * item.quantity,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })),
      ...(order.user && {
        userEmail: order.user.email,
        userName:
          `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim(),
      }),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
