import { BadRequestException, ConflictException, Injectable, NotFoundException, Patch, UseGuards } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/response-product.dto';
import { Category, Prisma, Product } from '@prisma/client';
import { QueryProductDto } from './dto/query-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) { }


  async create(createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    const existingSku = await this.prisma.product.findUnique({ where: { sku: createProductDto.sku } });
    if (existingSku) {
      throw new ConflictException('Sku already exists');
    }
    const product = await this.prisma.product.create(
      {
        data: {
          ...createProductDto,
          price: new Prisma.Decimal(createProductDto.price),
        },
        include: {
          category: true,
        }
      }
    )

    return this.formatProduct(product);
  }

  async findAll(query: QueryProductDto) {
    const { category, isActive, search, page, limit } = query;
    const where: Prisma.ProductWhereInput = {}
    if (category) {
      where.categoryId = category
    }
    if (isActive !== undefined) {
      where.isActive = isActive
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }
    const skip = (page - 1) * limit;
    const take = limit;

    const data = await this.prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
      },
    });

    const total = await this.prisma.product.count({ where });
    return {
      data: data.map((product) => this.formatProduct(product)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }



  async findOne(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return this.formatProduct(product);
  }

  async update(productId: string, updateProductDto: UpdateProductDto): Promise<ProductResponseDto> {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }
    if (updateProductDto.sku && updateProductDto.sku !== existingProduct.sku) {
      const existingSku = await this.prisma.product.findUnique({
        where: { sku: updateProductDto.sku },
      });
      if (existingSku) {
        throw new ConflictException('Sku already exists');
      }
    }
    const updateData: any = { ...updateProductDto }
    if (updateProductDto.price !== undefined) {
      updateData.price = new Prisma.Decimal(updateProductDto.price)
    }
    const product = await this.prisma.product.update({
      where: { id: productId },
      data: {
        ...updateData,
      },
      include: {
        category: true,
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return this.formatProduct(product);
  }

  //update product stock
  async updateStock(productId: string, quantity: number): Promise<ProductResponseDto> {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }
    const newStock = existingProduct.stock + quantity;
    if (newStock < 0) {
      throw new BadRequestException('Insufficient stock');
    }
    const product = await this.prisma.product.update({
      where: { id: productId },
      data: {
        stock: newStock,
      },
      include: {
        category: true,
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return this.formatProduct(product);
  }


  async remove(productId: string): Promise<{ message: string }> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        _count: { select: { orderItems: true } }
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product._count.orderItems > 0) {
      throw new BadRequestException(
        `Cannot delete product ${product.name} as it is associated with an order`
      );
    }

    try {
      await this.prisma.product.delete({
        where: { id: productId },
      });

      return { message: "Product deleted successfully" };
    } catch (error) {
      throw new BadRequestException('Product cannot be deleted due to database constraints.');
    }
  }

  private formatProduct(
    product: Product & { category: Category },
  ) {
    return {
      ...product,
      price: Number(product.price),
      category: product.category.name,
    };
  }
}
