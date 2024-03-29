/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Activity } from 'botframework-schema';
import { Middleware } from './middlewareSet';
import { TurnContext } from './turnContext';
/**
 * Middleware to patch mention Entities from Skype since they don't conform to expected values.
 * Bots that interact with Skype should use this middleware if mentions are used.
 *
 * @remarks
 * A Skype mention "text" field is of the format:
 *   <at id="28:2bc5b54d-5d48-4ff1-bd25-03dcbb5ce918">botname</at>
 * But Activity.Text doesn't contain those tags and RemoveMentionText can't remove
 * the entity from Activity.Text.
 * This will remove the <at> nodes, leaving just the name.
 */
export declare class SkypeMentionNormalizeMiddleware implements Middleware {
    static normalizeSkypeMentionText(activity: Activity): void;
    onTurn(turnContext: TurnContext, next: () => Promise<void>): Promise<void>;
}
