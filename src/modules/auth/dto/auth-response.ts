import { ApiProperty } from "@nestjs/swagger";
import { Role } from "@prisma/client";

export class AuthResponseDto {
    @ApiProperty({
        description: 'Access token for authentication',
        example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    })
    refreshToken: string;

    @ApiProperty({
        description: 'Refresh token for obtaining new access tokens',
        example:
            'dGhpcy1pcz1hLXJlZnJlc2gtdG9rZW4tZXhhbXBsZS13aXRoLXN1ZmZpY2lhbC1jaGFyYWN0ZXJzIQ==',
    })
    accessToken: string;

    @ApiProperty({
        description: 'Authenticated user information',
        example: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: '<EMAIL>',
            firstName: 'John',
            lastName: 'Doe',
            role: 'USER',
            createdAt: '2023-10-01T12:34:56.789Z',
            updatedAt: '2023-10-10T12:34:56.789Z',
        },
    })
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: Role;
        createdAt: Date;
        updatedAt: Date;
    }

}