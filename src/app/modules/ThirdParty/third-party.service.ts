import { Injectable } from '@nestjs/common';
import { IThirdPartyService } from './third-party.interface';
import Services from 'src/config/third-party-services.map';

@Injectable()
export class ThirdPartyService {
    private services: Map<string, IThirdPartyService>;

    constructor() {
        // load the avaliable services
        this.services = new Map([]);
        for (const service in Services) {
            this.services.set(service, new Services[service]());
        }
    }

    public serviceFactory(serviceName: string): IThirdPartyService {
        serviceName = serviceName.toLowerCase();
        return this.services.get(serviceName);
    }
}
