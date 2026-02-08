import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

// DTO for updating user password
export class UpdateUserPasswordDto {

    @ApiProperty({
        description: 'User current password',
        example: 'kartik123',
        required: true,
    })
    @IsNotEmpty()
    @IsString()
    currentPassword: string;

    @ApiProperty({
        description: 'New User password',
        example: 'kartik123',
        required: true,
    })
    @IsNotEmpty()
    @IsString()
    newPassword: string;

    @ApiProperty({
        description: 'User confirm password',
        example: 'kartik123',
        required: true,
    })
    @IsNotEmpty()
    @IsString()
    confirmPassword: string;
}