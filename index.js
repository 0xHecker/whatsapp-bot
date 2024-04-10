const express = require('express');
const { Client, RemoteAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

require('dotenv').config()
const uri = process.env.MONGO_URI;

const allowedGroups = {
  '120363169385830766@g.us': {
    name: 'Bangalore Newbies Chat Group',
    welcomeMessage: 'Hi {{name}}, welcome to the our community!\n Please introduce yourself :) \n\n Tell us about what you do, where you\'re from, what you like or where do you live so we can figure out your vibe:) ',
    messageCounts: {}
  },
  '120363200819647560@g.us': {
    name: 'Telugollu తెలుగు',
    welcomeMessage: 'Hi {{name}}, welcome to the group! Intro ichukondi',
    messageCounts: {}
  },
  '120363255388643681@g.us': {
    name: 'Test group',
    welcomeMessage: 'Welcome {{name}} to the test group!',
    messageCounts: {}
  },
};

let client;

mongoose.connect(uri).then(() => {
  console.log('Connected to MongoDB');
  const store = new MongoStore({ mongoose: mongoose });
  client = new Client({
    authStrategy: new RemoteAuth({
      store: store,
      backupSyncIntervalMs: 300000
    }),
    webVersionCache: {
      type: "remote",
      remotePath:
        "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
    },
  });

  console.log("client", client);

  client.on('qr', (qr) => {
    console.log("inside qr");
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', async () => {
    console.log('Client is ready!');
  });

  client.on('debug', (debug) => {
    console.log(debug);
  });

  client.on('message', async (msg) => {
    console.log(msg._data.notifyName || msg._data.author.split('@')[0]);
    if (!allowedGroups[msg.from]) return;
    const senderId = msg._data.notifyName || msg._data.author.split('@')[0];
    const group = allowedGroups[msg.from];
    if (group.messageCounts[senderId]) {
      group.messageCounts[senderId]++;
    } else {
      group.messageCounts[senderId] = 1;
    }
    console.log(group.messageCounts);
  });

  client.on('group_join', async (notification) => {
    const groupId = notification.id.remote;
    const participantId = notification.id.participant;
    console.log("groupId", groupId);
    console.log("participantId", participantId);

    if (!allowedGroups[groupId]) return;

    const chat = await client.getChatById(groupId);
    console.log('chat', chat);

    const participantContact = await client.getContactById(participantId);
    const messageText = allowedGroups[groupId].welcomeMessage.replace('{{name}}', participantContact.pushname || participantId.split('@')[0]);

    console.log("participantContact", participantContact);
    console.log("messageText", messageText);
    await client.sendMessage(groupId, messageText, { mentions: [participantId] });
  });

  client.initialize();

}).catch((err) => {
  console.log('Error connecting to MongoDB', err);
});

function sendDailyStats() {
  Object.keys(allowedGroups).forEach(async (groupId) => {
    let statsMessage = 'Today\'s Leaderboard:\n\n';
    let totalCount = 0;
    const group = allowedGroups[groupId];
    const sortedNames = Object.keys(group.messageCounts).sort((a, b) => group.messageCounts[b] - group.messageCounts[a]);
    console.log("sortedNames", sortedNames);
    for (const name of sortedNames) {
      const count = group.messageCounts[name];
      totalCount += count;
      statsMessage += `${name}: ${count}\n`;
    }

    statsMessage += `\n\nTotal Messages Today: ${totalCount}`;

    await client.sendMessage(groupId, statsMessage);

    // Reset counts for the next day
    Object.keys(group.messageCounts).forEach((key) => {
      group.messageCounts[key] = 0;
    });
  });
}

cron.schedule('29 18 * * *', sendDailyStats); // 11:59 PM IST

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

/**
 GroupNotification {
  id: {
    fromMe: false,
    remote: '1xxxxx989389@g.us',
    id: '23xxxxx11260445',
    participant: '9xxxx87@c.us',
    _serialized: 'false_120xxxx389@g.us_231169xxxx916260121987@c.us'
  },
  body: '',
  type: 'invite',
  timestamp: 1711260445,
  chatId: '120xxxx9389@g.us',
  author: undefined,
  recipientIds: [ '91xxxxx987@c.us' ]
}
 */


// async function run() {
//   try {
//     await mongo_client.connect();
//     await mongo_client.db("admin").command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     await mongo_client.close();
//   }
// }

// run().catch(console.dir);

// const store = new MongoStore({ mongoose: mongo_client });
// const client = new Client({
//   authStrategy: new RemoteAuth({
//     store: store,
//     backupSyncIntervalMs: 300000
//   })
// });

// const client = new Client({
//   puppeteer: { headless: true },
//   authStrategy: new LocalAuth(),
// });


/*
{
  _data: {
    id: {
      fromMe: false,
      remote: 'xxxx@g.us',
      id: '3Axxx1D5E1673E',
      participant: '919xxx44@c.us',
      _serialized: 'false_xxx1033@g.uxxxE_919943377344@c.us'
    },
    viewed: false,
    body: 'doesn’t this make the 100m unusable',
    type: 'chat',
    t: 1710952639,
    notifyName: 'ABCD',
    from: '12036xxx1033@g.us',
    to: '919xxx20@c.us',
    author: '91xx44@c.us',
    ack: 1,
    invis: false,
    isNewMsg: true,
    star: false,
    kicNotified: false,
    recvFresh: true,
    isFromTemplate: false,
    pollInvalidated: false,
    isSentCagPollCreation: false,
    latestEditMsgKey: null,
    latestEditSenderTimestampMs: null,
    mentionedJidList: [],
    groupMentions: [],
    isEventCanceled: false,
    isVcardOverMmsDocument: false,
    isForwarded: false,
    hasReaction: false,
    productHeaderImageRejected: false,
    lastPlaybackProgress: 0,
    isDynamicReplyButtonsMsg: false,
    isCarouselCard: false,
    parentMsgId: null,
    isMdHistoryMsg: false,
    stickerSentTs: 0,
    isAvatar: false,
    lastUpdateFromServerTs: 0,
    invokedBotWid: null,
    bizBotType: null,
    botResponseTargetId: null,
    botPluginType: null,
    botPluginReferenceIndex: null,
    botPluginSearchProvider: null,
    botPluginSearchUrl: null,
    botPluginMaybeParent: false,
    botReelPluginThumbnailCdnUrl: null,
    botMsgBodyType: null,
    requiresDirectConnection: null,
    bizContentPlaceholderType: null,
    hostedBizEncStateMismatch: false,
    senderOrRecipientAccountTypeHosted: false,
    placeholderCreatedWhenAccountIsHosted: false,
    links: []
  },
  mediaKey: undefined,
  id: {
    fromMe: false,
    remote: '12xxx31033@g.us',
    id: '3AxxxD5E1673E',
    participant: '9xxx344@c.us',
    _serialized: 'faxxx1033@g.us_3A3xxx9943377344@c.us'
  },
  ack: 1,
  hasMedia: false,
  body: 'doesn’t this make the 100m unusable',
  type: 'chat',
  timestamp: 1710952639,
  from: '12xxx5931033@g.us',
  to: '91xxxx20@c.us',
  author: '919xxxxSS44@c.us',
  deviceType: 'ios',
  isForwarded: false,
  forwardingScore: 0,
  isStatus: false,
  isStarred: false,
  broadcast: undefined,
  fromMe: false,
  hasQuotedMsg: false,
  hasReaction: false,
  duration: undefined,
  location: undefined,
  vCards: [],
  inviteV4: undefined,
  mentionedIds: [],
  orderId: undefined,
  token: undefined,
  isGif: false,
  isEphemeral: undefined,
  links: []
}

*/