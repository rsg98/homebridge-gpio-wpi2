class GPIOAccessory {
    constructor(log, accessory, pin, pinConfig) {
        this.accessory = accessory;
        this.inverted = pinConfig.inverted || false;
        this.duration = pinConfig.duration || 0;

        this.log = log;

        if(!this.accessory instanceof PlatformAccessory) {
            this.log("ERROR \n", this);
            return;
        }

        if (this.accessory.context.name === undefined) {
            this.accessory.context.name = this.accessory.displayName;
        }

        let service = this.accessory.getService(Service.Switch);

        if (service.testCharacteristic(Characteristic.Name) === false) {
            service.addCharacteristic(Characteristic.Name);
        }

        if (service.getCharacteristic(Characteristic.Name).value === undefined) {
            service.getCharacteristic(Characteristic.Name).setValue(this.accessory.context.name);
        }
    }
}