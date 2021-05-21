import { IsDateString, IsInt, ValidateNested } from 'class-validator';

export class CreateDailySummaryDto {
    @IsDateString()
    date: string;

    @IsInt()
    project: number;

    @IsInt()
    duration: number;
}

// for validating CreateDailySummaryDto array only
export class WrapperCreateDailySummaryDto {
    @ValidateNested({ each: true })
    public list: CreateDailySummaryDto[];

    constructor(list: CreateDailySummaryDto[]) {
        this.list = list;
    }
}
