
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){

    constructor(private prisma:PrismaService,private configService:ConfigService){
     super({
    jwtFromRequest:ExtractJwt.fromAuthHeaderAsBearerToken(),
    ignoreExpiration:false,
    secretOrKey:configService.get<string>('JWT_SECRET',{
      infer:true
    })!,
    
  })
  
  }
   async validate(payload:{email:string,sub:string}) {
   const user = await this.prisma.user.findUnique({
    where:{
      id:payload.sub
    },

    select:{
      id:true,
      firstName:true,
      lastName:true,
      email:true,
      role:true,
      password:false,
      createdAt:true,
      updatedAt:true,
    }
   })
   if(!user){
    throw new UnauthorizedException()
   }
   return user
  }
  
}
