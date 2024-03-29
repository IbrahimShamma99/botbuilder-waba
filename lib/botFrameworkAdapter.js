"use strict";
/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : new P(function (resolve) {
              resolve(result.value);
            }).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const os = require("os");
const botbuilder_core_1 = require("./botbuilder-core");
const botframework_connector_1 = require("botframework-connector");
const botframework_streaming_1 = require("botframework-streaming");
const streaming_1 = require("./streaming");
var StatusCodes;
(function (StatusCodes) {
  StatusCodes[(StatusCodes["OK"] = 200)] = "OK";
  StatusCodes[(StatusCodes["BAD_REQUEST"] = 400)] = "BAD_REQUEST";
  StatusCodes[(StatusCodes["UNAUTHORIZED"] = 401)] = "UNAUTHORIZED";
  StatusCodes[(StatusCodes["NOT_FOUND"] = 404)] = "NOT_FOUND";
  StatusCodes[(StatusCodes["METHOD_NOT_ALLOWED"] = 405)] = "METHOD_NOT_ALLOWED";
  StatusCodes[(StatusCodes["UPGRADE_REQUIRED"] = 426)] = "UPGRADE_REQUIRED";
  StatusCodes[(StatusCodes["INTERNAL_SERVER_ERROR"] = 500)] =
    "INTERNAL_SERVER_ERROR";
  StatusCodes[(StatusCodes["NOT_IMPLEMENTED"] = 501)] = "NOT_IMPLEMENTED";
})((StatusCodes = exports.StatusCodes || (exports.StatusCodes = {})));
class StatusCodeError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.statusCode = statusCode;
  }
}
exports.StatusCodeError = StatusCodeError;
// Retrieve additional information, i.e., host operating system, host OS release, architecture, Node.js version
const ARCHITECTURE = os.arch();
const TYPE = os.type();
const RELEASE = os.release();
const NODE_VERSION = process.version;
// tslint:disable-next-line:no-var-requires no-require-imports
const pjson = require("../package.json");
exports.USER_AGENT =
  `Microsoft-BotFramework/3.1 BotBuilder/${pjson.version} ` +
  `(Node.js,Version=${NODE_VERSION}; ${TYPE} ${RELEASE}; ${ARCHITECTURE})`;
const OAUTH_ENDPOINT = "https://api.botframework.com";
const US_GOV_OAUTH_ENDPOINT = "https://api.botframework.azure.us";
// Streaming-specific constants
const defaultPipeName = "bfv4.pipes";
const VERSION_PATH = "/api/version";
const MESSAGES_PATH = "/api/messages";
const GET = "GET";
const POST = "POST";
// This key is exported internally so that the TeamsActivityHandler will not overwrite any already set InvokeResponses.
exports.INVOKE_RESPONSE_KEY = Symbol("invokeResponse");
/**
 * A [BotAdapter](xref:botbuilder-core.BotAdapter) that can connect a bot to a service endpoint.
 * Implements [IUserTokenProvider](xref:botbuilder-core.IUserTokenProvider).
 *
 * @remarks
 * The bot adapter encapsulates authentication processes and sends activities to and receives
 * activities from the Bot Connector Service. When your bot receives an activity, the adapter
 * creates a turn context object, passes it to your bot application logic, and sends responses
 * back to the user's channel.
 *
 * The adapter processes and directs incoming activities in through the bot middleware pipeline to
 * your bot logic and then back out again. As each activity flows in and out of the bot, each
 * piece of middleware can inspect or act upon the activity, both before and after the bot logic runs.
 * Use the [use](xref:botbuilder-core.BotAdapter.use) method to add [Middleware](xref:botbuilder-core.Middleware)
 * objects to your adapter's middleware collection.
 *
 * For more information, see the articles on
 * [How bots work](https://docs.microsoft.com/azure/bot-service/bot-builder-basics) and
 * [Middleware](https://docs.microsoft.com/azure/bot-service/bot-builder-concept-middleware).
 *
 * For example:
 * ```JavaScript
 * const { BotFrameworkAdapter } = require('botbuilder');
 *
 * const adapter = new BotFrameworkAdapter({
 *     appId: process.env.MicrosoftAppId,
 *     appPassword: process.env.MicrosoftAppPassword
 * });
 *
 * adapter.onTurnError = async (context, error) => {
 *     // Catch-all logic for errors.
 * };
 * ```
 */
