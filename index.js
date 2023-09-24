require('dotenv').config()
const tmi = require('tmi.js');
const fakeyou = require('fakeyou.js');
const path = require('path');
const wavFileInfo = require('wav-file-info');
const fs = require('fs');
const http = require('http');
const Speaker = require('speaker');

let speaker;

const fyClient = new fakeyou.Client({
    usernameOrEmail: '---'
});

const tClient = new tmi.client({
    identity:{
        username: process.env['TWITCH_USERNAME'],
        password: process.env['TWITCH_OAUTH']
    },
    channels: [process.env['TWITCH_USERNAME']]
});

tClient.connect();

tClient.on("chat", async (c, userdata, m, self) => {
    let message = {
        content: m.trim(),
        reply: (msgtoreply) => {
            tClient.say(c, `@${userdata.username} ${msgtoreply}`);
        }
    };

    if(message.content.startsWith("!help") && process.env['USE_COMMAND'] == "1") return message.reply("The command is used like this: !tts <character> <message>\nTo include spaces in the character name, use hyphens \"(-)\"\nYou can view all characters on https://fakeyou.com");

    if((message.content.startsWith("!tts") && process.env['USE_COMMAND'] == "1") || (userdata["custom-reward-id"] == process.env['REWARD_ID'] && process.env['USE_REWARD'] == "1"))
    {
        const args = message.content.split(" ");

        if(args.length >= 2)
        {
            if (args[1].trim() === '' || args.slice(2).join(' ').trim() === '')
            {
                message.reply("The command is used like this: !tts <character> <message>\nTo include spaces in the character name, use hyphens \"(-)\"\nYou can view all characters on https://fakeyou.com");
                return;
            }
        }else{
            message.reply("The command is used like this: !tts <character> <message>\nTo include spaces in the character name, use hyphens \"(-)\"\nYou can view all characters on https://fakeyou.com");
            return;
        }

        await fyClient.start();
        var models = fyClient.searchModel(args[1].replace("-", " "));

        if(models.size >= 1) {
            var result = await fyClient.makeTTS(models.first(), args.slice(2).join(" "));
            var file = fs.createWriteStream("file.wav");
            http.get(result.audioURL().replace("https", "http"), function(response) {
                response.pipe(file);
            });

            playAudio();
        }
        else
        {
            message.reply("Character not found");
        }
    }
});

async function playAudio() {
    try {
      const audioFilePath = path.join(__dirname, 'file.wav');
  
      const info = await new Promise((resolve, reject) => {
        wavFileInfo.infoByFilename(audioFilePath, (err, info) => {
          if (err) reject(err);
          else resolve(info);
        });
      });
  
      speaker = new Speaker({
        channels: info.header.num_channels,
        bitDepth: info.header.bits_per_sample,
        sampleRate: info.header.sample_rate
      });
  
      fs.createReadStream(audioFilePath).pipe(speaker);
  
      console.log('Playing audio from', audioFilePath);
    } catch (error) {
      console.error('Error playing audio file:', error);
    }
  }
