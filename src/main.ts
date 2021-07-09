/*
 * Created with @iobroker/create-adapter v1.34.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from "@iobroker/adapter-core";
// import "iobroker";

// Load your modules here, e.g.:
// import * as fs from "fs";

class Pumpcontrol2 extends utils.Adapter {

    public constructor(options: Partial<utils.AdapterOptions> = {}) {
        super({
            ...options,
            name: "pumpcontrol2",
        });
        this.on("ready", this.onReady.bind(this));
        this.on("stateChange", this.onStateChange.bind(this));
        // this.on("objectChange", this.onObjectChange.bind(this));
        // this.on("message", this.onMessage.bind(this));
        this.on("unload", this.onUnload.bind(this));
    }

    private async controlPump() : Promise<void>
    {
        this.log.info("Let's control the pump");

        const pressurePromise = await this.getForeignStatesAsync(this.config.pressureObject);
        const pumpOnPromise = await this.getForeignStatesAsync(this.config.inGpioPumpOnObject);
        const pumpAutoPromise = await this.getForeignStatesAsync(this.config.inGpioPumpAutoObject);

        if(pressurePromise && pumpOnPromise && pumpAutoPromise)
        {
            const pressure = pressurePromise[this.config.pressureObject].val as number;
            const pumpOn   = pumpOnPromise[this.config.inGpioPumpOnObject].val as boolean;
            const pumpAuto = pumpAutoPromise[this.config.inGpioPumpAutoObject].val as boolean;

            this.log.info("pressure = "+pressure);
            this.log.info("pumpOn   = "+pumpOn);
            this.log.info("pumpAuto = "+pumpAuto);

            if(pumpOn)
            {
                this.log.info("Switch Pump ON");
                this.setForeignStateAsync(this.config.outGpioPumpOnObject, true);
            }
            else
            {
                this.log.info("Switch Pump OFF");
                this.setForeignStateAsync(this.config.outGpioPumpOnObject, false);
            }
        }
        else
        {
            this.log.info("somethins is wrong - Undefined???");
        }

        // this.log.info("pressure = "+pressure);
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    private async onReady(): Promise<void> {
        // Initialize your adapter here

        // The adapters config (in the instance object everything under the attribute "native") is accessible via
        // this.config:

        this.log.info("Hello Pump Controller 6");
        this.log.info("pressure: " + this.config.pressureObject);
        this.log.info("IN GPIO ON: " + this.config.inGpioPumpOnObject);
        this.log.info("IN GPIO AUTO: " + this.config.inGpioPumpAutoObject);
        this.log.info("OUT GPIO : " + this.config.outGpioPumpOnObject);

        // modbus.0.holdingRegisters.17666_p1
        this.subscribeForeignStates(this.config.pressureObject);

        // rpi2.0.gpio.4.state
        this.subscribeForeignStates(this.config.inGpioPumpOnObject);

        // GPIO OUT rpi2.0.gpio.17.state

    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     */
    private onUnload(callback: () => void): void {
        try {
            // Here you must clear all timeouts or intervals that may still be active
            // clearTimeout(timeout1);
            // clearTimeout(timeout2);
            // ...
            // clearInterval(interval1);

            callback();
        } catch (e) {
            callback();
        }
    }

    // If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
    // You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
    // /**
    //  * Is called if a subscribed object changes
    //  */
    // private onObjectChange(id: string, obj: ioBroker.Object | null | undefined): void {
    //     if (obj) {
    //         // The object was changed
    //         this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
    //     } else {
    //         // The object was deleted
    //         this.log.info(`object ${id} deleted`);
    //     }
    // }

    /**
     * Is called if a subscribed state changes
     */
    private onStateChange(id: string, state: ioBroker.State | null | undefined): void {
        if (state) {
            // The state was changed
            this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
            // this.controlPump(state.val);
            this.controlPump();
        } else {
            // The state was deleted
            this.log.info(`state ${id} deleted`);
        }
    }

    private async Beispiel()
    {
        this.log.info("Let's control the pump");

        const xxx = await this.getForeignStatesAsync(this.config.pressureObject);
         if(xxx)
         {
            const p2 = xxx[this.config.pressureObject].val as number;
            this.log.info("Direkt Wert 2"+p2);

             for(const [key,value] of (Object.entries(xxx)))
             {
                this.log.info(key);
                this.log.info(JSON.stringify(value));
                
                this.log.info("Wert"+value.val);

                if(value.val)
                {
                    const pressure : number = value.val as number;
                    this.log.info("Wert 2"+pressure);
                }
             }
             
         }

        // this.log.info("pressure = "+pressure);
    }
    // If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
    // /**
    //  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
    //  * Using this method requires "common.messagebox" property to be set to true in io-package.json
    //  */
    // private onMessage(obj: ioBroker.Message): void {
    //     if (typeof obj === "object" && obj.message) {
    //         if (obj.command === "send") {
    //             // e.g. send email or pushover or whatever
    //             this.log.info("send command");

    //             // Send response in callback if required
    //             if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
    //         }
    //     }
    // }

}

if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Pumpcontrol2(options);
} else {
    // otherwise start the instance directly
    (() => new Pumpcontrol2())();
}