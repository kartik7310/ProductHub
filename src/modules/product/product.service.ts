import { ConflictException, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/response-product.dto';
import { PrismaClient } from '@prisma/client/extension';
import { Category, Prisma, Product } from '@prisma/client';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaClient) { }
  async create(createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    const existingSku = await this.prisma.product.findOne({ where: { sku: createProductDto.sku } });
    if (existingSku) {
      throw new ConflictException('Sku already exists');
    }
    const product = await this.prisma.product.create(
      {
        data: {
          ...createProductDto,
          price: new Prisma.Decimal(createProductDto.price),
        },
        select: {
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



  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
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
