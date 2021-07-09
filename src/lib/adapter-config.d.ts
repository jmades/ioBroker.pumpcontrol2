// This file extends the AdapterConfig type from "@types/iobroker"

// Augment the globally declared type ioBroker.AdapterConfig
declare global {
    namespace ioBroker {
        interface AdapterConfig {
            pressureObject: string;
            inGpioPumpOnObject: string;
            inGpioPumpAutoObject: string;
            outGpioPumpOnObject: string;
            pressureThreshold: number;
        }
    }
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export {};