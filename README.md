# WhatsApp On Premise API Bot framework adapter

## USAGE

```js
const {
  BotFrameworkAdapter,
  ConversationState,
  UserState,
} = require("botbuilder-waba");

const adapter = new BotFrameworkAdapter({});

const conversationState = new ConversationState(storage);
//Please check the botframework storage options here
// https://learn.microsoft.com/en-us/azure/bot-service/bot-builder-howto-v4-storage?view=azure-bot-service-4.0&tabs=javascript
const userState = new UserState(storage);
// Create the main dialog.
const moc = new BOT(conversationState, userState);

const waParser = async (req, res, next) => {
  if (!req.body.messages) {
    return res.send({ message: "no messages in webhook call" });
  }
  const sender = req.params.sender;
  const message = req.body.messages[0];
  const question = findText(message);
  const recipient = message.from;
  req.body.question = question;
  req.body.recipient = recipient;
  // req.body.bot_id = senderBot.bot_id;
  req.body.sender = sender;
  req.body.isAudio = message.type === "voice" || message.type === "audio";
  req.body.message = message;
  req.body.type = "message";
  req.body.location = message?.location;
  req.body.channelId = "whatsapp";
  req.body.conversation = {};
  req.body.conversation.id = recipient;
  req.body.text = question;
  return next();
};

server.post("/api/messages/:sender", waParser, (req, res) => {
  adapter.processActivity(req, res, async (context) => {
    await moc.run(context);
  });
});
```

## GOOD LUCK
