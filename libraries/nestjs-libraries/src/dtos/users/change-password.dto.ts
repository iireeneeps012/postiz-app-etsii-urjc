import { IsDefined, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsDefined()
  currentPassword: string;

  @IsString()
  @IsDefined()
  @MinLength(3)
  @MaxLength(64)
  newPassword: string;
}
