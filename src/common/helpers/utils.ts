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

/**
 * For formatting the winston timestamp
 * @returns function
 */
export const timezoned = () => {
    const tz = process.env.TZ ?? 'Asia/Kyoto';
    return new Date().toLocaleString('en-US', {
        timeZone: tz
    });
};

/**
 * Generate random string
 *
 * @param length number
 * @returns string
 */
export function genRandomStr(length: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
