import { InputType, Field } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';

@InputType()
export class TwoFactorInput {
  @Field()
  @IsString()
  @Length(6, 6)
  code: string;
}
