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
const botbuilder_core_1 = require("../botbuilder-core");
const botFrameworkHttpClient_1 = require("../botFrameworkHttpClient");
/**
 * A BotFrameworkHttpClient specialized for Skills that encapsulates Conversation ID generation.
 */
class SkillHttpClient extends botFrameworkHttpClient_1.BotFrameworkHttpClient {
    constructor(credentialProvider, conversationIdFactory, channelService) {
        super(credentialProvider, channelService);
        this.conversationIdFactory = conversationIdFactory;
        if (!this.conversationIdFactory) {
            throw new Error('conversationIdFactory missing');
        }
    }
    postToSkill(fromBotId, toSkill, serviceUrl, activity) {
        return __awaiter(this, void 0, void 0, function* () {
            const skillConversationId = yield this.conversationIdFactory.createSkillConversationId(botbuilder_core_1.TurnContext.getConversationReference(activity));
            return yield this.postActivity(fromBotId, toSkill.appId, toSkill.skillEndpoint, serviceUrl, skillConversationId, activity);
        });
    }
}
exports.SkillHttpClient = SkillHttpClient;
//# sourceMappingURL=skillHttpClient.js.map