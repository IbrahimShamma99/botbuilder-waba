"use strict";
/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const botFrameworkAdapter_1 = require("./botFrameworkAdapter");
const botbuilder_core_1 = require("./botbuilder-core");
const teamsInfo_1 = require("./teamsInfo");
class TeamsActivityHandler extends botbuilder_core_1.ActivityHandler {
    /**
     *
     * @param context
     */
    onTurnActivity(context) {
        const _super = Object.create(null, {
            onTurnActivity: { get: () => super.onTurnActivity }
        });
        return __awaiter(this, void 0, void 0, function* () {
            switch (context.activity.type) {
                case botbuilder_core_1.ActivityTypes.Invoke:
                    const invokeResponse = yield this.onInvokeActivity(context);
                    // If onInvokeActivity has already sent an InvokeResponse, do not send another one.
                    if (invokeResponse && !context.turnState.get(botFrameworkAdapter_1.INVOKE_RESPONSE_KEY)) {
                        yield context.sendActivity({ value: invokeResponse, type: 'invokeResponse' });
                    }
                    yield this.defaultNextEvent(context)();
                    break;
                default:
                    yield _super.onTurnActivity.call(this, context);
                    break;
            }
        });
    }
    /**
     *
     * @param context
     */
    onInvokeActivity(context) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!context.activity.name && context.activity.channelId === 'msteams') {
                    return yield this.handleTeamsCardActionInvoke(context);
                }
                else {
                    switch (context.activity.name) {
                        case 'signin/verifyState':
                            yield this.handleTeamsSigninVerifyState(context, context.activity.value);
                            return TeamsActivityHandler.createInvokeResponse();
                        case 'fileConsent/invoke':
                            return TeamsActivityHandler.createInvokeResponse(yield this.handleTeamsFileConsent(context, context.activity.value));
                        case 'actionableMessage/executeAction':
                            yield this.handleTeamsO365ConnectorCardAction(context, context.activity.value);
                            return TeamsActivityHandler.createInvokeResponse();
                        case 'composeExtension/queryLink':
                            return TeamsActivityHandler.createInvokeResponse(yield this.handleTeamsAppBasedLinkQuery(context, context.activity.value));
                        case 'composeExtension/query':
                            return TeamsActivityHandler.createInvokeResponse(yield this.handleTeamsMessagingExtensionQuery(context, context.activity.value));
                        case 'composeExtension/selectItem':
                            return TeamsActivityHandler.createInvokeResponse(yield this.handleTeamsMessagingExtensionSelectItem(context, context.activity.value));
                        case 'composeExtension/submitAction':
                            return TeamsActivityHandler.createInvokeResponse(yield this.handleTeamsMessagingExtensionSubmitActionDispatch(context, context.activity.value));
                        case 'composeExtension/fetchTask':
                            return TeamsActivityHandler.createInvokeResponse(yield this.handleTeamsMessagingExtensionFetchTask(context, context.activity.value));
                        case 'composeExtension/querySettingUrl':
                            return TeamsActivityHandler.createInvokeResponse(yield this.handleTeamsMessagingExtensionConfigurationQuerySettingUrl(context, context.activity.value));
                        case 'composeExtension/setting':
                            yield this.handleTeamsMessagingExtensionConfigurationSetting(context, context.activity.value);
                            return TeamsActivityHandler.createInvokeResponse();
                        case 'composeExtension/onCardButtonClicked':
                            yield this.handleTeamsMessagingExtensionCardButtonClicked(context, context.activity.value);
                            return TeamsActivityHandler.createInvokeResponse();
                        case 'task/fetch':
                            return TeamsActivityHandler.createInvokeResponse(yield this.handleTeamsTaskModuleFetch(context, context.activity.value));
                        case 'task/submit':
                            return TeamsActivityHandler.createInvokeResponse(yield this.handleTeamsTaskModuleSubmit(context, context.activity.value));
                        default:
                            throw new Error('NotImplemented');
                    }
                }
            }
            catch (err) {
                if (err.message === 'NotImplemented') {
                    return { status: 501 };
                }
                else if (err.message === 'BadRequest') {
                    return { status: 400 };
                }
                throw err;
            }
        });
    }
    /**
     *
     * @param context
     */
    handleTeamsCardActionInvoke(context) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('NotImplemented');
        });
    }
    /**
     * Receives invoke activities with Activity name of 'fileConsent/invoke'. Handlers registered here run before
     * `handleTeamsFileConsentAccept` and `handleTeamsFileConsentDecline`.
     * Developers are not passed a pointer to the next `handleTeamsFileConsent` handler because the _wrapper_ around
     * the handler will call `onDialogs` handlers after delegating to `handleTeamsFileConsentAccept` or `handleTeamsFileConsentDecline`.
     * @param context
     * @param fileConsentCardResponse
     */
    handleTeamsFileConsent(context, fileConsentCardResponse) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (fileConsentCardResponse.action) {
                case 'accept':
                    return yield this.handleTeamsFileConsentAccept(context, fileConsentCardResponse);
                case 'decline':
                    return yield this.handleTeamsFileConsentDecline(context, fileConsentCardResponse);
                default:
                    throw new Error('BadRequest');
            }
        });
    }
    /**
     * Receives invoke activities with Activity name of 'fileConsent/invoke' with confirmation from user
     * @remarks
     * This type of invoke activity occur during the File Consent flow.
     * @param context
     * @param fileConsentCardResponse
     */
    handleTeamsFileConsentAccept(context, fileConsentCardResponse) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('NotImplemented');
        });
    }
    /**
     * Receives invoke activities with Activity name of 'fileConsent/invoke' with decline from user
     * @remarks
     * This type of invoke activity occur during the File Consent flow.
     * @param context
     * @param fileConsentCardResponse
     */
    handleTeamsFileConsentDecline(context, fileConsentCardResponse) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('NotImplemented');
        });
    }
    /**
     * Receives invoke activities with Activity name of 'actionableMessage/executeAction'
     */
    handleTeamsO365ConnectorCardAction(context, query) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('NotImplemented');
        });
    }
    /**
     * Receives invoke activities with Activity name of 'signin/verifyState'
     * @param context
     * @param action
     */
    handleTeamsSigninVerifyState(context, query) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('NotImplemented');
        });
    }
    /**
     * Receives invoke activities with Activity name of 'composeExtension/onCardButtonClicked'
     * @param context
     * @param cardData
     */
    handleTeamsMessagingExtensionCardButtonClicked(context, cardData) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('NotImplemented');
        });
    }
    /**
     * Receives invoke activities with Activity name of 'task/fetch'
     * @param context
     * @param taskModuleRequest
     */
    handleTeamsTaskModuleFetch(context, taskModuleRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('NotImplemented');
        });
    }
    /**
     * Receives invoke activities with Activity name of 'task/submit'
     * @param context
     * @param taskModuleRequest
     */
    handleTeamsTaskModuleSubmit(context, taskModuleRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('NotImplemented');
        });
    }
    /**
     * Receives invoke activities with Activity name of 'composeExtension/queryLink'
     * @remarks
     * Used in creating a Search-based Message Extension.
     * @param context
     * @param query
     */
    handleTeamsAppBasedLinkQuery(context, query) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('NotImplemented');
        });
    }
    /**
     * Receives invoke activities with the name 'composeExtension/query'.
     * @remarks
     * Used in creating a Search-based Message Extension.
     * @param context
     * @param action
     */
    handleTeamsMessagingExtensionQuery(context, query) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('NotImplemented');
        });
    }
    /**
     * Receives invoke activities with the name 'composeExtension/selectItem'.
     * @remarks
     * Used in creating a Search-based Message Extension.
     * @param context
     * @param action
     */
    handleTeamsMessagingExtensionSelectItem(context, query) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('NotImplemented');
        });
    }
    /**
     * Receives invoke activities with the name 'composeExtension/submitAction' and dispatches to botMessagePreview-flows as applicable.
     * @remarks
     * A handler registered through this method does not dispatch to the next handler (either `handleTeamsMessagingExtensionSubmitAction`, `handleTeamsMessagingExtensionBotMessagePreviewEdit`, or `handleTeamsMessagingExtensionBotMessagePreviewSend`).
     * This method exists for developers to optionally add more logic before the TeamsActivityHandler routes the activity to one of the
     * previously mentioned handlers.
     * @param context
     * @param action
     */
    handleTeamsMessagingExtensionSubmitActionDispatch(context, action) {
        return __awaiter(this, void 0, void 0, function* () {
            if (action.botMessagePreviewAction) {
                switch (action.botMessagePreviewAction) {
                    case 'edit':
                        return yield this.handleTeamsMessagingExtensionBotMessagePreviewEdit(context, action);
                    case 'send':
                        return yield this.handleTeamsMessagingExtensionBotMessagePreviewSend(context, action);
                    default:
                        throw new Error('BadRequest');
                }
            }
            else {
                return yield this.handleTeamsMessagingExtensionSubmitAction(context, action);
            }
        });
    }
    /**
     * Receives invoke activities with the name 'composeExtension/submitAction'.
     * @remarks
     * This invoke activity is received when a user
     * @param context
     * @param action
     */
    handleTeamsMessagingExtensionSubmitAction(context, action) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('NotImplemented');
        });
    }
    /**
     * Receives invoke activities with the name 'composeExtension/submitAction' with the 'botMessagePreview' property present on activity.value.
     * The value for 'botMessagePreview' is 'edit'.
     * @remarks
     * This invoke activity is received when a user
     * @param context
     * @param action
     */
    handleTeamsMessagingExtensionBotMessagePreviewEdit(context, action) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('NotImplemented');
        });
    }
    /**
     * Receives invoke activities with the name 'composeExtension/submitAction' with the 'botMessagePreview' property present on activity.value.
     * The value for 'botMessagePreview' is 'send'.
     * @remarks
     * This invoke activity is received when a user
     * @param context
     * @param action
     */
    handleTeamsMessagingExtensionBotMessagePreviewSend(context, action) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('NotImplemented');
        });
    }
    /**
     * Receives invoke activities with the name 'composeExtension/fetchTask'
     * @param context
     * @param action
     */
    handleTeamsMessagingExtensionFetchTask(context, action) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('NotImplemented');
        });
    }
    /**
     * Receives invoke activities with the name 'composeExtension/querySettingUrl'
     * @param context
     * @param query
     */
    handleTeamsMessagingExtensionConfigurationQuerySettingUrl(context, query) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('NotImplemented');
        });
    }
    /**
     * Receives invoke activities with the name 'composeExtension/setting'
     * @param context
     * @param query
     */
    handleTeamsMessagingExtensionConfigurationSetting(context, settings) {
        throw new Error('NotImplemented');
    }
    /**
     * Override this method to change the dispatching of ConversationUpdate activities.
     * @remarks
     *
     * @param context
     */
    dispatchConversationUpdateActivity(context) {
        const _super = Object.create(null, {
            dispatchConversationUpdateActivity: { get: () => super.dispatchConversationUpdateActivity }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield this.handle(context, 'ConversationUpdate', () => __awaiter(this, void 0, void 0, function* () {
                if (context.activity.channelId == "msteams") {
                    const channelData = context.activity.channelData;
                    if (context.activity.membersAdded && context.activity.membersAdded.length > 0) {
                        return yield this.onTeamsMembersAdded(context);
                    }
                    if (context.activity.membersRemoved && context.activity.membersRemoved.length > 0) {
                        return yield this.onTeamsMembersRemoved(context);
                    }
                    if (!channelData || !channelData.eventType) {
                        return yield _super.dispatchConversationUpdateActivity.call(this, context);
                    }
                    switch (channelData.eventType) {
                        case 'channelCreated':
                            return yield this.onTeamsChannelCreated(context);
                        case 'channelDeleted':
                            return yield this.onTeamsChannelDeleted(context);
                        case 'channelRenamed':
                            return yield this.onTeamsChannelRenamed(context);
                        case 'teamRenamed':
                            return yield this.onTeamsTeamRenamed(context);
                        default:
                            return yield _super.dispatchConversationUpdateActivity.call(this, context);
                    }
                }
                else {
                    return yield _super.dispatchConversationUpdateActivity.call(this, context);
                }
            }));
        });
    }
    /**
     * Called in `dispatchConversationUpdateActivity()` to trigger the `'TeamsMembersAdded'` handlers.
     * @remarks
     * If no handlers are registered for the `'TeamsMembersAdded'` event, the `'MembersAdded'` handlers will run instead.
     * @param context
     */
    onTeamsMembersAdded(context) {
        return __awaiter(this, void 0, void 0, function* () {
            if ('TeamsMembersAdded' in this.handlers && this.handlers['TeamsMembersAdded'].length > 0) {
                let teamsChannelAccountLookup = null;
                for (let i = 0; i < context.activity.membersAdded.length; i++) {
                    const channelAccount = context.activity.membersAdded[i];
                    // check whether we have a TeamChannelAccount
                    if ('givenName' in channelAccount ||
                        'surname' in channelAccount ||
                        'email' in channelAccount ||
                        'userPrincipalName' in channelAccount) {
                        // we must have a TeamsChannelAccount so skip to teh next one
                        continue;
                    }
                    // (lazily) build a lookup table of TeamsChannelAccounts
                    if (teamsChannelAccountLookup === null) {
                        const teamsChannelAccounts = yield teamsInfo_1.TeamsInfo.getMembers(context);
                        teamsChannelAccountLookup = {};
                        teamsChannelAccounts.forEach((teamChannelAccount) => teamsChannelAccountLookup[teamChannelAccount.id] = teamChannelAccount);
                    }
                    // if we have the TeamsChannelAccount in our lookup table then overwrite the ChannelAccount with it
                    const teamsChannelAccount = teamsChannelAccountLookup[channelAccount.id];
                    if (teamsChannelAccount !== undefined) {
                        context.activity.membersAdded[i] = teamsChannelAccount;
                    }
                }
                yield this.handle(context, 'TeamsMembersAdded', this.defaultNextEvent(context));
            }
            else {
                yield this.handle(context, 'MembersAdded', this.defaultNextEvent(context));
            }
        });
    }
    /**
     * Called in `dispatchConversationUpdateActivity()` to trigger the `'TeamsMembersRemoved'` handlers.
     * @remarks
     * If no handlers are registered for the `'TeamsMembersRemoved'` event, the `'MembersRemoved'` handlers will run instead.
     * @param context
     */
    onTeamsMembersRemoved(context) {
        return __awaiter(this, void 0, void 0, function* () {
            if ('TeamsMembersRemoved' in this.handlers && this.handlers['TeamsMembersRemoved'].length > 0) {
                yield this.handle(context, 'TeamsMembersRemoved', this.defaultNextEvent(context));
            }
            else {
                yield this.handle(context, 'MembersRemoved', this.defaultNextEvent(context));
            }
        });
    }
    /**
     *
     * @param context
     */
    onTeamsChannelCreated(context) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.handle(context, 'TeamsChannelCreated', this.defaultNextEvent(context));
        });
    }
    /**
     *
     * @param context
     */
    onTeamsChannelDeleted(context) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.handle(context, 'TeamsChannelDeleted', this.defaultNextEvent(context));
        });
    }
    /**
     *
     * @param context
     */
    onTeamsChannelRenamed(context) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.handle(context, 'TeamsChannelRenamed', this.defaultNextEvent(context));
        });
    }
    /**
     *
     * @param context
     */
    onTeamsTeamRenamed(context) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.handle(context, 'TeamsTeamRenamed', this.defaultNextEvent(context));
        });
    }
    /**
     *
     * @param handler
     */
    onTeamsMembersAddedEvent(handler) {
        return this.on('TeamsMembersAdded', (context, next) => __awaiter(this, void 0, void 0, function* () {
            const teamsChannelData = context.activity.channelData;
            yield handler(context.activity.membersAdded, teamsChannelData.team, context, next);
        }));
    }
    /**
     *
     * @param handler
     */
    onTeamsMembersRemovedEvent(handler) {
        return this.on('TeamsMembersRemoved', (context, next) => __awaiter(this, void 0, void 0, function* () {
            const teamsChannelData = context.activity.channelData;
            yield handler(context.activity.membersRemoved, teamsChannelData.team, context, next);
        }));
    }
    /**
     *
     * @param handler
     */
    onTeamsChannelCreatedEvent(handler) {
        return this.on('TeamsChannelCreated', (context, next) => __awaiter(this, void 0, void 0, function* () {
            const teamsChannelData = context.activity.channelData;
            yield handler(teamsChannelData.channel, teamsChannelData.team, context, next);
        }));
    }
    /**
     *
     * @param handler
     */
    onTeamsChannelDeletedEvent(handler) {
        return this.on('TeamsChannelDeleted', (context, next) => __awaiter(this, void 0, void 0, function* () {
            const teamsChannelData = context.activity.channelData;
            yield handler(teamsChannelData.channel, teamsChannelData.team, context, next);
        }));
    }
    /**
     *
     * @param handler
     */
    onTeamsChannelRenamedEvent(handler) {
        return this.on('TeamsChannelRenamed', (context, next) => __awaiter(this, void 0, void 0, function* () {
            const teamsChannelData = context.activity.channelData;
            yield handler(teamsChannelData.channel, teamsChannelData.team, context, next);
        }));
    }
    /**
     *
     * @param handler
     */
    onTeamsTeamRenamedEvent(handler) {
        return this.on('TeamsTeamRenamed', (context, next) => __awaiter(this, void 0, void 0, function* () {
            const teamsChannelData = context.activity.channelData;
            yield handler(teamsChannelData.team, context, next);
        }));
    }
    static createInvokeResponse(body) {
        return { status: 200, body };
    }
}
exports.TeamsActivityHandler = TeamsActivityHandler;
//# sourceMappingURL=teamsActivityHandler.js.map