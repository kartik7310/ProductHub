import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { AuthResponseDto } from './dto/auth-response';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService:AuthService){}

  @Post('signup')
  async signup(@Body() signupDto:SignupDto):Promise<AuthResponseDto>{
    return this.authService.signup(signupDto);
  }
}

