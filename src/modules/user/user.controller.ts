import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiResponseProperty, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth-guards';
import { RolesGuard } from '../../common/guards/user-role-guard';
import type { RequestWithUser } from 'src/common/interfaces/request-with-user.interface';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from '@prisma/client';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('User')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get("me")
  @ApiOperation({ summary: 'Get current user' })

  getProfile(@Req() req: RequestWithUser) {
    return this.userService.findOne(req.user.id);
  }

  //admin purpose only
  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of all users', type: [UserResponseDto], })
  @ApiResponse({ status: 401, description: 'Unauthorized', })
  @ApiResponse({ status: 403, description: 'Forbidden', })
  findAll(): Promise<UserResponseDto[]> {
    return this.userService.findAll();
  }

  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully', type: UserResponseDto, })
  @ApiResponse({ status: 401, description: 'Unauthorized', })
  @ApiResponse({ status: 404, description: 'User not found', })
  @Patch('me')
  update(@Param('id') userId: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(userId, updateUserDto);
  }

}
