import services from 'src/config/third-party-services.map';

type ExtractInstanceType<T> = T extends new () => infer R ? R : never;
export type ThirdPartyServiceKeys = keyof typeof services;
type serviceTypes = typeof services[ThirdPartyServiceKeys];

export class ThirdPartyFactory {
    static getService(
        serviceName: ThirdPartyServiceKeys
    ): ExtractInstanceType<serviceTypes> {
        return new services[serviceName]();
    }
}
