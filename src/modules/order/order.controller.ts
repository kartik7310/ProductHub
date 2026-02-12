import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ModerateThrottle, RelaxedThrottle } from 'src/common/decorator/custom-thorttlerdecorator';
import { ApiBody, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { OrderApiResponseDto, OrderResponseDto, PaginatedOrderResponseDto } from './dto/response-order.dto';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from '@prisma/client';
import { GetUser } from 'src/common/decorator/get-user.decorator';
import { QueryOrderDto } from './dto/query-order.dto';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }
  @ModerateThrottle()
  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ description: 'Order created successfully', type: OrderResponseDto })
  create(@Body() createOrderDto: CreateOrderDto, @GetUser('id') userId: string,) {
    return this.orderService.create(userId, createOrderDto);
  }

  @Get('admin/all')
  @Roles(Role.ADMIN)
  @RelaxedThrottle()
  @ApiOperation({ summary: '[ADMIN] Get all orders (paginated)' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    description: 'List of orders',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(OrderResponseDto) },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  async findAllForAdmin(@GetUser('id') userId: string, @Query() query: QueryOrderDto) {
    return await this.orderService.findAllForAdmin(userId, query);
  }

  // User Get own orders
  @Get()
  @RelaxedThrottle()
  @ApiOperation({ summary: 'Get all orders for current user (paginated)' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'List of user orders', type: PaginatedOrderResponseDto })
  async findAllForUser(@GetUser('id') userId: string, @Query() query: QueryOrderDto) {
    return await this.orderService.findAllForUser(userId, query);
  }


  // ADMIN: Get order by ID
  @Get('admin/:id')
  @Roles(Role.ADMIN)
  @RelaxedThrottle()
  @ApiOperation({ summary: '[ADMIN]: Get order by id' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiOkResponse({ description: 'Order details', type: OrderApiResponseDto })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async findOneAdmin(@Param('id') id: string) {
    return await this.orderService.findOne(id);
  }

  //get user order by id
  @Get(':id')
  @RelaxedThrottle()
  @ApiOperation({ summary: 'Get order by id' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiOkResponse({ description: 'Order details', type: OrderApiResponseDto })
  @ApiNotFoundResponse({ description: 'Order not found' })
  async findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return await this.orderService.findOne(id, userId);
  }

  // ADMIN update order
  @Patch('admin/:id')
  @Roles(Role.ADMIN)
  @ModerateThrottle()
  @ApiOperation({ summary: '[ADMIN] Update any order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiBody({ type: UpdateOrderDto })
  @ApiOkResponse({ description: 'Order update successfully', type: OrderApiResponseDto })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async updateAdmin(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return await this.orderService.update(id, dto);
  }

  // user: update order own order
  @Patch(':id')
  @RelaxedThrottle()
  @ApiOperation({ summary: 'Update order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiBody({ type: UpdateOrderDto })
  @ApiOkResponse({
    description: 'Order update successfully',
    type: OrderApiResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Order not found',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateOrderDto, @GetUser('id') userId: string) {
    return await this.orderService.update(id, dto, userId);
  }
  //Admin :cancle the order
  @Delete('admin/:id')
  @Roles(Role.ADMIN)
  @ModerateThrottle()
  @ApiOperation({ summary: '[ADMIN] Cancel order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiOkResponse({ description: 'Order cancelled successfully' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async cancelAdmin(@Param('id') id: string) {
    return await this.orderService.cancle(id);
  }

  //USER :cancle the order
  @Delete(':id')
  @ModerateThrottle()
  @ApiOperation({ summary: 'Cancel order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiOkResponse({ description: 'Order cancelled successfully' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async cancel(@Param('id') id: string, @GetUser('id') userId: string) {
    return await this.orderService.cancle(id, userId);
  }

}
