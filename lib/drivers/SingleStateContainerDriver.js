'use strict';

const StateContainerDriver = require('./StateContainerDriver');

class SingleStateContainerDriver extends StateContainerDriver {
    constructor(name) {
        super(name);

        this.tokens = {};
    }

    _initContainer(deviceData) {
        const container = super._initContainer(deviceData);
        if (container instanceof Error) {
            return container;
        }

        const id = deviceData.id;
        this._registerToken(id, container);

        container.on('stateChanged', (oldState, newState) => {
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
