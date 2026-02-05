import { Role } from "@prisma/client";

export class AuthResponseDto{
    refreshToken:string;
    accessToken:string;
    user:{
        id:string;
        email:string;
        firstName:string;
        lastName:string;
        role:Role;
        createdAt:Date;
        updatedAt:Date;
    }
   
}