import {
  IsBoolean,
  IsDefined,
  IsEmail,
  IsIn,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AddTeamMemberDto {
  @IsDefined()
  @IsEmail()
  email: string;

  @IsString()
  @IsIn(['USER', 'ADMIN'])
  role: string;

  @IsString()
  @IsDefined()
  @MinLength(12, {
    message: 'Password must be at least 12 characters long',
  })
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
    message:
      'Password must include uppercase, lowercase, number and special character',
  })
  password: string;

  @IsDefined()
  @IsBoolean()
  sendEmail: boolean;
}
