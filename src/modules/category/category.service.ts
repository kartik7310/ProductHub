import { ConflictException, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CategoryResponseDto } from './dto/category-response.dto';
import { Category, Prisma } from '@prisma/client';
import { QueryCategoryDto } from './dto/category-filter.dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) { }
  async create(createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const { name, slug, ...rest } = createCategoryDto;
    const categorySlug = slug ?? name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const existingCategory = await this.prisma.category.findUnique({ where: { slug: categorySlug } });
    if (existingCategory) {
      throw new Error('Category already exists');
    }

    const category = await this.prisma.category.create({
      data: {
        name,
        slug: categorySlug,
        ...rest,
      },
    });
    return this.categoryToResponse(category, 0);
  }

  async findAll(query: QueryCategoryDto): Promise<{
    data: CategoryResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const { isActive, search, page = 1, limit = 10 } = query;
    const where: Prisma.CategoryWhereInput = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    const totalCount = await this.prisma.category.count({ where });
    const categories = await this.prisma.category.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });
    const totalPages = Math.ceil(totalCount / limit);
    return {
      data: categories.map(category => this.categoryToResponse(category, category._count.products)),
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findOne(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: {
        id: categoryId,
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });
    if (!category) {
      throw new Error('Category not found');
    }
    return this.categoryToResponse(category, category._count.products);
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: {
        slug: slug,
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });
    if (!category) {
      throw new Error('Category not found');
    }
    return this.categoryToResponse(category, category._count.products);
  }


  async update(categoryId: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });
    if (!category) {
      throw new Error('Category not found');
    }
    if (category.slug !== updateCategoryDto.slug) {
      const existingCategory = await this.prisma.category.findUnique({
        where: {
          slug: updateCategoryDto.slug,
        },
      });
      if (existingCategory) {
        throw new ConflictException('Category slug already exists');
      }
    }
    const updatedCategory = await this.prisma.category.update({
      where: {
        id: categoryId,
      },
      data: updateCategoryDto,
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });
    return this.categoryToResponse(updatedCategory, updatedCategory._count.products);
  }

  async remove(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: {
        id: categoryId,
      },
      select: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });
    if (!category) {
      throw new Error('Category not found');
    }
    if (category._count.products > 0) {
      throw new Error(`Category has ${category._count.products} products`);
    }
    await this.prisma.category.delete({
      where: {
        id: categoryId,
      },
    });

    return { message: 'Category deleted successfully' };
  }

  private categoryToResponse(category: Category, productCount: number): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      isActive: category.isActive,
      productCount: productCount,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
