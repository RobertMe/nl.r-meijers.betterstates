'use strict';

const SingleStateContainerDriver = require('../../lib/drivers/SingleStateContainerDriver');
const StateContainer = require('../../lib/containers/CyclingStateContainer');

class StateContainerDriver extends SingleStateContainerDriver {
    constructor() {
        super('cycling');

        Homey.manager('flow')
            .on('action.cycling_forward', this._onFlowActionForward.bind(this))
            .on('action.cycling_backward', this._onFlowActionBackward.bind(this))
        ;
    }

    _createContainer(settings) {
        return new StateContainer(settings);
    }

    _onFlowActionForward(callback, args) {
        const container = this.getContainer(args.device);
        if (container instanceof Error) {
            return callback(container);
        }

        container.forward();

        callback(null, true);
    }

    _onFlowActionBackward(callback, args) {
        const container = this.getContainer(args.device);
        if (container instanceof Error) {
            return callback(container);
        }

        container.backward();

        callback(null, true);
    }
}

module.exports = new StateContainerDriver();
