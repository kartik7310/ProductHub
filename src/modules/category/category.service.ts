import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CategoryResponseDto } from './dto/category-response.dto';
import { Category } from '@prisma/client';

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

  async findAll() {
    const categories = await this.prisma.category.findMany({
      include: {
        products: true,
      },
    });
    return categories;
  }

  async findOne(id: number) {
    return `This action returns a #${id} category`;
  }

  update(id: number, updateCategoryDto: UpdateCategoryDto) {
    return `This action updates a #${id} category`;
  }

  remove(id: number) {
    return `This action removes a #${id} category`;
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
