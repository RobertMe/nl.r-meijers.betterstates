'use strict';

const BaseDriver = require('../../lib/drivers/StateContainerDriver');
const StateContainer = require('../../lib/containers/SetStateContainer');

class StateContainerDriver extends BaseDriver {
    constructor() {
        super('set');

        Homey.manager('flow')
            .on('action.set_deactivate_state.state.autocomplete', this._onFlowAutoCompleteState.bind(this))
            .on('condition.set_is_active.state.autocomplete', this._onFlowAutoCompleteState.bind(this))
            .on('action.set_deactivate_state', this._onFlowActionDeactivateState.bind(this))
            .on('condition.set_is_active', this._onFlowConditionActive.bind(this))
            .on('condition.set_none_active', this._onFlowConditionNoneActive.bind(this))
        ;
    }

    _createContainer(settings) {
        return new StateContainer(settings);
    }

    _initContainer(deviceData) {
        const container = super._initContainer(deviceData);
        if (container instanceof Error) {
            return container;
        }

        container.on('stateActivated', (state) => {
            const triggerState = {
                container: container,
                state: state
            };

            this._triggerStateActivated(deviceData, triggerState);
        });
        container.on('stateDeactivated', (state) => {
            const triggerState = {
                container: container,
                state: state
            };

            this._triggerStateDeactivated(deviceData, triggerState);
        });

        return container;
    }

    _triggerStateDeactivated(deviceData, triggerState) {
        super._triggerStateDeactivated(deviceData, triggerState);

        if (triggerState.container.getActiveStates().length === 0) {
            Homey.manager('flow').triggerDevice(`set_none_activated`, {}, triggerState, deviceData, (err) => {
                if (err) {
                    Homey.app.error(`Error triggering set none activated`, err);
                }
            });
        }
    }

    _triggerStateActivated(deviceData, triggerState) {
        if (triggerState.container.getActiveStates().length === 1) {
            Homey.manager('flow').triggerDevice(`set_some_activated`, {}, triggerState, deviceData, (err) => {
                if (err) {
                    Homey.app.error(`Error triggering set some activated`, err);
                }
            });
        }

        super._triggerStateActivated(deviceData, triggerState);
    }

    _onFlowTriggerStateActivated(callback, args, state) {
        if (args.state && args.state.id === state.state.id) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    }

    _onFlowTriggerStateDeactivated(callback, args, state) {
        if (args.state && args.state.id === state.state.id) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    }

    _onFlowConditionActive(callback, args) {
        const container = this.getContainer(args.device);
        if (container instanceof Error) {
            return callback(container);
        }

        const isActive = container.isActive(args.state);
        if (isActive instanceof Error) {
            return callback(isActive);
        }

        callback(null, isActive);
    }

    _onFlowConditionNoneActive(callback, args) {
        const container = this.getContainer(args.device);
        if (container instanceof Error) {
            return callback(container);
        }

        callback(null, container.getActiveStates().length === 0);
    }

    _onFlowActionDeactivateState(callback, args) {
        let container = this.getContainer(args.device);
        if (container instanceof Error) {
            return callback(container);
        }

        container.deactivate(args.state.id);

        callback(null, true);
    }
}

module.exports = new StateContainerDriver();
