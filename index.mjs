import tmi from 'tmi.js';
import fakeyou from 'fakeyou.js';
import fs from 'fs';
import http from 'http';
import Audic from 'audic';

const fyClient = new fakeyou.Client({
    usernameOrEmail: '---'
});

const tClient = new tmi.client({
    identity:{
        username: "username",
        password: "BotOAuth"
    },
    channels: ["yourChannel"]
});

tClient.connect();

tClient.on("chat", async (c, userdata, m, self) => {
    await fyClient.start();
    let message = {

        send: (msgtosend) => {
            tClient.say(c, msgtosend);
        },

        content: m.trim(),

        reply: (msgtoreply) => {
            tClient.say(c, `@`+userdata.username + " " + msgtoreply);
        }
    };

    if(message.content.startsWith("!tts"))
    {
        const args = message.content.split(" ");

        if(args.length > 2)
        {
            if(args[1].replace(/ +/gi, "").length == "" || args.slice(2).join(" ").replace(/ +/gi, "") == "")
            {
                message.reply("The command is used like this: !tts <character> <message>\nTo put spaces in the character name use hyphens \"(-)\"\nOn the fakeyou.com page you can see all the characters");
                return;
            }
        }else{
            message.reply("The command is used like this: !tts <character> <message>\nTo put spaces in the character name use hyphens \"(-)\"\nOn the fakeyou.com page you can see all the characters");
            return;
        }

        let models = fyClient.searchModel(args[1].replace("-", " "));

        if(models.size >= 1) {
            let result = await fyClient.makeTTS(models.first(), args.slice(2).join(" "));
            var file = fs.createWriteStream("file.wav");
            http.get(result.audioURL().replace("https", "http"), function(response) {
                response.pipe(file);
            });
            const audic = new Audic('file.wav');
            await audic.play();

            audic.addEventListener('ended', () => {
	            audic.destroy();
            });
        }
        else
        {
            message.reply("Character don't found");
        }
    }
});