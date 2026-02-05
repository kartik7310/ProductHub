  import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
  import { PrismaService } from 'src/prisma/prisma.service';
  import { SignupDto } from './dto/signup.dto';
  import { AuthResponseDto } from './dto/auth-response';
  import { Role } from '@prisma/client';
  import * as bcrypt from "bcrypt";
  import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';

  @Injectable()
  export class AuthService {
    constructor(
      private prisma:PrismaService,
      private readonly jwtService:JwtService
    ){}

    async signup(signupDto:SignupDto):Promise<AuthResponseDto>{
      const {firstName,lastName,email,password,confirmPassword}=signupDto;
      if(password!==confirmPassword){
        throw new BadRequestException("Passwords do not match");
      }
      const SALT_ROUNDS = 10;
      const existingUser = await this.prisma.user.findUnique({
        where:{email}
      })
      if(existingUser){
        throw new ConflictException("User already exists");
      }
      
     try {
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await this.prisma.user.create({
        data:{
          firstName,
          lastName,
          email,
          password:hashedPassword,
          role:Role.USER
        },
        select:{
          id:true,
          email:true,
          firstName:true,
          lastName:true,
          password:false,
          role:true,
          refreshToken:true,
          createdAt:true,
          updatedAt:true
        }
      })
      const token = await this.generateTokens(user.id,user.email,user.role)
      await this.updateRefreshToken(user.id,token.refreshToken)
      return {
        ...token,user
      }
     
    } catch (error) {
     console.error("Error during user registration",error)
     throw new InternalServerErrorException('An Error occurred during user registration')
    }


   }

    private async generateTokens(userId:string,email:string,role:Role):Promise<{accessToken:string,refreshToken:string}>{
      const payload = { sub:userId, email:email,role:role }
      const refreshId= randomBytes(16).toString('hex')
     const [accessToken,refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload,{ expiresIn:'15m'}),
      this.jwtService.signAsync({...payload,refreshId},{ expiresIn:'7d'})
     ])
      return {accessToken,refreshToken}
    }
      

    //update refresh token
     async updateRefreshToken(userId:string,refreshToken:string):Promise<void>{
      await this.prisma.user.update({
        where:{id:userId},
        data:{refreshToken}
      })
    }

  }
