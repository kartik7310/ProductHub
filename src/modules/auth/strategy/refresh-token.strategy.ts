import { Injectable, UnauthorizedException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { PassportStrategy } from "@nestjs/passport"
import { ExtractJwt, Strategy } from "passport-jwt"
import { PrismaService } from "src/prisma/prisma.service"
import { Request } from "express"
import * as bcrypt from "bcrypt"

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, "RefreshToken") {
  constructor(private prisma: PrismaService, private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET', {
        infer: true
      })!,
      passReqToCallback: true
    })

  }

  //validate refresh token
  async validate(req: Request, payload: { email: string, sub: string }) {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Refresh token is not provided'
      )
    }
    const refreshToken = authHeader.split(' ')[1]
    if (!refreshToken) {
      throw new UnauthorizedException(
        'Refresh token is empty'
      )
    }
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub
      },

      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        password: false,
        refreshToken: true,
        createdAt: true,
        updatedAt: true,
      }
    })
    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException()
    }
    const refreshTokenMatch = await bcrypt.compare(refreshToken, user.refreshToken)
    if (!refreshTokenMatch) {
      throw new UnauthorizedException('Refresh token is not valid')
    }
    return { id: user.id, email: user.email, role: user.role }
  }

}