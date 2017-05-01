'use strict';

const events = require('events');

class App extends events.EventEmitter {
    constructor() {
        super();

        this.init = this._onExportsInit.bind(this);
    }

    log() {
        console.log.bind(this, '[log]').apply(this, arguments);
    }

    error() {
        console.error.bind(this, '[error]').apply(this, arguments);
    }

    generateDeviceId() {
        ++this.deviceId;

        Homey.manager('settings').set('maxDeviceId', this.deviceId);
        return this.deviceId;
    }

    _onExportsInit() {
        console.log('Started');

        this.deviceId = Homey.manager('settings').get('maxDeviceId') || 0;
    }
}

module.exports = new App();
