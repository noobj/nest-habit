export const convertRawDurationToFormat = (duration: number): string => {
    const durationInMinute = duration / 1000 / 60;

    if (durationInMinute < 1) {
        return '1m';
    }

    const hours = Math.floor(durationInMinute / 60);
    const minutes = Math.floor(durationInMinute % 60);

    if (hours == 0) return `${minutes}m`;

    return `${hours}h${minutes}m`;
};

export const getCacheString = (
    prefix: string,
    userId: number | string,
    startDate: string,
    endDate: string
): string => {
    prefix = prefix.toLowerCase();
    const cacheId = Buffer.from(startDate + endDate).toString('base64');
    return `${prefix}:${userId}:${cacheId}`;
};
