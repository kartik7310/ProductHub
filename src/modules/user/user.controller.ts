import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';

import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiResponseProperty, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth-guards';
import { RolesGuard } from '../../common/guards/user-role-guard';
import type { RequestWithUser } from 'src/common/interfaces/request-with-user.interface';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from '@prisma/client';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';

@ApiTags('User')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get("me")
  @ApiOperation({ summary: 'Get current user' })

  async getProfile(@Req() req: RequestWithUser) {
    return await this.userService.findOne(req.user.id);
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
  async update(@Param('id') userId: string, @Body() updateUserDto: UpdateUserDto) {
    return await this.userService.update(userId, updateUserDto);
  }

  //change password
  @Patch('change-password')
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully', type: UserResponseDto, })
  @ApiResponse({ status: 401, description: 'Unauthorized', })
  @ApiResponse({ status: 404, description: 'User not found', })
  async changePassword(@Param('id') userId: string, @Body() updateUserPasswordDto: UpdateUserPasswordDto) {
    return await this.userService.updatePassword(userId, updateUserPasswordDto);
  }

  //delete currect user
  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully', type: UserResponseDto, })
  @ApiResponse({ status: 401, description: 'Unauthorized', })
  @ApiResponse({ status: 404, description: 'User not found', })
  async deleteAccount(@Param('id') userId: string): Promise<{ message: string }> {
    return await this.userService.remove(userId);
  }

  //delete user by id (admin only)
  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully', type: UserResponseDto, })
  @ApiResponse({ status: 401, description: 'Unauthorized', })
  @ApiResponse({ status: 404, description: 'User not found', })
  async deleteUser(@Param('id') userId: string): Promise<{ message: string }> {
    return await this.userService.remove(userId);
  }
}
