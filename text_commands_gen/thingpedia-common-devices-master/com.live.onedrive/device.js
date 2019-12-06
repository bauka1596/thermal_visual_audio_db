// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// Copyright 2016 {jasonf2, kkiningh}@stanford.edu
//
// See LICENSE for details
"use strict";

var Tp = require('thingpedia');

module.exports = new Tp.DeviceClass({
    Name: 'OneDriveDevice',
    UseOAuth2: Tp.Helpers.OAuth2({
        kind: 'com.live.onedrive',
        authorize: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        scope: ['offline_access', 'files.readwrite.all', 'files.read.all'],
        get_access_token: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        redirect_uri: 'https://thingengine.stanford.edu/devices/oauth2/callback/com.live.onedrive',
        callback: function(engine, accessToken, refreshToken) {
            var auth = 'Bearer ' + accessToken;
            return Tp.Helpers.Http.get('https://graph.microsoft.com/v1.0/drive',
                                       { auth: auth,
                                         accept: 'application/json' })
            .then((response) => {
                var parsed = JSON.parse(response);
                return engine.devices.loadOneDevice({ kind: 'com.live.onedrive',
                                                      accessToken: accessToken,
                                                      refreshToken: refreshToken,
                                                      driveId: parsed.id,
                                                      userId: parsed.owner.user.id,
                                                      userName: parsed.owner.user.displayName }, true);
            });
        }
    }),

    _init: function(engine, state) {
        this.parent(engine, state);

        this.uniqueId = 'com.live.onedrive-' + this.driveId;
        this.name = "OneDrive Account " + this.userName;
        this.description = "This is your OneDrive Account.";
    },

    get driveId() {
        return this.state.driveId;
    },

    get userId() {
        return this.state.userId;
    },

    get userName() {
        return this.state.userName;
    },

    // it's cloud backed so always available
    checkAvailable: function() {
        return Tp.Availability.AVAILABLE;
    }
});
