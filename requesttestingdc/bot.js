import WebSocket from 'ws';
import EventEmitter from 'events';

function startDiscordDMListener(token, replyMessage) {
  const initialURL = 'wss://gateway.discord.gg';
  let url = initialURL;
  let session_id = '';
  let ws;
  let heartbeatIntervalId = null;
  let seq = -1;
  let wasReady = false;
  let selfId = null;
  const answeredUsers = new Set(); // Store user IDs we’ve already answered

  const botEmitter = new EventEmitter(); // create event emitter instance

  const heartbeat = (ms) => setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ op: 1, d: seq }));
    }
  }, ms);

  // Your sendMessage function (unchanged except added emit for dmReplied)
  function sendMessage(token, channelId, message) {
    const url = `https://discord.com/api/v8/channels/${channelId}/messages`;
    const data = {
      content: message
    };

    fetch(url, {
      method: "POST",
      headers: {
        "Authorization": token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
      .then(response => {
        if (response.ok) {
          console.log("Message sent successfully");
        } else {
          console.error("Failed to send message, status:", response.status);
        }
      })
      .catch(error => {
        console.error("Error sending message:", error);
      });
  }

  async function sendReplies(channelId) {
    const messages = replyMessage.split('|').map(msg => msg.trim());
    for (const msg of messages) {
      sendMessage(token, channelId, msg);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 sec between
    }
  }

  function initializeWebSocket() {
    if (ws && ws.readyState !== WebSocket.CLOSED) ws.close();
    wasReady = false;
    ws = new WebSocket(`${url}/?v=10&encoding=json`);

    ws.on('open', () => {
      if (url !== initialURL) {
        const resumePayload = {
          op: 6,
          d: { token, session_id, seq }
        };
        ws.send(JSON.stringify(resumePayload));
      }
    });

    ws.on('error', (e) => console.error('WebSocket error:', e));

    ws.on('close', () => {
      if (wasReady) {
        console.log('Gateway closed, reconnecting...');
        clearInterval(heartbeatIntervalId);
        setTimeout(initializeWebSocket, 2500);
      }
    });

    ws.on('message', (data) => {
      const payload = JSON.parse(data);
      const { t, op, d, s } = payload;

      switch (op) {
        case 10:
          clearInterval(heartbeatIntervalId);
          heartbeatIntervalId = heartbeat(d.heartbeat_interval);
          wasReady = true;
          if (url === initialURL) {
            const identifyPayload = {
              op: 2,
              d: {
                token,
                intents: 1 << 12, // Direct messages intent
                properties: {
                  os: 'linux',
                  browser: 'chrome',
                  device: 'chrome'
                }
              }
            };
            ws.send(JSON.stringify(identifyPayload));
          }
          break;
        case 0:
          seq = s;
          break;
      }

      if (t === 'READY') {
        url = d.resume_gateway_url;
        session_id = d.session_id;
        selfId = d.user.id;
        console.log(`Connected as ${d.user.username}#${d.user.discriminator}`);
      }

      if (t === 'RESUMED') {
        console.log('Connection resumed.');
      }

      if (t === 'MESSAGE_CREATE') {
        if (!d.guild_id && d.author.id !== selfId) {
          if (answeredUsers.has(d.author.id)) {
            console.log(`Ignoring ${d.author.username}#${d.author.discriminator}, already answered.`);
            return;
          }

          console.log(`DM from ${d.author.username}#${d.author.discriminator}: ${d.content}`);

          botEmitter.emit('dmReceived'); // emit event on receiving DM

          // Mark user as answered before sending
          answeredUsers.add(d.author.id);

          sendReplies(d.channel_id);
        }
      }
    });
  }

  initializeWebSocket();

  // return the event emitter so caller can listen
  return botEmitter;
}

export default startDiscordDMListener;
