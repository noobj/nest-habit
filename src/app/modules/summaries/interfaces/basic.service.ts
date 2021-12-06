import { User } from '../../users';

export interface IBasicService<T, R> {
    getRawDailySummaries(
        startDate: string,
        endDate: string,
        user: Partial<User>
    ): Promise<T[]>;

    processTheRawSummaries(rawData: T[]): Promise<R[]>;

    getLongestDayRecord(rawData: T[]): {
        date: string;
        duration: string;
    };

    getTotalDuration(rawData: T[]): string;

    getTotalThisMonth(rawData: T[]): string;

    getCurrentStreak(user: Partial<User>): Promise<number>;
}
