import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello kartik how are you,Welcome to my e-commerce website!';
  }
}
