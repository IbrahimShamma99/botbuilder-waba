"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const botState_1 = require("./botState");
const NO_KEY = `ConversationState: overridden getStorageKey method did not return a key.`;
/**
 * Reads and writes conversation state for your bot to storage.
 *
 * @remarks
 * Each conversation your bot has with a user or group will have its own isolated storage object
 * that can be used to persist conversation tracking information between turns of the conversation.
 * This state information can be reset at any point by calling [clear()](#clear).
 *
 * ```JavaScript
 * const { ConversationState, MemoryStorage } = require('botbuilder');
 *
 * const conversationState = new ConversationState(new MemoryStorage());
 * ```
 */
class ConversationState extends botState_1.BotState {
    /**
     * Creates a new ConversationState instance.
     * @param storage Storage provider to persist conversation state to.
     * @param namespace (Optional) namespace to append to storage keys. Defaults to an empty string.
     */
    constructor(storage, namespace = '') {
        super(storage, (context) => {
            // Calculate storage key
            const key = this.getStorageKey(context);
            return key ? Promise.resolve(key) : Promise.reject(new Error(NO_KEY));
        });
        this.namespace = namespace;
    }
    /**
     * Returns the storage key for the current conversation state.
     * @param context Context for current turn of conversation with the user.
     */
    getStorageKey(context) {
        const activity = context.activity;
        const channelId = activity.channelId;
        const conversationId = activity && activity.conversation && activity.conversation.id ? activity.conversation.id : undefined;
        if (!channelId) {
            throw new Error('missing activity.channelId');
        }
        // if (!conversationId) {
        //     throw new Error('missing activity.conversation.id');
        // }
        return `${channelId}/conversations/${conversationId}/${this.namespace}`;
    }
}
exports.ConversationState = ConversationState;
//# sourceMappingURL=conversationState.js.map