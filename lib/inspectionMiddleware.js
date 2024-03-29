"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const botframework_connector_1 = require("botframework-connector");
const botbuilder_core_1 = require("./botbuilder-core");
const teamsActivityHelpers_1 = require("./teamsActivityHelpers");
/** @private */
class TraceActivity {
    static makeCommandActivity(command) {
        return {
            type: botbuilder_core_1.ActivityTypes.Trace,
            timestamp: new Date(),
            name: 'Command',
            label: 'Command',
            value: command,
            valueType: 'https://www.botframework.com/schemas/command'
        };
    }
    static fromActivity(activity, name, label) {
        return {
            type: botbuilder_core_1.ActivityTypes.Trace,
            timestamp: new Date(),
            name: name,
            label: label,
            value: activity,
            valueType: 'https://www.botframework.com/schemas/activity'
        };
    }
    static fromState(botState) {
        return {
            type: botbuilder_core_1.ActivityTypes.Trace,
            timestamp: new Date(),
            name: 'BotState',
            label: 'Bot State',
            value: botState,
            valueType: 'https://www.botframework.com/schemas/botState'
        };
    }
    static fromConversationReference(conversationReference) {
        return {
            type: botbuilder_core_1.ActivityTypes.Trace,
            timestamp: new Date(),
            name: 'Deleted Message',
            label: 'MessageDelete',
            value: conversationReference,
            valueType: 'https://www.botframework.com/schemas/conversationReference'
        };
    }
    static fromError(errorMessage) {
        return {
            type: botbuilder_core_1.ActivityTypes.Trace,
            timestamp: new Date(),
            name: 'Turn Error',
            label: 'TurnError',
            value: errorMessage,
            valueType: 'https://www.botframework.com/schemas/error'
        };
    }
}
/** @private */
class InterceptionMiddleware {
    /** Implement middleware signature
     * @param context {TurnContext} An incoming TurnContext object.
     * @param next {function} The next delegate function.
     */
    onTurn(turnContext, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var { shouldForwardToApplication, shouldIntercept } = yield this.invokeInbound(turnContext, TraceActivity.fromActivity(turnContext.activity, 'ReceivedActivity', 'Received Activity'));
            if (shouldIntercept) {
                turnContext.onSendActivities((ctx, activities, nextSend) => __awaiter(this, void 0, void 0, function* () {
                    var traceActivities = [];
                    activities.forEach(activity => {
                        traceActivities.push(TraceActivity.fromActivity(activity, 'SentActivity', 'Sent Activity'));
                    });
                    yield this.invokeOutbound(ctx, traceActivities);
                    return yield nextSend();
                }));
                turnContext.onUpdateActivity((ctx, activity, nextUpdate) => __awaiter(this, void 0, void 0, function* () {
                    var traceActivity = TraceActivity.fromActivity(activity, 'MessageUpdate', 'Updated Message');
                    yield this.invokeOutbound(ctx, [traceActivity]);
                    return yield nextUpdate();
                }));
                turnContext.onDeleteActivity((ctx, reference, nextDelete) => __awaiter(this, void 0, void 0, function* () {
                    var traceActivity = TraceActivity.fromConversationReference(reference);
                    yield this.invokeOutbound(ctx, [traceActivity]);
                    return yield nextDelete();
                }));
            }
            if (shouldForwardToApplication) {
                try {
                    yield next();
                }
                catch (err) {
                    var traceActivity = TraceActivity.fromError(err.toString());
                    yield this.invokeOutbound(turnContext, [traceActivity]);
                    throw err;
                }
            }
            if (shouldIntercept) {
                yield this.invokeTraceState(turnContext);
            }
        });
    }
    invokeInbound(turnContext, traceActivity) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.inbound(turnContext, traceActivity);
            }
            catch (err) {
                console.warn(`Exception in inbound interception ${err}`);
                return { shouldForwardToApplication: true, shouldIntercept: false };
            }
        });
    }
    invokeOutbound(turnContext, traceActivities) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.outbound(turnContext, traceActivities);
            }
            catch (err) {
                console.warn(`Exception in outbound interception ${err}`);
            }
        });
    }
    invokeTraceState(turnContext) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.traceState(turnContext);
            }
            catch (err) {
                console.warn(`Exception in state interception ${err}`);
            }
        });
    }
}
/**
 * InspectionMiddleware for emulator inspection of runtime Activities and BotState.
 *
 * @remarks
 * InspectionMiddleware for emulator inspection of runtime Activities and BotState.
 *
 */
