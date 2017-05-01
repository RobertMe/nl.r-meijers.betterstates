'use strict';

class StateContainerDriver {
    constructor(name) {
        this.name = name;
        this.devices = {};
        this.containers = {};

        this.init = this._onExportsInit.bind(this);
        this.added = this._onExportsAdded.bind(this);
        this.deleted = this._onExportsDeleted.bind(this);
        this.renamed = this._onExportsRenamed.bind(this);
        this.pair = this._onExportsPair.bind(this);

        Homey.manager('flow')
            .on(`action.${name}_activate_state.state.autocomplete`, this._onFlowAutoCompleteState.bind(this))
            .on(`trigger.${name}_state_activated.state.autocomplete`, this._onFlowAutoCompleteState.bind(this))
            .on(`trigger.${name}_state_deactivated.state.autocomplete`, this._onFlowAutoCompleteState.bind(this))
            .on(`condition.${name}_equals.state.autocomplete`, this._onFlowAutoCompleteState.bind(this))
            .on(`action.${name}_activate_state`, this._onFlowActionActivateState.bind(this))
            .on(`trigger.${name}_state_activated`, this._onFlowTriggerStateActivated.bind(this))
            .on(`trigger.${name}_state_deactivated`, this._onFlowTriggerStateDeactivated.bind(this))
            .on(`condition.${name}_equals`, this._onFlowConditionEquals.bind(this))
        ;
    }

    getContainer(deviceData) {
        return this.containers[deviceData.id] || new Error('invalid_device');
    }

    _initContainer(deviceData) {
        const id = deviceData.id;
        const settings = Homey.manager('settings').get(`deviceSettings_${id}`);

        if (!settings) {
            Homey.app.error('Trying to initialize container', id, 'but no settings exist.');
            return new Error('invalid_device');
        }

        const container = this._createContainer(settings);

        container.on('stateChanged', (oldState, newState) => {
            const triggerState = {
                container: container,
                oldState: oldState,
                newState: newState
            };

            Homey.manager('flow').triggerDevice(`${this.name}_state_deactivated`, {}, triggerState, deviceData, (err) => {
                if (err) {
                    Homey.app.error(`Error triggering ${this.name} deactivated`, err);
                }
            });

            Homey.manager('flow').triggerDevice(`${this.name}_state_activated`, {}, triggerState, deviceData, (err) => {
                if (err) {
                    Homey.app.error(`Error triggering ${this.name} activated:`, err);
                }
            });

            const changedTokens = {
                old_state: oldState.name,
                new_state: newState.name,
            };
            Homey.manager('flow').triggerDevice(`${this.name}_state_changed`, changedTokens, triggerState, deviceData, (err) => {
                if (err) {
                    Homey.app.error(`Error triggering ${this.name} state changed`, err);
                }
            });
        });

        this.devices[id] = deviceData;
        this.containers[id] = container;

        return container;
    }

    _isId(identifier) {
        return /[0-9]+_[0-9]+/.test(identifier);
    }

    _onFlowAutoCompleteState(callback, args) {
        const container = this.getContainer(args.args.device);
        if (container instanceof Error) {
            return callback(container);
        }

        let states = container.getStates();
        if (args.query.length > 0) {
            const query = args.query.toLowerCase();
            states = states.filter(s => s.name.toLowerCase().indexOf(query) > -1);
        }

        const items = states.map(s => ({id: s.id, name: s.name}));
        callback(null, items);
    }

    _onFlowTriggerStateActivated(callback, args, state) {
        if (args.state && args.state.id === state.newState.id) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    }

    _onFlowTriggerStateDeactivated(callback, args, state) {
        if (args.state && args.state.id === state.oldState.id) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    }

    _onFlowConditionEquals(callback, args) {
        const container = this.getContainer(args.device);
        if (container instanceof Error) {
            return callback(container);
        }

        let stateId = !this._isId(args.droptoken) ? container.getStateId(args.droptoken) : args.droptoken;
        if (stateId instanceof Error) {
            return callback(stateId);
        }
        callback(null, stateId === args.state.id);
    }

    _onFlowActionActivateState(callback, args) {
        const container = this.getContainer(args.device);
        if (container instanceof Error) {
            return callback(container);
        }

        container.activate(args.state.id);
        callback(null, true);
    }

    _onExportsInit(deviceData, callback) {
        deviceData.forEach(d => this._initContainer(d));
        callback();
    }

    _onExportsAdded(deviceData, callback) {
        const container = this._initContainer(deviceData);
        if (container instanceof Error) {
            return callback(container);
        }

        callback(null, true);
    }

    _onExportsDeleted(deviceData, callback) {
        const id = deviceData.id;

        delete this.containers[id];
        delete this.devices[id];

        Homey.manager('settings').unset(`deviceSettings_${id}`);

        callback(null, true);
    }

    _onExportsRenamed(deviceData, newName) {
        const container = this.getContainer(deviceData);
        if (container instanceof Error) {
            return;
        }

        const settings = container.getSettings();
        settings.name = newName;
        Homey.manager('settings').set(`deviceSettings_${deviceData.id}`, settings);
    }

    _onExportsPair(socket) {
        socket.on('save_settings', (data, callback) => {
            const deviceId = Homey.app.generateDeviceId();

            let stateId = 1;
            data.states.forEach(s => {s.id = `${deviceId}_${stateId++}`});
            data.nextStateId = stateId;

            Homey.manager('settings').set(`deviceSettings_${deviceId}`, data);

            callback(null, deviceId);
        });
    }
}

module.exports = StateContainerDriver;
