import { IsString, Length } from 'class-validator';

export class JoinGroupDto {
  @IsString()
  @Length(8, 8, { message: 'O código de convite deve ter exatamente 8 caracteres' })
  code: string;
}
