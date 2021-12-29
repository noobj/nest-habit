import { IsDateString, IsInt, ValidateNested } from 'class-validator';
import { User } from './entities/users.entity';

export class CreateDailySummaryDto {
    @IsDateString()
    date: string;

    @IsInt()
    project: number;

    @IsInt()
    duration: number;

    user: User;
}

// for validating CreateDailySummaryDto array only
export class WrapperCreateDailySummaryDto {
    @ValidateNested({ each: true })
    public list: CreateDailySummaryDto[];

    constructor(list: CreateDailySummaryDto[]) {
        this.list = list;
    }
}