class BotFrameworkAdapter extends botbuilder_core_1.BotAdapter {
  /**
   * Creates a new instance of the [BotFrameworkAdapter](xref:botbuilder.BotFrameworkAdapter) class.
   *
   * @param settings Optional. The settings to use for this adapter instance.
   *
   * @remarks
   * If the `settings` parameter does not include
   * [channelService](xref:botbuilder.BotFrameworkAdapterSettings.channelService) or
   * [openIdMetadata](xref:botbuilder.BotFrameworkAdapterSettings.openIdMetadata) values, the
   * constructor checks the process' environment variables for these values. These values may be
   * set when a bot is provisioned on Azure and if so are required for the bot to work properly
   * in the global cloud or in a national cloud.
   *
   * The [BotFrameworkAdapterSettings](xref:botbuilder.BotFrameworkAdapterSettings) class defines
   * the available adapter settings.
   */
  constructor(settings) {
    super();
    // These keys are public to permit access to the keys from the adapter when it's a being
    // from library that does not have access to static properties off of BotFrameworkAdapter.
    // E.g. botbuilder-dialogs
    this.BotIdentityKey = Symbol("BotIdentity");
    this.ConnectorClientKey = Symbol("ConnectorClient");
    this.settings = Object.assign({ appId: "", appPassword: "" }, settings);
    // If settings.certificateThumbprint & settings.certificatePrivateKey are provided,
    // use CertificateAppCredentials.
    if (
      this.settings.certificateThumbprint &&
      this.settings.certificatePrivateKey
    ) {
      this.credentials = new botframework_connector_1.CertificateAppCredentials(
        this.settings.appId,
        settings.certificateThumbprint,
        settings.certificatePrivateKey,
        this.settings.channelAuthTenant
      );
      this.credentialsProvider =
        new botframework_connector_1.SimpleCredentialProvider(
          this.credentials.appId,
          ""
        );
    } else {
      this.credentials = new botframework_connector_1.MicrosoftAppCredentials(
        this.settings.appId,
        this.settings.appPassword || "",
        this.settings.channelAuthTenant
      );
      this.credentialsProvider =
        new botframework_connector_1.SimpleCredentialProvider(
          this.credentials.appId,
          this.settings.appPassword || ""
        );
    }
    this.isEmulatingOAuthCards = false;
    // If no channelService or openIdMetadata values were passed in the settings, check the process' Environment Variables for values.
    // These values may be set when a bot is provisioned on Azure and if so are required for the bot to properly work in Public Azure or a National Cloud.
    this.settings.channelService =
      this.settings.channelService ||
      process.env[
        botframework_connector_1.AuthenticationConstants.ChannelService
      ];
    this.settings.openIdMetadata =
      this.settings.openIdMetadata ||
      process.env[
        botframework_connector_1.AuthenticationConstants.BotOpenIdMetadataKey
      ];
    this.authConfiguration =
      this.settings.authConfig ||
      new botframework_connector_1.AuthenticationConfiguration();
    if (this.settings.openIdMetadata) {
      botframework_connector_1.ChannelValidation.OpenIdMetadataEndpoint =
        this.settings.openIdMetadata;
      botframework_connector_1.GovernmentChannelValidation.OpenIdMetadataEndpoint =
        this.settings.openIdMetadata;
    }
    if (
      botframework_connector_1.JwtTokenValidation.isGovernment(
        this.settings.channelService
      )
    ) {
      this.credentials.oAuthEndpoint =
        botframework_connector_1.GovernmentConstants.ToChannelFromBotLoginUrl;
      this.credentials.oAuthScope =
        botframework_connector_1.GovernmentConstants.ToChannelFromBotOAuthScope;
    }
    // If a NodeWebSocketFactoryBase was passed in, set it on the BotFrameworkAdapter.
    if (this.settings.webSocketFactory) {
      this.webSocketFactory = this.settings.webSocketFactory;
    }
    // Relocate the tenantId field used by MS Teams to a new location (from channelData to conversation)
    // This will only occur on activities from teams that include tenant info in channelData but NOT in conversation,
    // thus should be future friendly.  However, once the the transition is complete. we can remove this.
    this.use((context, next) =>
      __awaiter(this, void 0, void 0, function* () {
        if (
          context.activity.channelId === "msteams" &&
          context.activity &&
          context.activity.conversation &&
          !context.activity.conversation.tenantId &&
          context.activity.channelData &&
          context.activity.channelData.tenant
        ) {
          context.activity.conversation.tenantId =
            context.activity.channelData.tenant.id;
        }
        yield next();
      })
    );
  }
  /**
   * Used in streaming contexts to check if the streaming connection is still open for the bot to send activities.
   */
  get isStreamingConnectionOpen() {
    return this.streamingServer.isConnected;
  }
  /**
   * Asynchronously resumes a conversation with a user, possibly after some time has gone by.
   *
   * @param reference A reference to the conversation to continue.
   * @param logic The asynchronous method to call after the adapter middleware runs.
   *
   * @remarks
   * This is often referred to as a _proactive notification_, the bot can proactively
   * send a message to a conversation or user without waiting for an incoming message.
   * For example, a bot can use this method to send notifications or coupons to a user.
   *
   * To send a proactive message:
   * 1. Save a copy of a [ConversationReference](xref:botframework-schema.ConversationReference)
   *    from an incoming activity. For example, you can store the conversation reference in a database.
   * 1. Call this method to resume the conversation at a later time. Use the saved reference to access the conversation.
   * 1. On success, the adapter generates a [TurnContext](xref:botbuilder-core.TurnContext) object and calls the `logic` function handler.
   *    Use the `logic` function to send the proactive message.
   *
   * To copy the reference from any incoming activity in the conversation, use the
   * [TurnContext.getConversationReference](xref:botbuilder-core.TurnContext.getConversationReference) method.
   *
   * This method is similar to the [processActivity](xref:botbuilder.BotFrameworkAdapter.processActivity) method.
   * The adapter creates a [TurnContext](xref:botbuilder-core.TurnContext) and routes it through
   * its middleware before calling the `logic` handler. The created activity will have a
   * [type](xref:botframework-schema.Activity.type) of 'event' and a
   * [name](xref:botframework-schema.Activity.name) of 'continueConversation'.
   *
   * For example:
   * ```JavaScript
   * server.post('/api/notifyUser', async (req, res) => {
   *    // Lookup previously saved conversation reference.
   *    const reference = await findReference(req.body.refId);
   *
   *    // Proactively notify the user.
   *    if (reference) {
   *       await adapter.continueConversation(reference, async (context) => {
   *          await context.sendActivity(req.body.message);
   *       });
   *       res.send(200);
   *    } else {
   *       res.send(404);
   *    }
   * });
   * ```
   */
  continueConversation(reference, logic) {
    return __awaiter(this, void 0, void 0, function* () {
      const request = botbuilder_core_1.TurnContext.applyConversationReference(
        { type: "event", name: "continueConversation" },
        reference,
        true
      );
      const context = this.createContext(request);
      yield this.runMiddleware(context, logic);
    });
  }
  /**
   * Asynchronously creates and starts a conversation with a user on a channel.
   *
   * @param reference A reference for the conversation to create.
   * @param logic The asynchronous method to call after the adapter middleware runs.
   *
   * @remarks
   * To use this method, you need both the bot's and the user's account information on a channel.
   * The Bot Connector service supports the creating of group conversations; however, this
   * method and most channels only support initiating a direct message (non-group) conversation.
   *
   * To create and start a new conversation:
   * 1. Get a copy of a [ConversationReference](xref:botframework-schema.ConversationReference) from an incoming activity.
   * 1. Set the [user](xref:botframework-schema.ConversationReference.user) property to the
   *    [ChannelAccount](xref:botframework-schema.ChannelAccount) value for the intended recipient.
   * 1. Call this method to request that the channel create a new conversation with the specified user.
   * 1. On success, the adapter generates a turn context and calls the `logic` function handler.
   *
   * To get the initial reference, use the
   * [TurnContext.getConversationReference](xref:botbuilder-core.TurnContext.getConversationReference)
   * method on any incoming activity in the conversation.
   *
   * If the channel establishes the conversation, the generated event activity's
   * [conversation](xref:botframework-schema.Activity.conversation) property will contain the
   * ID of the new conversation.
   *
   * This method is similar to the [processActivity](xref:botbuilder.BotFrameworkAdapter.processActivity) method.
   * The adapter creates a [TurnContext](xref:botbuilder-core.TurnContext) and routes it through
   * middleware before calling the `logic` handler. The created activity will have a
   * [type](xref:botframework-schema.Activity.type) of 'event' and a
   * [name](xref:botframework-schema.Activity.name) of 'createConversation'.
   *
   * For example:
   * ```JavaScript
   * // Get group members conversation reference
   * const reference = TurnContext.getConversationReference(context.activity);
   *
   * // ...
   * // Start a new conversation with the user
   * await adapter.createConversation(reference, async (ctx) => {
   *    await ctx.sendActivity(`Hi (in private)`);
   * });
   * ```
   */
  createConversation(reference, logic) {
    return __awaiter(this, void 0, void 0, function* () {
      if (!reference.serviceUrl) {
        throw new Error(
          `BotFrameworkAdapter.createConversation(): missing serviceUrl.`
        );
      }
      // Create conversation
      const parameters = {
        bot: reference.bot,
        members: [reference.user],
        isGroup: false,
        activity: null,
        channelData: null,
      };
      const client = this.createConnectorClient(reference.serviceUrl);
      // Mix in the tenant ID if specified. This is required for MS Teams.
      if (reference.conversation && reference.conversation.tenantId) {
        // Putting tenantId in channelData is a temporary solution while we wait for the Teams API to be updated
        parameters.channelData = {
          tenant: { id: reference.conversation.tenantId },
        };
        // Permanent solution is to put tenantId in parameters.tenantId
        parameters.tenantId = reference.conversation.tenantId;
      }
      const response = yield client.conversations.createConversation(
        parameters
      );
      // Initialize request and copy over new conversation ID and updated serviceUrl.
      const request = botbuilder_core_1.TurnContext.applyConversationReference(
        { type: "event", name: "createConversation" },
        reference,
        true
      );
      const conversation = {
        id: response.id,
        isGroup: false,
        conversationType: null,
        tenantId: reference.conversation.tenantId,
        name: null,
      };
      request.conversation = conversation;
      request.channelData = parameters.channelData;
      if (response.serviceUrl) {
        request.serviceUrl = response.serviceUrl;
      }
      // Create context and run middleware
      const context = this.createContext(request);
      yield this.runMiddleware(context, logic);
    });
  }
  /**
   * Asynchronously deletes an existing activity.
   *
   * This interface supports the framework and is not intended to be called directly for your code.
   * Use [TurnContext.deleteActivity](xref:botbuilder-core.TurnContext.deleteActivity) to delete
   * an activity from your bot code.
   *
   * @param context The context object for the turn.
   * @param reference Conversation reference information for the activity to delete.
   *
   * @remarks
   * Not all channels support this operation. For channels that don't, this call may throw an exception.
   */
  deleteActivity(context, reference) {
    return __awaiter(this, void 0, void 0, function* () {
      if (!reference.serviceUrl) {
        throw new Error(
          `BotFrameworkAdapter.deleteActivity(): missing serviceUrl`
        );
      }
      if (!reference.conversation || !reference.conversation.id) {
        throw new Error(
          `BotFrameworkAdapter.deleteActivity(): missing conversation or conversation.id`
        );
      }
      if (!reference.activityId) {
        throw new Error(
          `BotFrameworkAdapter.deleteActivity(): missing activityId`
        );
      }
      const client = this.getOrCreateConnectorClient(
        context,
        reference.serviceUrl,
        this.credentials
      );
      yield client.conversations.deleteActivity(
        reference.conversation.id,
        reference.activityId
      );
    });
  }
  /**
   * Asynchronously removes a member from the current conversation.
   *
   * @param context The context object for the turn.
   * @param memberId The ID of the member to remove from the conversation.
   *
   * @remarks
   * Remove a member's identity information from the conversation.
   *
   * Not all channels support this operation. For channels that don't, this call may throw an exception.
   */
  deleteConversationMember(context, memberId) {
    return __awaiter(this, void 0, void 0, function* () {
      if (!context.activity.serviceUrl) {
        throw new Error(
          `BotFrameworkAdapter.deleteConversationMember(): missing serviceUrl`
        );
      }
      if (!context.activity.conversation || !context.activity.conversation.id) {
        throw new Error(
          `BotFrameworkAdapter.deleteConversationMember(): missing conversation or conversation.id`
        );
      }
      const serviceUrl = context.activity.serviceUrl;
      const conversationId = context.activity.conversation.id;
      const client = this.getOrCreateConnectorClient(
        context,
        serviceUrl,
        this.credentials
      );
      yield client.conversations.deleteConversationMember(
        conversationId,
        memberId
      );
    });
  }
  /**
   * Asynchronously lists the members of a given activity.
   *
   * @param context The context object for the turn.
   * @param activityId Optional. The ID of the activity to get the members of. If not specified, the current activity ID is used.
   *
   * @returns An array of [ChannelAccount](xref:botframework-schema.ChannelAccount) objects for
   * the users involved in a given activity.
   *
   * @remarks
   * Returns an array of [ChannelAccount](xref:botframework-schema.ChannelAccount) objects for
   * the users involved in a given activity.
   *
   * This is different from [getConversationMembers](xref:botbuilder.BotFrameworkAdapter.getConversationMembers)
   * in that it will return only those users directly involved in the activity, not all members of the conversation.
   */
  getActivityMembers(context, activityId) {
    return __awaiter(this, void 0, void 0, function* () {
      if (!activityId) {
        activityId = context.activity.id;
      }
      if (!context.activity.serviceUrl) {
        throw new Error(
          `BotFrameworkAdapter.getActivityMembers(): missing serviceUrl`
        );
      }
      if (!context.activity.conversation || !context.activity.conversation.id) {
        throw new Error(
          `BotFrameworkAdapter.getActivityMembers(): missing conversation or conversation.id`
        );
      }
      if (!activityId) {
        throw new Error(
          `BotFrameworkAdapter.getActivityMembers(): missing both activityId and context.activity.id`
        );
      }
      const serviceUrl = context.activity.serviceUrl;
      const conversationId = context.activity.conversation.id;
      const client = this.getOrCreateConnectorClient(
        context,
        serviceUrl,
        this.credentials
      );
      return yield client.conversations.getActivityMembers(
        conversationId,
        activityId
      );
    });
  }
  /**
   * Asynchronously lists the members of the current conversation.
   *
   * @param context The context object for the turn.
   *
   * @returns An array of [ChannelAccount](xref:botframework-schema.ChannelAccount) objects for
   * all users currently involved in a conversation.
   *
   * @remarks
   * Returns an array of [ChannelAccount](xref:botframework-schema.ChannelAccount) objects for
   * all users currently involved in a conversation.
   *
   * This is different from [getActivityMembers](xref:botbuilder.BotFrameworkAdapter.getActivityMembers)
   * in that it will return all members of the conversation, not just those directly involved in a specific activity.
   */
  getConversationMembers(context) {
    return __awaiter(this, void 0, void 0, function* () {
      if (!context.activity.serviceUrl) {
        throw new Error(
          `BotFrameworkAdapter.getConversationMembers(): missing serviceUrl`
        );
      }
      if (!context.activity.conversation || !context.activity.conversation.id) {
        throw new Error(
          `BotFrameworkAdapter.getConversationMembers(): missing conversation or conversation.id`
        );
      }
      const serviceUrl = context.activity.serviceUrl;
      const conversationId = context.activity.conversation.id;
      const client = this.getOrCreateConnectorClient(
        context,
        serviceUrl,
        this.credentials
      );
      return yield client.conversations.getConversationMembers(conversationId);
    });
  }
  /**
   * For the specified channel, asynchronously gets a page of the conversations in which this bot has participated.
   *
   * @param contextOrServiceUrl The URL of the channel server to query or a
   * [TurnContext](xref:botbuilder-core.TurnContext) object from a conversation on the channel.
   * @param continuationToken Optional. The continuation token from the previous page of results.
   * Omit this parameter or use `undefined` to retrieve the first page of results.
   *
   * @returns A [ConversationsResult](xref:botframework-schema.ConversationsResult) object containing a page of results
   * and a continuation token.
   *
   * @remarks
   * The the return value's [conversations](xref:botframework-schema.ConversationsResult.conversations) property contains a page of
   * [ConversationMembers](xref:botframework-schema.ConversationMembers) objects. Each object's
   * [id](xref:botframework-schema.ConversationMembers.id) is the ID of a conversation in which the bot has participated on this channel.
   * This method can be called from outside the context of a conversation, as only the bot's service URL and credentials are required.
   *
   * The channel batches results in pages. If the result's
   * [continuationToken](xref:botframework-schema.ConversationsResult.continuationToken) property is not empty, then
   * there are more pages to get. Use the returned token to get the next page of results.
   * If the `contextOrServiceUrl` parameter is a [TurnContext](xref:botbuilder-core.TurnContext), the URL of the channel server is
   * retrieved from
   * `contextOrServiceUrl`.[activity](xref:botbuilder-core.TurnContext.activity).[serviceUrl](xref:botframework-schema.Activity.serviceUrl).
   */
  getConversations(contextOrServiceUrl, continuationToken) {
    return __awaiter(this, void 0, void 0, function* () {
      let client;
      if (typeof contextOrServiceUrl === "object") {
        const context = contextOrServiceUrl;
        client = this.getOrCreateConnectorClient(
          context,
          context.activity.serviceUrl,
          this.credentials
        );
      } else {
        client = this.createConnectorClient(contextOrServiceUrl);
      }
      return yield client.conversations.getConversations(
        continuationToken ? { continuationToken: continuationToken } : undefined
      );
    });
  }
  /**
   * Asynchronously attempts to retrieve the token for a user that's in a login flow.
   *
   * @param context The context object for the turn.
   * @param connectionName The name of the auth connection to use.
   * @param magicCode Optional. The validation code the user entered.
   *
   * @returns A [TokenResponse](xref:botframework-schema.TokenResponse) object that contains the user token.
   */
  getUserToken(context, connectionName, magicCode) {
    return __awaiter(this, void 0, void 0, function* () {
      if (!context.activity.from || !context.activity.from.id) {
        throw new Error(
          `BotFrameworkAdapter.getUserToken(): missing from or from.id`
        );
      }
      if (!connectionName) {
        throw new Error(
          "getUserToken() requires a connectionName but none was provided."
        );
      }
      this.checkEmulatingOAuthCards(context);
      const userId = context.activity.from.id;
      const url = this.oauthApiUrl(context);
      const client = this.createTokenApiClient(url);
      const result = yield client.userToken.getToken(userId, connectionName, {
        code: magicCode,
        channelId: context.activity.channelId,
      });
      if (!result || !result.token || result._response.status == 404) {
        return undefined;
      } else {
        return result;
      }
    });
  }
  /**
   * Asynchronously signs out the user from the token server.
   *
   * @param context The context object for the turn.
   * @param connectionName The name of the auth connection to use.
   * @param userId The ID of user to sign out.
   */
  signOutUser(context, connectionName, userId) {
    return __awaiter(this, void 0, void 0, function* () {
      if (!context.activity.from || !context.activity.from.id) {
        throw new Error(
          `BotFrameworkAdapter.signOutUser(): missing from or from.id`
        );
      }
      if (!userId) {
        userId = context.activity.from.id;
      }
      this.checkEmulatingOAuthCards(context);
      const url = this.oauthApiUrl(context);
      const client = this.createTokenApiClient(url);
      yield client.userToken.signOut(userId, {
        connectionName: connectionName,
        channelId: context.activity.channelId,
      });
    });
  }
  /**
   * Asynchronously gets a sign-in link from the token server that can be sent as part
   * of a [SigninCard](xref:botframework-schema.SigninCard).
   *
   * @param context The context object for the turn.
   * @param connectionName The name of the auth connection to use.
   */
  getSignInLink(context, connectionName) {
    return __awaiter(this, void 0, void 0, function* () {
      this.checkEmulatingOAuthCards(context);
      const conversation =
        botbuilder_core_1.TurnContext.getConversationReference(
          context.activity
        );
      const url = this.oauthApiUrl(context);
      const client = this.createTokenApiClient(url);
      const state = {
        ConnectionName: connectionName,
        Conversation: conversation,
        MsAppId: client.credentials.appId,
      };
      const finalState = Buffer.from(JSON.stringify(state)).toString("base64");
      return (yield client.botSignIn.getSignInUrl(finalState, {
        channelId: context.activity.channelId,
      }))._response.bodyAsText;
    });
  }
  /**
   * Asynchronously retrieves the token status for each configured connection for the given user.
   *
   * @param context The context object for the turn.
   * @param userId Optional. If present, the ID of the user to retrieve the token status for.
   *      Otherwise, the ID of the user who sent the current activity is used.
   * @param includeFilter Optional. A comma-separated list of connection's to include. If present,
   *      the `includeFilter` parameter limits the tokens this method returns.
   *
   * @returns The [TokenStatus](xref:botframework-connector.TokenStatus) objects retrieved.
   */
  getTokenStatus(context, userId, includeFilter) {
    return __awaiter(this, void 0, void 0, function* () {
      if (!userId && (!context.activity.from || !context.activity.from.id)) {
        throw new Error(
          `BotFrameworkAdapter.getTokenStatus(): missing from or from.id`
        );
      }
      this.checkEmulatingOAuthCards(context);
      userId = userId || context.activity.from.id;
      const url = this.oauthApiUrl(context);
      const client = this.createTokenApiClient(url);
      return (yield client.userToken.getTokenStatus(userId, {
        channelId: context.activity.channelId,
        include: includeFilter,
      }))._response.parsedBody;
    });
  }
  /**
   * Asynchronously signs out the user from the token server.
   *
   * @param context The context object for the turn.
   * @param connectionName The name of the auth connection to use.
   * @param resourceUrls The list of resource URLs to retrieve tokens for.
   *
   * @returns A map of the [TokenResponse](xref:botframework-schema.TokenResponse) objects by resource URL.
   */
  getAadTokens(context, connectionName, resourceUrls) {
    return __awaiter(this, void 0, void 0, function* () {
      if (!context.activity.from || !context.activity.from.id) {
        throw new Error(
          `BotFrameworkAdapter.getAadTokens(): missing from or from.id`
        );
      }
      this.checkEmulatingOAuthCards(context);
      const userId = context.activity.from.id;
      const url = this.oauthApiUrl(context);
      const client = this.createTokenApiClient(url);
      return (yield client.userToken.getAadTokens(
        userId,
        connectionName,
        { resourceUrls: resourceUrls },
        { channelId: context.activity.channelId }
      ))._response.parsedBody;
    });
  }
  /**
   * Asynchronously sends an emulated OAuth card for a channel.
   *
   * This method supports the framework and is not intended to be called directly for your code.
   *
   * @param contextOrServiceUrl The URL of the emulator.
   * @param emulate `true` to send an emulated OAuth card to the emulator; or `false` to not send the card.
   *
   * @remarks
   * When testing a bot in the Bot Framework Emulator, this method can emulate the OAuth card interaction.
   */
  emulateOAuthCards(contextOrServiceUrl, emulate) {
    return __awaiter(this, void 0, void 0, function* () {
      this.isEmulatingOAuthCards = emulate;
      const url = this.oauthApiUrl(contextOrServiceUrl);
      yield botframework_connector_1.EmulatorApiClient.emulateOAuthCards(
        this.credentials,
        url,
        emulate
      );
    });
  }
  /**
   * Asynchronously creates a turn context and runs the middleware pipeline for an incoming activity.
   *
   * @param req An Express or Restify style request object.
   * @param res An Express or Restify style response object.
   * @param logic The function to call at the end of the middleware pipeline.
   *
   * @remarks
   * This is the main way a bot receives incoming messages and defines a turn in the conversation. This method:
   *
   * 1. Parses and authenticates an incoming request.
   *    - The activity is read from the body of the incoming request. An error will be returned
   *      if the activity can't be parsed.
   *    - The identity of the sender is authenticated as either the Emulator or a valid Microsoft
   *      server, using the bot's `appId` and `appPassword`. The request is rejected if the sender's
   *      identity is not verified.
   * 1. Creates a [TurnContext](xref:botbuilder-core.TurnContext) object for the received activity.
   *    - This object is wrapped with a [revocable proxy](https://www.ecma-international.org/ecma-262/6.0/#sec-proxy.revocable).
   *    - When this method completes, the proxy is revoked.
   * 1. Sends the turn context through the adapter's middleware pipeline.
   * 1. Sends the turn context to the `logic` function.
   *    - The bot may perform additional routing or processing at this time.
   *      Returning a promise (or providing an `async` handler) will cause the adapter to wait for any asynchronous operations to complete.
   *    - After the `logic` function completes, the promise chain set up by the middleware is resolved.
   *
   * > [!TIP]
   * > If you see the error `TypeError: Cannot perform 'set' on a proxy that has been revoked`
   * > in your bot's console output, the likely cause is that an async function was used
   * > without using the `await` keyword. Make sure all async functions use await!
   *
   * Middleware can _short circuit_ a turn. When this happens, subsequent middleware and the
   * `logic` function is not called; however, all middleware prior to this point still run to completion.
   * For more information about the middleware pipeline, see the
   * [how bots work](https://docs.microsoft.com/azure/bot-service/bot-builder-basics) and
   * [middleware](https://docs.microsoft.com/azure/bot-service/bot-builder-concept-middleware) articles.
   * Use the adapter's [use](xref:botbuilder-core.BotAdapter.use) method to add middleware to the adapter.
   *
   * For example:
   * ```JavaScript
   * server.post('/api/messages', (req, res) => {
   *    // Route received request to adapter for processing
   *    adapter.processActivity(req, res, async (context) => {
   *        // Process any messages received
   *        if (context.activity.type === ActivityTypes.Message) {
   *            await context.sendActivity(`Hello World`);
   *        }
   *    });
   * });
   * ```
   */
  processActivity(req, res, logic) {
    return __awaiter(this, void 0, void 0, function* () {
      let body;
      let status;
      let processError;
      try {
        // Parse body of request
        status = 400;
        const request = yield parseRequest(req);
        // Authenticate the incoming request
        status = 401;
        const authHeader =
          req.headers.authorization || req.headers.Authorization || "";
        const identity = yield this.authenticateRequestInternal(
          request,
          authHeader
        );
        // Process received activity
        status = 500;
        const context = this.createContext(request);
        context.turnState.set(this.BotIdentityKey, identity);
        const connectorClient = yield this.createConnectorClientWithIdentity(
          request.serviceUrl,
          identity
        );
        context.turnState.set(this.ConnectorClientKey, connectorClient);
        context.turnState.set(botbuilder_core_1.BotCallbackHandlerKey, logic);
        yield this.runMiddleware(context, logic);
        // Retrieve cached invoke response.
        if (request.type === botbuilder_core_1.ActivityTypes.Invoke) {
          const invokeResponse = context.turnState.get(
            exports.INVOKE_RESPONSE_KEY
          );
          if (invokeResponse && invokeResponse.value) {
            const value = invokeResponse.value;
            status = value.status;
            body = value.body;
          } else {
            status = 501;
          }
        } else {
          status = 200;
        }
      } catch (err) {
        // Catch the error to try and throw the stacktrace out of processActivity()
        processError = err;
        body = err.toString();
      }
      status = 200;
      // Return status
      res.status(status);
      if (body) {
        res.send(body);
      }
      res.end();
      // Check for an error
      // if (status >= 400) {
      //     if (processError && processError.stack) {
      //         throw new Error(`BotFrameworkAdapter.processActivity(): ${status} ERROR\n ${processError.stack}`);
      //     }
      //     else {
      //         throw new Error(`BotFrameworkAdapter.processActivity(): ${status} ERROR`);
      //     }
      // }
    });
  }
  /**
   * Asynchronously creates a turn context and runs the middleware pipeline for an incoming activity.
   *
   * @param activity The activity to process.
   * @param logic The function to call at the end of the middleware pipeline.
   *
   * @remarks
   * This is the main way a bot receives incoming messages and defines a turn in the conversation. This method:
   *
   * 1. Creates a [TurnContext](xref:botbuilder-core.TurnContext) object for the received activity.
   *    - This object is wrapped with a [revocable proxy](https://www.ecma-international.org/ecma-262/6.0/#sec-proxy.revocable).
   *    - When this method completes, the proxy is revoked.
   * 1. Sends the turn context through the adapter's middleware pipeline.
   * 1. Sends the turn context to the `logic` function.
   *    - The bot may perform additional routing or processing at this time.
   *      Returning a promise (or providing an `async` handler) will cause the adapter to wait for any asynchronous operations to complete.
   *    - After the `logic` function completes, the promise chain set up by the middleware is resolved.
   *
   * Middleware can _short circuit_ a turn. When this happens, subsequent middleware and the
   * `logic` function is not called; however, all middleware prior to this point still run to completion.
   * For more information about the middleware pipeline, see the
   * [how bots work](https://docs.microsoft.com/azure/bot-service/bot-builder-basics) and
   * [middleware](https://docs.microsoft.com/azure/bot-service/bot-builder-concept-middleware) articles.
   * Use the adapter's [use](xref:botbuilder-core.BotAdapter.use) method to add middleware to the adapter.
   */
  processActivityDirect(activity, logic) {
    return __awaiter(this, void 0, void 0, function* () {
      let processError;
      try {
        // Process activity
        const context = this.createContext(activity);
        context.turnState.set(botbuilder_core_1.BotCallbackHandlerKey, logic);
        yield this.runMiddleware(context, logic);
      } catch (err) {
        // Catch the error to try and throw the stacktrace out of processActivity()
        processError = err;
      }
      if (processError) {
        if (processError && processError.stack) {
          throw new Error(
            `BotFrameworkAdapter.processActivity(): ${status} ERROR\n ${processError.stack}`
          );
        } else {
          throw new Error(
            `BotFrameworkAdapter.processActivity(): ${status} ERROR`
          );
        }
      }
    });
  }
  /**
   * Asynchronously sends a set of outgoing activities to a channel server.
   *
   * This method supports the framework and is not intended to be called directly for your code.
   * Use the turn context's [sendActivity](xref:botbuilder-core.TurnContext.sendActivity) or
   * [sendActivities](xref:botbuilder-core.TurnContext.sendActivities) method from your bot code.
   *
   * @param context The context object for the turn.
   * @param activities The activities to send.
   *
   * @returns An array of [ResourceResponse](xref:)
   *
   * @remarks
   * The activities will be sent one after another in the order in which they're received. A
   * response object will be returned for each sent activity. For `message` activities this will
   * contain the ID of the delivered message.
   */
  sendActivities(context, activities) {
    return __awaiter(this, void 0, void 0, function* () {
      const responses = [];
      for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];
        switch (activity.type) {
          case "delay":
            yield delay(
              typeof activity.value === "number" ? activity.value : 1000
            );
            responses.push({});
            break;
          case "invokeResponse":
            // Cache response to context object. This will be retrieved when turn completes.
            context.turnState.set(exports.INVOKE_RESPONSE_KEY, activity);
            responses.push({});
            break;
          default:
            if (!activity.serviceUrl) {
              throw new Error(
                `BotFrameworkAdapter.sendActivity(): missing serviceUrl.`
              );
            }
            if (!activity.conversation || !activity.conversation.id) {
              throw new Error(
                `BotFrameworkAdapter.sendActivity(): missing conversation id.`
              );
            }
            if (
              activity &&
              BotFrameworkAdapter.isStreamingServiceUrl(activity.serviceUrl)
            ) {
              if (!this.isStreamingConnectionOpen) {
                throw new Error(
                  "BotFrameworkAdapter.sendActivities(): Unable to send activity as Streaming connection is closed."
                );
              }
              streaming_1.TokenResolver.checkForOAuthCards(
                this,
                context,
                activity
              );
            }
            const client = this.getOrCreateConnectorClient(
              context,
              activity.serviceUrl,
              this.credentials
            );
            if (
              activity.type === "trace" &&
              activity.channelId !== "emulator"
            ) {
              // Just eat activity
              responses.push({});
            } else if (activity.replyToId) {
              responses.push(
                yield client.conversations.replyToActivity(
                  activity.conversation.id,
                  activity.replyToId,
                  activity
                )
              );
            } else {
              responses.push(
                yield client.conversations.sendToConversation(
                  activity.conversation.id,
                  activity
                )
              );
            }
            break;
        }
      }
      return responses;
    });
  }
  /**
   * Asynchronously replaces a previous activity with an updated version.
   *
   * This interface supports the framework and is not intended to be called directly for your code.
   * Use [TurnContext.updateActivity](xref:botbuilder-core.TurnContext.updateActivity) to update
   * an activity from your bot code.
   *
   * @param context The context object for the turn.
   * @param activity The updated version of the activity to replace.
   *
   * @remarks
   * Not all channels support this operation. For channels that don't, this call may throw an exception.
   */
  updateActivity(context, activity) {
    return __awaiter(this, void 0, void 0, function* () {
      if (!activity.serviceUrl) {
        throw new Error(
          `BotFrameworkAdapter.updateActivity(): missing serviceUrl`
        );
      }
      if (!activity.conversation || !activity.conversation.id) {
        throw new Error(
          `BotFrameworkAdapter.updateActivity(): missing conversation or conversation.id`
        );
      }
      if (!activity.id) {
        throw new Error(
          `BotFrameworkAdapter.updateActivity(): missing activity.id`
        );
      }
      const client = this.getOrCreateConnectorClient(
        context,
        activity.serviceUrl,
        this.credentials
      );
      yield client.conversations.updateActivity(
        activity.conversation.id,
        activity.id,
        activity
      );
    });
  }
  /**
   * Creates a connector client.
   *
   * @param serviceUrl The client's service URL.
   *
   * @remarks
   * Override this in a derived class to create a mock connector client for unit testing.
   */
  createConnectorClient(serviceUrl) {
    return this.createConnectorClientInternal(serviceUrl, this.credentials);
  }
  /**
   * Create a ConnectorClient with a ClaimsIdentity.
   * @remarks
   * If the ClaimsIdentity contains the claims for a Skills request, create a ConnectorClient for use with Skills.
   * @param serviceUrl
   * @param identity ClaimsIdentity
   */
  createConnectorClientWithIdentity(serviceUrl, identity) {
    return __awaiter(this, void 0, void 0, function* () {
      if (!identity) {
        throw new Error(
          "BotFrameworkAdapter.createConnectorClientWithScope(): invalid identity parameter."
        );
      }
      const botAppId =
        identity.getClaimValue(
          botframework_connector_1.AuthenticationConstants.AudienceClaim
        ) ||
        identity.getClaimValue(
          botframework_connector_1.AuthenticationConstants.AppIdClaim
        );
      // Anonymous claims and non-skill claims should fall through without modifying the scope.
      let credentials = this.credentials;
      // If the request is for skills, we need to create an AppCredentials instance with
      // the correct scope for communication between the caller and the skill.
      if (
        botAppId &&
        botframework_connector_1.SkillValidation.isSkillClaim(identity.claims)
      ) {
        const scope =
          botframework_connector_1.JwtTokenValidation.getAppIdFromClaims(
            identity.claims
          );
        if (this.credentials.oAuthScope === scope) {
          // Do nothing, the current credentials and its scope are valid for the skill.
          // i.e. the adatper instance is pre-configured to talk with one skill.
        } else {
          // Since the scope is different, we will create a new instance of the AppCredentials
          // so this.credentials.oAuthScope isn't overridden.
          credentials = yield this.buildCredentials(botAppId, scope);
          if (
            botframework_connector_1.JwtTokenValidation.isGovernment(
              this.settings.channelService
            )
          ) {
            credentials.oAuthEndpoint =
              botframework_connector_1.GovernmentConstants.ToChannelFromBotLoginUrl;
            // Not sure that this code is correct because the scope was set earlier.
            credentials.oAuthScope =
              botframework_connector_1.GovernmentConstants.ToChannelFromBotOAuthScope;
          }
        }
      }
      const client = this.createConnectorClientInternal(
        serviceUrl,
        credentials
      );
      return client;
    });
  }
  /**
   * @private
   * @param serviceUrl The client's service URL.
   * @param credentials AppCredentials instance to construct the ConnectorClient with.
   */
  createConnectorClientInternal(serviceUrl, credentials) {
    if (BotFrameworkAdapter.isStreamingServiceUrl(serviceUrl)) {
      // Check if we have a streaming server. Otherwise, requesting a connector client
      // for a non-existent streaming connection results in an error
      if (!this.streamingServer) {
        throw new Error(
          `Cannot create streaming connector client for serviceUrl ${serviceUrl} without a streaming connection. Call 'useWebSocket' or 'useNamedPipe' to start a streaming connection.`
        );
      }
      return new botframework_connector_1.ConnectorClient(credentials, {
        baseUri: serviceUrl,
        userAgent: exports.USER_AGENT,
        httpClient: new streaming_1.StreamingHttpClient(this.streamingServer),
      });
    }
    return new botframework_connector_1.ConnectorClient(credentials, {
      baseUri: serviceUrl,
      userAgent: exports.USER_AGENT,
    });
  }
  /**
   * @private
   * Retrieves the ConnectorClient from the TurnContext or creates a new ConnectorClient with the provided serviceUrl and credentials.
   * @param context
   * @param serviceUrl
   * @param credentials
   */
  getOrCreateConnectorClient(context, serviceUrl, credentials) {
    if (!context || !context.turnState)
      throw new Error("invalid context parameter");
    if (!serviceUrl) throw new Error("invalid serviceUrl");
    if (!credentials) throw new Error("invalid credentials");
    let client = context.turnState.get(this.ConnectorClientKey);
    // Inspect the retrieved client to confirm that the serviceUrl is correct, if it isn't, create a new one.
    if (!client || client["baseUri"] !== serviceUrl) {
      client = this.createConnectorClientInternal(serviceUrl, credentials);
    }
    return client;
  }
  /**
   *
   * @remarks
   * @param appId
   * @param oAuthScope
   */
  buildCredentials(appId, oAuthScope) {
    return __awaiter(this, void 0, void 0, function* () {
      // There is no cache for AppCredentials in JS as opposed to C#.
      // Instead of retrieving an AppCredentials from the Adapter instance, generate a new one
      const appPassword = yield this.credentialsProvider.getAppPassword(appId);
      return new botframework_connector_1.MicrosoftAppCredentials(
        appId,
        appPassword,
        undefined,
        oAuthScope
      );
    });
  }
  /**
   * Creates an OAuth API client.
   *
   * @param serviceUrl The client's service URL.
   *
   * @remarks
   * Override this in a derived class to create a mock OAuth API client for unit testing.
   */
  createTokenApiClient(serviceUrl) {
    const client = new botframework_connector_1.TokenApiClient(
      this.credentials,
      { baseUri: serviceUrl, userAgent: exports.USER_AGENT }
    );
    return client;
  }
  /**
   * Allows for the overriding of authentication in unit tests.
   * @param request Received request.
   * @param authHeader Received authentication header.
   */
  authenticateRequest(request, authHeader) {
    return __awaiter(this, void 0, void 0, function* () {
      const claims = yield this.authenticateRequestInternal(
        request,
        authHeader
      );
      if (!claims.isAuthenticated) {
        throw new Error("Unauthorized Access. Request is not authorized");
      }
    });
  }
  /**
   * @ignore
   * @private
   * Returns the actual ClaimsIdentity from the JwtTokenValidation.authenticateRequest() call.
   * @remarks
   * This method is used instead of authenticateRequest() in processActivity() to obtain the ClaimsIdentity for caching in the TurnContext.turnState.
   *
   * @param request Received request.
   * @param authHeader Received authentication header.
   */
  authenticateRequestInternal(request, authHeader) {
    return botframework_connector_1.JwtTokenValidation.authenticateRequest(
      request,
      authHeader,
      this.credentialsProvider,
      this.settings.channelService,
      this.authConfiguration
    );
  }
  /**
   * Gets the OAuth API endpoint.
   *
   * @param contextOrServiceUrl The URL of the channel server to query or
   * a [TurnContext](xref:botbuilder-core.TurnContext). For a turn context, the context's
   * [activity](xref:botbuilder-core.TurnContext.activity).[serviceUrl](xref:botframework-schema.Activity.serviceUrl)
   * is used for the URL.
   *
   * @remarks
   * Override this in a derived class to create a mock OAuth API endpoint for unit testing.
   */
  oauthApiUrl(contextOrServiceUrl) {
    return this.isEmulatingOAuthCards
      ? typeof contextOrServiceUrl === "object"
        ? contextOrServiceUrl.activity.serviceUrl
        : contextOrServiceUrl
      : this.settings.oAuthEndpoint
      ? this.settings.oAuthEndpoint
      : botframework_connector_1.JwtTokenValidation.isGovernment(
          this.settings.channelService
        )
      ? US_GOV_OAUTH_ENDPOINT
      : OAUTH_ENDPOINT;
  }
  /**
   * Checks the environment and can set a flag to emulate OAuth cards.
   *
   * @param context The context object for the turn.
   *
   * @remarks
   * Override this in a derived class to control how OAuth cards are emulated for unit testing.
   */
  checkEmulatingOAuthCards(context) {
    if (
      !this.isEmulatingOAuthCards &&
      context.activity.channelId === "emulator" &&
      !this.credentials.appId
    ) {
      this.isEmulatingOAuthCards = true;
    }
  }
  /**
   * Creates a turn context.
   *
   * @param request An incoming request body.
   *
   * @remarks
   * Override this in a derived class to modify how the adapter creates a turn context.
   */
  createContext(request) {
    return new botbuilder_core_1.TurnContext(this, request);
  }
  /**
   * Checks the validity of the request and attempts to map it the correct virtual endpoint,
   * then generates and returns a response if appropriate.
   * @param request A ReceiveRequest from the connected channel.
   * @returns A response created by the BotAdapter to be sent to the client that originated the request.
   */
  processRequest(request) {
    return __awaiter(this, void 0, void 0, function* () {
      let response = new botframework_streaming_1.StreamingResponse();
      if (!request) {
        response.statusCode = StatusCodes.BAD_REQUEST;
        response.setBody(`No request provided.`);
        return response;
      }
      if (!request.verb || !request.path) {
        response.statusCode = StatusCodes.BAD_REQUEST;
        response.setBody(
          `Request missing verb and/or path. Verb: ${request.verb}. Path: ${request.path}`
        );
        return response;
      }
      if (
        request.verb.toLocaleUpperCase() !== POST &&
        request.verb.toLocaleUpperCase() !== GET
      ) {
        response.statusCode = StatusCodes.METHOD_NOT_ALLOWED;
        response.setBody(
          `Invalid verb received. Only GET and POST are accepted. Verb: ${request.verb}`
        );
      }
      if (request.path.toLocaleLowerCase() === VERSION_PATH) {
        return yield this.handleVersionRequest(request, response);
      }
      // Convert the StreamingRequest into an activity the Adapter can understand.
      let body;
      try {
        body = yield this.readRequestBodyAsString(request);
      } catch (error) {
        response.statusCode = StatusCodes.BAD_REQUEST;
        response.setBody(`Request body missing or malformed: ${error}`);
        return response;
      }
      if (request.path.toLocaleLowerCase() !== MESSAGES_PATH) {
        response.statusCode = StatusCodes.NOT_FOUND;
        response.setBody(
          `Path ${request.path.toLocaleLowerCase()} not not found. Expected ${MESSAGES_PATH}}.`
        );
        return response;
      }
      if (request.verb.toLocaleUpperCase() !== POST) {
        response.statusCode = StatusCodes.METHOD_NOT_ALLOWED;
        response.setBody(
          `Invalid verb received for ${request.verb.toLocaleLowerCase()}. Only GET and POST are accepted. Verb: ${
            request.verb
          }`
        );
        return response;
      }
      try {
        let context = new botbuilder_core_1.TurnContext(this, body);
        yield this.runMiddleware(context, this.logic);
        if (body.type === botbuilder_core_1.ActivityTypes.Invoke) {
          let invokeResponse = context.turnState.get(
            exports.INVOKE_RESPONSE_KEY
          );
          if (invokeResponse && invokeResponse.value) {
            const value = invokeResponse.value;
            response.statusCode = value.status;
            response.setBody(value.body);
          } else {
            response.statusCode = StatusCodes.NOT_IMPLEMENTED;
          }
        } else {
          response.statusCode = StatusCodes.OK;
        }
      } catch (error) {
        response.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
        response.setBody(error);
        return response;
      }
      return response;
    });
  }
  /**
   * Connects the handler to a Named Pipe server and begins listening for incoming requests.
   * @param pipeName The name of the named pipe to use when creating the server.
   * @param logic The logic that will handle incoming requests.
   */
  useNamedPipe(logic, pipeName = defaultPipeName) {
    return __awaiter(this, void 0, void 0, function* () {
      if (!logic) {
        throw new Error("Bot logic needs to be provided to `useNamedPipe`");
      }
      this.logic = logic;
      this.streamingServer = new botframework_streaming_1.NamedPipeServer(
        pipeName,
        this
      );
      yield this.streamingServer.start();
    });
  }
  /**
   * Process the initial request to establish a long lived connection via a streaming server.
   * @param req The connection request.
   * @param socket The raw socket connection between the bot (server) and channel/caller (client).
   * @param head The first packet of the upgraded stream.
   * @param logic The logic that handles incoming streaming requests for the lifetime of the WebSocket connection.
   */
  useWebSocket(req, socket, head, logic) {
    return __awaiter(this, void 0, void 0, function* () {
      // Use the provided NodeWebSocketFactoryBase on BotFrameworkAdapter construction,
      // otherwise create a new NodeWebSocketFactory.
      const webSocketFactory =
        this.webSocketFactory ||
        new botframework_streaming_1.NodeWebSocketFactory();
      if (!logic) {
        throw new Error(
          "Streaming logic needs to be provided to `useWebSocket`"
        );
      }
      this.logic = logic;
      try {
        yield this.authenticateConnection(req, this.settings.channelService);
      } catch (err) {
        // If the authenticateConnection call fails, send back the correct error code and close
        // the connection.
        if (
          typeof err.message === "string" &&
          err.message.toLowerCase().startsWith("unauthorized")
        ) {
          abortWebSocketUpgrade(socket, 401);
        } else if (
          typeof err.message === "string" &&
          err.message.toLowerCase().startsWith(`'authheader'`)
        ) {
          abortWebSocketUpgrade(socket, 400);
        } else {
          abortWebSocketUpgrade(socket, 500);
        }
        // Re-throw the error so the developer will know what occurred.
        throw err;
      }
      const nodeWebSocket = yield webSocketFactory.createWebSocket(
        req,
        socket,
        head
      );
      yield this.startWebSocket(nodeWebSocket);
    });
  }
  authenticateConnection(req, channelService) {
    return __awaiter(this, void 0, void 0, function* () {
      if (!this.credentials.appId) {
        // auth is disabled
        return;
      }
      const authHeader =
        req.headers.authorization || req.headers.Authorization || "";
      const channelIdHeader =
        req.headers.channelid ||
        req.headers.ChannelId ||
        req.headers.ChannelID ||
        "";
      // Validate the received Upgrade request from the channel.
      const claims =
        yield botframework_connector_1.JwtTokenValidation.validateAuthHeader(
          authHeader,
          this.credentialsProvider,
          channelService,
          channelIdHeader
        );
      // Add serviceUrl from claim to static cache to trigger token refreshes.
      const serviceUrl = claims.getClaimValue(
        botframework_connector_1.AuthenticationConstants.ServiceUrlClaim
      );
      botframework_connector_1.MicrosoftAppCredentials.trustServiceUrl(
        serviceUrl
      );
      if (!claims.isAuthenticated) {
        throw new Error("Unauthorized Access. Request is not authorized");
      }
    });
  }
  /**
   * Connects the handler to a WebSocket server and begins listening for incoming requests.
   * @param socket The socket to use when creating the server.
   */
  startWebSocket(socket) {
    return __awaiter(this, void 0, void 0, function* () {
      this.streamingServer = new botframework_streaming_1.WebSocketServer(
        socket,
        this
      );
      yield this.streamingServer.start();
    });
  }
  readRequestBodyAsString(request) {
    return __awaiter(this, void 0, void 0, function* () {
      const contentStream = request.streams[0];
      return yield contentStream.readAsJson();
    });
  }
  handleVersionRequest(request, response) {
    return __awaiter(this, void 0, void 0, function* () {
      if (request.verb.toLocaleUpperCase() === GET) {
        response.statusCode = StatusCodes.OK;
        if (!this.credentials.appId) {
          response.setBody({ UserAgent: exports.USER_AGENT });
          return response;
        }
        let token = "";
        try {
          token = yield this.credentials.getToken();
        } catch (err) {
          /**
           * In reality a missing BotToken will cause the channel to close the connection,
           * but we still send the response and allow the channel to make that decision
           * instead of proactively disconnecting. This allows the channel to know why
           * the connection has been closed and make the choice not to make endless reconnection
           * attempts that will end up right back here.
           */
          console.error(err.message);
        }
        response.setBody({ UserAgent: exports.USER_AGENT, BotToken: token });
      } else {
        response.statusCode = StatusCodes.METHOD_NOT_ALLOWED;
        response.setBody(
          `Invalid verb received for path: ${request.path}. Only GET is accepted. Verb: ${request.verb}`
        );
      }
      return response;
    });
  }
  /**
   * Determine if the serviceUrl was sent via an Http/Https connection or Streaming
   * This can be determined by looking at the ServiceUrl property:
   *   (1) All channels that send messages via http/https are not streaming
   *   (2) Channels that send messages via streaming have a ServiceUrl that does not begin with http/https.
   * @param serviceUrl the serviceUrl provided in the resquest.
   */
  static isStreamingServiceUrl(serviceUrl) {
    return serviceUrl && !serviceUrl.toLowerCase().startsWith("http");
  }
}
exports.BotFrameworkAdapter = BotFrameworkAdapter;
/**
 * Handles incoming webhooks from the botframework
 * @private
 * @param req incoming web request
 */
