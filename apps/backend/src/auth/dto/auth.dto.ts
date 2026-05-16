import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;
const PASSWORD_MESSAGE =
  'A senha deve ter no mínimo 6 caracteres, uma letra maiúscula, uma minúscula e um caractere especial';

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString()
  @MinLength(6, { message: PASSWORD_MESSAGE })
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password: string;

  @IsString()
  confirmPassword: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString()
  password: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;
}

export class VerifyOtpDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString()
  otp: string;
}

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString()
  otp: string;

  @IsString()
  @MinLength(6, { message: PASSWORD_MESSAGE })
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  newPassword: string;

  @IsString()
  confirmPassword: string;
}
