'use strict';

const StateContainerDriver = require('./StateContainerDriver');

class SingleStateContainerDriver extends StateContainerDriver {
    constructor(name) {
        super(name);

        this.tokens = {};

        Homey.manager('flow')
            .on(`condition.${name}_equals.state.autocomplete`, this._onFlowAutoCompleteState.bind(this))
            .on(`condition.${name}_active_equals.state.autocomplete`, this._onFlowAutoCompleteState.bind(this))
            .on(`condition.${name}_equals`, this._onFlowConditionEquals.bind(this))
            .on(`condition.${name}_active_equals`, this._onFlowConditionActiveEquals.bind(this))
    }

    _initContainer(deviceData) {
        const container = super._initContainer(deviceData);
        if (container instanceof Error) {
            return container;
        }

        const id = deviceData.id;
        this._registerToken(id, container);

        container.on('stateChanged', (oldState, newState) => {
            const triggerState = {
                container: container,
                oldState: oldState,
                newState: newState
            };

            this._triggerStateDeactivated(deviceData, triggerState);
            this._triggerStateActivated(deviceData, triggerState);

            const changedTokens = {
                old_state: oldState.name,
                new_state: newState.name,
            };
            Homey.manager('flow').triggerDevice(`${this.name}_state_changed`, changedTokens, triggerState, deviceData, (err) => {
                if (err) {
                    Homey.app.error(`Error triggering ${this.name} state changed`, err);
                }
            });

            this._updateToken(id, container);
        });

        return container;
    }

    _registerToken(deviceId, container) {
        const tokenId = container.getName();
        Homey.manager('flow').registerToken(tokenId, {
            type: 'string',
            title: container.getName()
        }, (err, token) => {
            if (err) {
                return Homey.app.error('Error registering token for container:', container.getName(), err);
            }

            token.unregister = function(callback) {
                Homey.manager('flow').unregisterToken(tokenId, callback);
            };

            this.tokens[deviceId] = token;
            this._updateToken(deviceId, container);
        });
    }

    _updateToken(deviceId, container) {
        if (deviceId in this.tokens) {
            this.tokens[deviceId].setValue(container.getActiveState().name, function(err) {
                if (err) {
                    Homey.app.error('Error setting token value for container:', container.getName());
                }
            });
        }
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

    _onFlowConditionActiveEquals(callback, args) {
        const container = this.getContainer(args.device);
        if (container instanceof Error) {
            return callback(container);
        }

        callback(null, container.getActiveState().id === args.state.id);
    }

    _onExportsDeleted(deviceData, callback) {
        const id = deviceData.id;
        const container = this.getContainer(deviceData);
        const token = this.tokens[id];

        token.unregister((err) => {
            if (err) {
                Homey.app.error('Unable to unregister token for:', container.getSettings().name, err);
            }
        });

        delete this.tokens[id];

        super._onExportsDeleted(deviceData, callback);
    }

    _onExportsRenamed(deviceData, newName) {
        const container = this.getContainer(deviceData);
        if (container instanceof Error) {
            return;
        }

        super._onExportsRenamed(deviceData, newName);

        this.tokens[deviceData.id].unregister((err) => {
            this._registerToken(deviceData.id, container);
        });
    }
}

module.exports = SingleStateContainerDriver;
