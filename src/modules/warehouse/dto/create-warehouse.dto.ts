import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { StringField } from "src/common/decorators/field.decorator";

export class CreateWarehouseDto {
   @StringField()
    code: string;

   @StringField()
    name: string;

   @StringField()
    address: string;
} 