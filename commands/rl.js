const got = require("got");
const tools = require("../tools/tools.js");


module.exports = {
    name: "rl",
    ping: false,
    description: 'This command will give you a random logged line from either a random user or a specified user in the chat (Only works if logs are available in the channel, logs used: "https://logs.ivr.fi/"). Example: "bb rl NymN"',
    permission: 100,
    category: "Info command",
    execute: async (channel, user, input, perm) => {
        try {
            if (module.exports.permission > perm) {
                return;
            }
            let uid = user["user-id"];
            if (input[2]) {
                if (input[2].startsWith("@")) {
                    input[2] = input[2].substring(1);
                }
                uid = await got(`https://api.ivr.fi/twitch/resolve/${input[2]}`, { timeout: 10000 }).json();
                uid = uid.id;
            } else {
                let chatters = await got(`https://tmi.twitch.tv/group/user/${channel}/chatters`, { timeout: 10000 }).json();

                let chatterlist = [];
                chatters = chatters["chatters"];
                chatterlist = chatterlist.concat(chatters["broadcaster"]);
                chatterlist = chatterlist.concat(chatters["vips"]);
                chatterlist = chatterlist.concat(chatters["moderators"]);
                chatterlist = chatterlist.concat(chatters["staff"]);
                chatterlist = chatterlist.concat(chatters["admins"]);
                chatterlist = chatterlist.concat(chatters["global_mods"]);
                chatterlist = chatterlist.concat(chatters["viewers"]);

                let number = Math.floor(Math.random() * chatterlist.length);

                uid = await got(`https://api.ivr.fi/twitch/resolve/${chatterlist[number]}`, { timeout: 10000 }).json();
                uid = uid.id;
            }
            let realchannel = channel;
            if (input[3]) {
                realchannel = input[3];
            }

            const rl = await got(`https://logs.ivr.fi/channel/${realchannel}/userid/${uid}/random?json`, { timeout: 10000 }).json();

            let message = tools.splitLine(rl.messages[0].text, 350)

            const timeago = new Date().getTime() - Date.parse(rl.messages[0].timestamp);

            if (rl.status !== 404) {
                if (message[1]) {
                    return `#${realchannel} ${rl.messages[0].displayName}: ${message[0]}... - (${tools.humanizeDuration(timeago)} ago)`;
                }
                return `#${realchannel[0]}\u{E0000}${realchannel.slice(1)} ${rl.messages[0].displayName}: ${message} - (${tools.humanizeDuration(timeago)} ago)`;
            }

        } catch (err) {
            console.log(err);
            if (err.toString().startsWith("HTTPError: Response code 403 (Forbidden)")) {
                return "User or channel has opted out";
            }
            if (err.toString().startsWith("HTTPError: Response code 500 (Internal Server Error)")) {
                return "Could not load logs. Most likely the user either doesn't exist or doesn't have any logs here.";
            }
            if (err.name) {
                if (err.name === "HTTPError") {
                    return "That user does not exist";
                }
                return `FeelsDankMan api error: ${err.name}`;
            }
            return `FeelsDankMan Error`;
        }
    }
}