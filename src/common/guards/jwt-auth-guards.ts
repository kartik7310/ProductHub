import { AuthGuard } from "@nestjs/passport";
import { Reflector } from "@nestjs/core";
import { ExecutionContext } from "@nestjs/common";
import { Observable } from "rxjs";

export class JwtAuthGuard extends AuthGuard('jwt'){
    constructor(
      //reflector is used to get the metadata of the route
      private reflector:Reflector
    ){
        super()
    }

    canActivate(context: ExecutionContext) {
      
      return super.canActivate(context);
    }
     
    
}