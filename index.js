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
  identity: {
    username: "TWITCH_USERNAME",
    password: "TWITCH_OAUTH"
  },
  channels: [""]
});

tClient.connect();

async function playAudio(audioFilePath, sampleRate, numChannels, bitDepth) {
  try {
    speaker = new Speaker({
      channels: numChannels,
      bitDepth: bitDepth,
      sampleRate: sampleRate
    });

    fs.createReadStream(audioFilePath).pipe(speaker);
  } catch (error) {
    console.error('Error playing the audio file:', error);
  }
}

tClient.on("chat", async (c, userdata, m, self) => {
  let message = {
    content: m.trim(),
    reply: (msgtoreply) => {
      tClient.say(c, `@${userdata.username} ${msgtoreply}`);
    }
  };

  if (message.content.startsWith("!tts")) {
    const args = message.content.split(" ");

    if(args.length >= 2)
    {
      if (args[1].trim() === '' || args.slice(2).join(' ').trim() === '')
      {
        message.reply("El comando se usa así: !tts <personaje> <mensaje>\nPara poner espacios en el nombre del personaje usa guiones \"(-)\"\nEn la pagina fakeyou.com puedes ver todos los personajes");
        return;
      }
    }else{
      message.reply("El comando se usa así: !tts <personaje> <mensaje>\nPara poner espacios en el nombre del personaje usa guiones \"(-)\"\nEn la pagina fakeyou.com puedes ver todos los personajes");
      return;
    }

    await fyClient.start();
    const modelName = args[1].replace("-", " ");
    const models = fyClient.searchModel(modelName);

    if (models.size >= 1) {
      const result = await fyClient.makeTTS(models.first(), args.slice(2).join(" "));
      const audioFilePath = "file.wav";
      const sampleRate = result.header.sample_rate;
      const numChannels = result.header.num_channels;
      const bitDepth = result.header.bits_per_sample;

      http.get(result.audioURL().replace("https", "http"), (response) => {
        const file = fs.createWriteStream(audioFilePath);
        response.pipe(file);
        response.on('end', () => {
          playAudio(audioFilePath, sampleRate, numChannels, bitDepth);
        });
      });
    } else {
      message.reply("Character not found");
    }
  }
});
