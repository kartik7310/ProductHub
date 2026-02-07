import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from "../../prisma/prisma.service"
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) { }
  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        password: false,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: "desc" }
    })
    if (!users || users.length === 0) {
      return []
    }
    return users;
  }

  findOne(id: string) {
    const user = this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true

      }
    })

    if (!user) {
      throw new NotFoundException("User not found")
    }
    return user;

  }

  async update(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    })

    if (!user) {
      throw new NotFoundException("User not found")
    }
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const emailTaken = await this.prisma.user.findUnique({
        where: {
          email: updateUserDto.email,
        },
      });
      if (emailTaken) {
        throw new BadRequestException("Email already exists");
      }

    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        password: false,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true

      }

    })

    return updatedUser;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
