import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { AuthResponseDto } from './dto/auth-response';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { GetUser } from './common/decorator/get-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth-guards';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService:AuthService){}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() signupDto:SignupDto):Promise<AuthResponseDto>{
    return await this.authService.signup(signupDto);
  }

  //refresh token
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshTokenGuard)
  async refresh(@GetUser('id')userId:string):Promise<AuthResponseDto>{
    return await this.authService.refreshToken(userId);
  }

  //logout 
   @Get('logout')
   @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
 
  async logout(@GetUser('id')userId:string):Promise<void>{
    await this.authService.logout(userId);
  }
  

  //login
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto:LoginDto):Promise<AuthResponseDto>{
    return await this.authService.login(loginDto);
  }
}
