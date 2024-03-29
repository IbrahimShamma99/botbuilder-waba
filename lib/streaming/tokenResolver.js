"use strict";
/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const botbuilder_core_1 = require("../botbuilder-core");
/**
 * Looks for OAuthCards in Activity attachments and takes action on them
 */
class TokenResolver {
    static checkForOAuthCards(adapter, context, activity, log) {
        if (!activity || !activity.attachments) {
            return;
        }
        for (const attachment of activity.attachments) {
            if (attachment.contentType == botbuilder_core_1.CardFactory.contentTypes.oauthCard) {
                const oauthCard = attachment.content;
                if (!oauthCard.connectionName) {
                    throw new Error(`The OAuthPrompt's ConnectionName property is missing a value.`);
                }
                let pollingTimeoutMs = context.turnState.get(botbuilder_core_1.TokenPollingSettingsKey);
                if (!pollingTimeoutMs) {
                    pollingTimeoutMs = botbuilder_core_1.OAuthLoginTimeoutMsValue;
                }
                let pollingTimeout = new Date();
                pollingTimeout.setMilliseconds(pollingTimeout.getMilliseconds() + pollingTimeoutMs);
                setTimeout(() => this.pollForToken(adapter, context, activity, oauthCard.connectionName, pollingTimeout, log), TokenResolver.PollingIntervalMs);
            }
        }
    }
    static pollForToken(adapter, context, activity, connectionName, pollingTimeout, log) {
        if (pollingTimeout > new Date()) {
            adapter.getUserToken(context, connectionName).then((tokenResponse) => {
                let pollingIntervalMs = TokenResolver.PollingIntervalMs;
                if (tokenResponse) {
                    if (tokenResponse.token) {
                        const logic = context.turnState.get(botbuilder_core_1.BotCallbackHandlerKey);
                        const eventActivity = TokenResolver.createTokenResponseActivity(botbuilder_core_1.TurnContext.getConversationReference(activity), tokenResponse.token, connectionName);
                        // received a token, send it to the bot and end polling
                        adapter.processActivityDirect(eventActivity, logic).then(() => {
                        }).catch(reason => {
                            adapter.onTurnError(context, new Error(reason)).then(() => { });
                        });
                        if (log)
                            log.push('Returned token');
                        return;
                    }
                    else if (tokenResponse.properties && tokenResponse.properties[botbuilder_core_1.TokenPollingSettingsKey]) {
                        const pollingSettings = tokenResponse.properties[botbuilder_core_1.TokenPollingSettingsKey];
                        if (pollingSettings.timeout <= 0) {
                            // end polling
                            if (log)
                                log.push('End polling');
                            return;
                        }
                        if (pollingSettings.interval > 0) {
                            // reset the polling interval
                            if (log)
                                log.push(`Changing polling interval to ${pollingSettings.interval}`);
                            pollingIntervalMs = pollingSettings.interval;
                        }
                    }
                }
                if (log)
                    log.push('Polling again');
                setTimeout(() => this.pollForToken(adapter, context, activity, connectionName, pollingTimeout), pollingIntervalMs);
            });
        }
    }
    static createTokenResponseActivity(relatesTo, token, connectionName) {
        let tokenResponse = {
            id: this.generate_guid(),
            timestamp: new Date(),
            type: botbuilder_core_1.ActivityTypes.Event,
            serviceUrl: relatesTo.serviceUrl,
            from: relatesTo.user,
            recipient: relatesTo.bot,
            replyToId: relatesTo.activityId,
            channelId: relatesTo.channelId,
            conversation: relatesTo.conversation,
            name: 'tokens/response',
            relatesTo: relatesTo,
            value: {
                token: token,
                connectionName: connectionName
            }
        };
        return tokenResponse;
    }
    static generate_guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }
}
TokenResolver.PollingIntervalMs = 1000;
exports.TokenResolver = TokenResolver;
//# sourceMappingURL=tokenResolver.js.map