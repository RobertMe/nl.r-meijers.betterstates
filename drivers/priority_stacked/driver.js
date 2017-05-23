'use strict';

const SingleStateContainerDriver = require('../../lib/drivers/SingleStateContainerDriver');
const StateContainer = require('../../lib/containers/PriorityStackedStateContainer');

class StateContainerDriver extends SingleStateContainerDriver {
    constructor() {
        super('priority_stacked');

        Homey.manager('flow')
            .on('action.priority_stacked_deactivate_state.state.autocomplete', this._onFlowAutoCompleteState.bind(this))
            .on('action.priority_stacked_toggle_state.state.autocomplete', this._onFlowAutoCompleteState.bind(this))
            .on('condition.priority_stacked_before.state.autocomplete', this._onFlowAutoCompleteState.bind(this))
            .on('condition.priority_stacked_after.state.autocomplete', this._onFlowAutoCompleteState.bind(this))
            .on('condition.priority_stacked_enabled.state.autocomplete', this._onFlowAutoCompleteState.bind(this))
            .on('action.priority_stacked_deactivate_state', this._onFlowActionDeactivateState.bind(this))
            .on('action.priority_stacked_toggle_state', this._onFlowActionToggleState.bind(this))
            .on('condition.priority_stacked_before', this._onFlowConditionBefore.bind(this))
            .on('condition.priority_stacked_after', this._onFlowConditionAfter.bind(this))
            .on('condition.priority_stacked_default', this._onFlowConditionDefault.bind(this))
            .on('condition.priority_stacked_enabled', this._onFlowConditionEnabled.bind(this))
        ;
    }

    _createContainer(settings) {
        return new StateContainer(settings);
    }

    _triggerStateDeactivated(deviceData, triggerState) {
        super._triggerStateDeactivated(deviceData, triggerState);

        if (triggerState.oldState.id === triggerState.container.getDefaultState().id) {
            Homey.manager('flow').triggerDevice(`priority_stacked_default_deactivated`, {}, triggerState, deviceData, (err) => {
                if (err) {
                    Homey.app.error(`Error triggering priority stacked default deactivated`, err);
                }
            });
        }
    }

    _triggerStateActivated(deviceData, triggerState) {
        if (triggerState.newState.id === triggerState.container.getDefaultState().id) {
            Homey.manager('flow').triggerDevice(`priority_stacked_default_activated`, {}, triggerState, deviceData, (err) => {
                if (err) {
                    Homey.app.error(`Error triggering priority stacked default activated`, err);
                }
            });
        }

        super._triggerStateActivated(deviceData, triggerState);
    }

    _onFlowConditionBefore(callback, args) {
        const container = this.getContainer(args.device);
        if (container instanceof Error) {
            return callback(container);
        }

        let stateId = !this._isId(args.droptoken) ? container.getStateId(args.droptoken) : args.droptoken;
        if (stateId instanceof Error) {
            return callback(stateId);
        }

        const isBefore = container.isBefore(stateId, args.state);
        if (isBefore instanceof Error) {
            return callback(isBefore);
        }

        callback(null, isBefore);
    }

    _onFlowConditionAfter(callback, args) {
        const container = this.getContainer(args.device);
        if (container instanceof Error) {
            return callback(container);
        }

        let stateId = !this._isId(args.droptoken) ? container.getStateId(args.droptoken) : args.droptoken;
        if (stateId instanceof Error) {
            return callback(stateId);
        }

        const isAfter = container.isAfter(stateId, args.state);
        if (isAfter instanceof Error) {
            return callback(isAfter);
        }

        callback(null, isAfter);
    }

    _onFlowConditionDefault(callback, args) {
        const container = this.getContainer(args.device);
        if (container instanceof Error) {
            return callback(container);
        }

        callback(null,
            !this._isId(args.droptoken) ?
                args.droptoken === container.getDefaultState().name :
                args.droptoken === container.getDefaultState().id
        );
    }

    _onFlowConditionEnabled(callback, args) {
        const container = this.getContainer(args.device);
        if (container instanceof Error) {
            return callback(container);
        }

        const isEnabled = container.isEnabled(args.state);
        if (isEnabled instanceof Error) {
            return callback(isEnabled);
        }

        callback(null, isEnabled);
    }

    _onFlowActionDeactivateState(callback, args) {
        let container = this.getContainer(args.device);
        if (container instanceof Error) {
            return callback(container);
        }

        container.deactivate(args.state.id);

        callback(null, true);
    }

    _onFlowActionToggleState(callback, args) {
        const container = this.getContainer(args.device);
        if (container instanceof Error) {
            return callback(container);
        }

        container.toggle(args.state.id);

        callback(null, true);
    }
}

module.exports = new StateContainerDriver();
