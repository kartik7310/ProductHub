import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guards';
import { RolesGuard } from 'src/common/guards/user-role-guard';
import { ProductResponseDto } from './dto/response-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Controller('product')
export class ProductController {
  constructor(private productService: ProductService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a new product (Admin Only)',
  })
  @ApiBody({
    type: CreateProductDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Sku already exists',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  create(@Body() createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    return this.productService.create(createProductDto);
  }



  // Get all products
  @Get()
  @ApiOperation({
    summary: 'Get all products with optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'List of products with pagination',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ProductResponseDto' },
        },

        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  findAll(@Query() query: QueryProductDto) {
    return this.productService.findAll(query);
  }

  // Get product by id
  @Get(':id')
  @ApiOperation({
    summary: 'Get product by id',
  })
  @ApiResponse({
    status: 200,
    description: 'Product found successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  findOne(@Param('id') productId: string): Promise<ProductResponseDto> {
    return this.productService.findOne(productId);
  }

  // Update product
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update product (Admin Only)',
  })
  @ApiBody({
    type: UpdateProductDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  update(@Param('id') productId: string, @Body() updateProductDto: UpdateProductDto): Promise<ProductResponseDto> {
    return this.productService.update(productId, updateProductDto);
  }

  // Update product stock
  @Patch(':id/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update product stock (Admin Only)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        quantity: {
          type: 'number',
          description:
            'Stock adjustment ( positive to add, negative to subtract) ',
          example: 10,
        },
      },
      required: ['quantity'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Stock updated successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Insufficient stock',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })

  async updateStock(@Param('id') productId: string, @Body('quantity') quantity: number): Promise<ProductResponseDto> {
    return this.productService.updateStock(productId, quantity);
  }


  // Delete product
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete product (Admin Only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  remove(@Param('id') productId: string): Promise<{ message: string }> {
    return this.productService.remove(productId);
  }
}
