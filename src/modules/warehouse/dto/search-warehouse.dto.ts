import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { PageOptionsDto } from "src/common/dto/page-option.dto";

export class SearchWarehouseDto extends PageOptionsDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    q?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    code?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    from_date?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    to_date?: string;
} 