'use strict';

const SingleStateContainerDriver = require('../../lib/drivers/SingleStateContainerDriver');
const StateContainer = require('../../lib/containers/PriorityStackedStateContainer');

class StateContainerDriver extends SingleStateContainerDriver {
    constructor() {
        super('priority_stacked');

        Homey.manager('flow')
            .on('action.priority_stacked_deactivate_state.state.autocomplete', this._onFlowAutoCompleteState.bind(this))
            .on('condition.priority_stacked_before.state.autocomplete', this._onFlowAutoCompleteState.bind(this))
            .on('condition.priority_stacked_after.state.autocomplete', this._onFlowAutoCompleteState.bind(this))
            .on('action.priority_stacked_deactivate_state', this._onFlowActionDeactivateState.bind(this))
            .on('condition.priority_stacked_before', this._onFlowConditionBefore.bind(this))
            .on('condition.priority_stacked_after', this._onFlowConditionAfter.bind(this))
            .on('condition.priority_stacked_default', this._onFlowConditionDefault.bind(this))
        ;
    }

    _createContainer(settings) {
        return new StateContainer(settings);
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
