/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { BotState } from './botState';
import { TurnContext } from './turnContext';
/**
 * Defines methods for accessing a state property created in a
 * [BotState](xref:botbuilder-core.BotState) object.
 *
 * @typeparam T Optional. The type of the state property to access. Default type is `any`.
 *
 * @remarks
 * To create a state property in a state management objet, use the
 * [createProperty\<T>](xref:botbuilder-core.BotState.createProperty) method.
 */
export interface StatePropertyAccessor<T = any> {
    /**
     * Deletes the persisted property from its backing storage object.
     *
     * @remarks
     * The properties backing storage object SHOULD be loaded into memory on first access.
     *
     * ```JavaScript
     * await myProperty.delete(context);
     * ```
     * @param context Context for the current turn of conversation with the user.
     */
    delete(context: TurnContext): Promise<void>;
    /**
     * Reads a persisted property from its backing storage object.
     *
     * @remarks
     * The properties backing storage object SHOULD be loaded into memory on first access.
     *
     * If the property does not currently exist on the storage object and a `defaultValue` has been
     * specified, a clone of the `defaultValue` SHOULD be copied to the storage object. If a
     * `defaultValue` has not been specified then a value of `undefined` SHOULD be returned.
     *
     * ```JavaScript
     * const value = await myProperty.get(context, { count: 0 });
     * ```
     * @param context Context for the current turn of conversation with the user.
     * @param defaultValue (Optional) default value to copy to the backing storage object if the property isn't found.
     */
    get(context: TurnContext): Promise<T | undefined>;
    get(context: TurnContext, defaultValue: T): Promise<T>;
    /**
     * Assigns a new value to the properties backing storage object.
     *
     * @remarks
     * The properties backing storage object SHOULD be loaded into memory on first access.
     *
     * Depending on the state systems implementation, an additional step may be required to
     * persist the actual changes to disk.
     *
     * ```JavaScript
     * await myProperty.set(context, value);
     * ```
     * @param context Context for the current turn of conversation with the user.
     * @param value Value to assign.
     */
    set(context: TurnContext, value: T): Promise<void>;
}
/**
 * A `BotState` specific implementation of the `StatePropertyAccessor` interface.
 *
 * @remarks
 * Properties can be defined for a given `BotState` instance using `createProperty()`.
 *
 * ```JavaScript
 * const dialogStateProperty = ConversationState.createProperty('dialogState');
 * const dialogs = new DialogSet(dialogStateProperty);
 * ```
 * @param T (Optional) type of property being persisted. Defaults to `any` type.
 */
export declare class BotStatePropertyAccessor<T = any> implements StatePropertyAccessor<T> {
    protected readonly state: BotState;
    readonly name: string;
    /**
     * Creates a new BotStatePropertyAccessor instance.
     * @param state Parent BotState instance.
     * @param name Unique name of the property for the parent BotState.
     */
    constructor(state: BotState, name: string);
    delete(context: TurnContext): Promise<void>;
    get(context: TurnContext): Promise<T | undefined>;
    get(context: TurnContext, defaultValue: T): Promise<T>;
    set(context: TurnContext, value: T): Promise<void>;
}