class InspectionMiddleware extends InterceptionMiddleware {
    /**
     * Create the Inspection middleware for sending trace activities out to an emulator session
     */
    constructor(inspectionState, userState, conversationState, credentials) {
        super();
        this.inspectionState = inspectionState;
        this.inspectionStateAccessor = inspectionState.createProperty('InspectionSessionByStatus');
        this.userState = userState;
        this.conversationState = conversationState;
        credentials = Object.assign({ appId: '', appPassword: '' }, credentials);
        this.credentials = new botframework_connector_1.MicrosoftAppCredentials(credentials.appId, credentials.appPassword);
    }
    processCommand(turnContext) {
        return __awaiter(this, void 0, void 0, function* () {
            if (turnContext.activity.type == botbuilder_core_1.ActivityTypes.Message && turnContext.activity.text !== undefined) {
                var originalText = turnContext.activity.text;
                botbuilder_core_1.TurnContext.removeRecipientMention(turnContext.activity);
                var command = turnContext.activity.text.trim().split(' ');
                if (command.length > 1 && command[0] === InspectionMiddleware.command) {
                    if (command.length === 2 && command[1] === 'open') {
                        yield this.processOpenCommand(turnContext);
                        return true;
                    }
                    if (command.length === 3 && command[1] === 'attach') {
                        yield this.processAttachCommand(turnContext, command[2]);
                        return true;
                    }
                }
                turnContext.activity.text = originalText;
            }
            return false;
        });
    }
    inbound(turnContext, traceActivity) {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield this.processCommand(turnContext)) {
                return { shouldForwardToApplication: false, shouldIntercept: false };
            }
            var session = yield this.findSession(turnContext);
            if (session !== undefined) {
                if (yield this.invokeSend(turnContext, session, traceActivity)) {
                    return { shouldForwardToApplication: true, shouldIntercept: true };
                }
                else {
                    return { shouldForwardToApplication: true, shouldIntercept: false };
                }
            }
            else {
                return { shouldForwardToApplication: true, shouldIntercept: false };
            }
        });
    }
    outbound(turnContext, traceActivities) {
        return __awaiter(this, void 0, void 0, function* () {
            var session = yield this.findSession(turnContext);
            if (session !== undefined) {
                for (var i = 0; i < traceActivities.length; i++) {
                    var traceActivity = traceActivities[i];
                    if (!(yield this.invokeSend(turnContext, session, traceActivity))) {
                        break;
                    }
                }
            }
        });
    }
    traceState(turnContext) {
        return __awaiter(this, void 0, void 0, function* () {
            var session = yield this.findSession(turnContext);
            if (session !== undefined) {
                if (this.userState !== undefined) {
                    yield this.userState.load(turnContext, false);
                }
                if (this.conversationState != undefined) {
                    yield this.conversationState.load(turnContext, false);
                }
                var botState = {};
                if (this.userState !== undefined) {
                    botState.userState = this.userState.get(turnContext);
                }
                if (this.conversationState !== undefined) {
                    botState.conversationState = this.conversationState.get(turnContext);
                }
                yield this.invokeSend(turnContext, session, TraceActivity.fromState(botState));
            }
        });
    }
    processOpenCommand(turnContext) {
        return __awaiter(this, void 0, void 0, function* () {
            var sessions = yield this.inspectionStateAccessor.get(turnContext, InspectionSessionsByStatus.DefaultValue);
            var sessionId = this.openCommand(sessions, botbuilder_core_1.TurnContext.getConversationReference(turnContext.activity));
            yield turnContext.sendActivity(TraceActivity.makeCommandActivity(`${InspectionMiddleware.command} attach ${sessionId}`));
            yield this.inspectionState.saveChanges(turnContext, false);
        });
    }
    processAttachCommand(turnContext, sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            var sessions = yield this.inspectionStateAccessor.get(turnContext, InspectionSessionsByStatus.DefaultValue);
            if (this.attachCommand(this.getAttachId(turnContext.activity), sessions, sessionId)) {
                yield turnContext.sendActivity('Attached to session, all traffic is being replicated for inspection.');
            }
            else {
                yield turnContext.sendActivity(`Open session with id ${sessionId} does not exist.`);
            }
            yield this.inspectionState.saveChanges(turnContext, false);
        });
    }
    openCommand(sessions, conversationReference) {
        function generate_guid() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
        }
        var sessionId = generate_guid();
        sessions.openedSessions[sessionId] = conversationReference;
        return sessionId;
    }
    attachCommand(attachId, sessions, sessionId) {
        var inspectionSessionState = sessions.openedSessions[sessionId];
        if (inspectionSessionState !== undefined) {
            sessions.attachedSessions[attachId] = inspectionSessionState;
            delete sessions.openedSessions[sessionId];
            return true;
        }
        return false;
    }
    findSession(turnContext) {
        return __awaiter(this, void 0, void 0, function* () {
            var sessions = yield this.inspectionStateAccessor.get(turnContext, InspectionSessionsByStatus.DefaultValue);
            var conversationReference = sessions.attachedSessions[this.getAttachId(turnContext.activity)];
            if (conversationReference !== undefined) {
                return new InspectionSession(conversationReference, this.credentials);
            }
            return undefined;
        });
    }
    invokeSend(turnContext, session, activity) {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield session.send(activity)) {
                return true;
            }
            else {
                yield this.cleanUpSession(turnContext);
                return false;
            }
        });
    }
    cleanUpSession(turnContext) {
        return __awaiter(this, void 0, void 0, function* () {
            var sessions = yield this.inspectionStateAccessor.get(turnContext, InspectionSessionsByStatus.DefaultValue);
            delete sessions.attachedSessions[this.getAttachId(turnContext.activity)];
            yield this.inspectionState.saveChanges(turnContext, false);
        });
    }
    getAttachId(activity) {
        // If we are running in a Microsoft Teams Team the conversation Id will reflect a particular thread the bot is in.
        // So if we are in a Team then we will associate the "attach" with the Team Id rather than the more restrictive conversation Id.
        const teamId = teamsActivityHelpers_1.teamsGetTeamId(activity);
        return teamId ? teamId : activity.conversation.id;
    }
}
InspectionMiddleware.command = "/INSPECT";
exports.InspectionMiddleware = InspectionMiddleware;
/** @private */
class InspectionSession {
    constructor(conversationReference, credentials) {
        this.conversationReference = conversationReference;
        this.connectorClient = new botframework_connector_1.ConnectorClient(credentials, { baseUri: conversationReference.serviceUrl });
    }
    send(activity) {
        return __awaiter(this, void 0, void 0, function* () {
            botbuilder_core_1.TurnContext.applyConversationReference(activity, this.conversationReference);
            try {
                yield this.connectorClient.conversations.sendToConversation(activity.conversation.id, activity);
            }
            catch (err) {
                return false;
            }
            return true;
        });
    }
}
/** @private */
class InspectionSessionsByStatus {
    constructor() {
        this.openedSessions = {};
        this.attachedSessions = {};
    }
}
InspectionSessionsByStatus.DefaultValue = new InspectionSessionsByStatus();
/**
 * InspectionState for use by the InspectionMiddleware for emulator inspection of runtime Activities and BotState.
 *
 * @remarks
 * InspectionState for use by the InspectionMiddleware for emulator inspection of runtime Activities and BotState.
 *
 */
class InspectionState extends botbuilder_core_1.BotState {
    constructor(storage) {
        super(storage, (context) => {
            return Promise.resolve(this.getStorageKey(context));
        });
    }
    getStorageKey(turnContext) {
        return 'InspectionState';
    }
}
exports.InspectionState = InspectionState;
//# sourceMappingURL=inspectionMiddleware.js.map