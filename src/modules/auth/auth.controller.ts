import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { AuthResponseDto } from './dto/auth-response';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { GetUser } from './common/decorator/get-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService:AuthService){}

  @Post('signup')
  async signup(@Body() signupDto:SignupDto):Promise<AuthResponseDto>{
    return await this.authService.signup(signupDto);
  }

  @UseGuards(RefreshTokenGuard)
  async refresh(@GetUser('id')userId:string):Promise<AuthResponseDto>{
    return await this.authService.refreshToken(userId);
  }
  
}
