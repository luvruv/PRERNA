import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'customer@prernastore.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Prerna@123' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'Priya Sharma' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '+91 99887 76655', required: false })
  @IsString()
  @IsOptional()
  phone?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'customer@prernastore.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Prerna@123' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'customer@prernastore.local' })
  @IsEmail()
  email!: string;
}
export class ResetPasswordDto {
  @ApiProperty({ example: 'customer@prernastore.local' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'a1b2c3d4e5f6...' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ example: 'NewPass@123' })
  @IsString()
  @MinLength(6)
  newPassword!: string;
}