function parseRequest(req) {
  return new Promise((resolve, reject) => {
    function returnActivity(activity) {
      if (typeof activity !== "object") {
        throw new Error(
          `BotFrameworkAdapter.parseRequest(): invalid request body.`
        );
      }
      // if (typeof activity.type !== 'string') {
      //     throw new Error(`BotFrameworkAdapter.parseRequest(): missing activity type.`);
      // }
      // if (typeof activity.timestamp === 'string') {
      //     activity.timestamp = new Date(activity.timestamp);
      // }
      // if (typeof activity.localTimestamp === 'string') {
      //     activity.localTimestamp = new Date(activity.localTimestamp);
      // }
      // if (typeof activity.expiration === 'string') {
      //     activity.expiration = new Date(activity.expiration);
      // }
      resolve(activity);
    }
    if (req.body) {
      try {
        returnActivity(req.body);
      } catch (err) {
        reject(err);
      }
    } else {
      let requestData = "";
      req.on("data", (chunk) => {
        requestData += chunk;
      });
      req.on("end", () => {
        try {
          req.body = JSON.parse(requestData);
          returnActivity(req.body);
        } catch (err) {
          reject(err);
        }
      });
    }
  });
}
function delay(timeout) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}
function abortWebSocketUpgrade(socket, code) {
  if (socket.writable) {
    const connectionHeader = `Connection: 'close'\r\n`;
    socket.write(
      `HTTP/1.1 ${code} ${http_1.STATUS_CODES[code]}\r\n${connectionHeader}\r\n`
    );
  }
  socket.destroy();
}
//# sourceMappingURL=botFrameworkAdapter.js.map
