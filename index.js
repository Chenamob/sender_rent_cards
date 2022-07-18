'use strict'

import mqtt from 'mqtt';
import chalk from 'chalk'
import zlib from 'zlib'

import fs from 'fs';

import dotenv from 'dotenv'
import path from "path"


import {
    fileURLToPath
} from 'url';
import {
    throws
} from 'assert';

const __dirname = path.dirname(fileURLToPath(
    import.meta.url));

dotenv.config({
    path: path.join(__dirname, './.env')
})

// import hello from './xxx2.js'
// console.log( hello());

// require('dotenv.config();
// import dotenv from 'dotenv';
import {
    exit
} from 'process';

let LIST_FILE = 'cards_list.json'

var jsonTask;
let rawtask;
var jsonAccs;
try {
    rawtask = fs.readFileSync(LIST_FILE)
    jsonTask = JSON.parse(rawtask)

} catch (error) {
    console.log("Error parsing LIST_FILE ", LIST_FILE);
    console.log(error);
    exit(0);
}


let task = jsonTask;


let BOT_MQTT_ID = "cards_list_UPDATER" //todo make UUID
// if(task.rules.RENT_options.useLocalAccListInsteadRemote == )
console.log(`======= Updater-rent-cards ====================================================================`);

console.log(`   Send file [${LIST_FILE}] to the server`);

// console.log(`\tUsage: node main <BOT_LABEL_FOR_MQTT_TOPIC>  `);
// console.log('');
// console.log(`\tExample: node main SUPERBOT2`);
// console.log(`========================================================================================`);

// if (process.argv[2] == undefined) {
//     console.log(chalk.bold.redBright.bgBlack("Please add the argument - BOT_LABEL_FOR_MQTT_TOPIC  --> EXIT"));
//     exit(0);
// } else {
//     BOT_MQTT_ID = process.argv[2];
// }

let MQTT_ENABLE = true;
//! let MQTT_BROKER='mqtt://test.mosquitto.org'
// let MQTT_BROKER='mqtt://broker.hivemq.com'

// let MQTT_TOPIC = '008hello_blEhUdcUc5rbPENZQwTU';
const MQTT_BASE_KEY = (process.env.MQTT_BASE_KEY !== undefined) ? process.env.MQTT_BASE_KEY : "add_MQTT_BASE_KEY_to_env_file";
const MQTT_BROKER = (process.env.MQTT_BROKER.toLowerCase() !== undefined) ? process.env.MQTT_BROKER : "default_broker___add_broker_to_env_file (MQTT_BROKER)";
const MQTT_TOPIC = (process.env.MQTT_TOPIC.toLowerCase() !== undefined) ? process.env.MQTT_TOPIC : "default_topic___add_topic_to_env_file";
const MQTT_SERVER_TOPIC = (process.env.MQTT_SERVER_TOPIC.toLowerCase() !== undefined) ? process.env.MQTT_SERVER_TOPIC : "default_topic___add_topic_to_env_file";
const MQTT_FOCUS_ENABLE = (process.env.MQTT_FOCUS_ENABLE !== undefined) ? process.env.MQTT_FOCUS_ENABLE : 0;
const MQTT_FOCUS_TOPIC = (process.env.MQTT_FOCUS_TOPIC !== undefined) ? process.env.MQTT_FOCUS_TOPIC : "default_focus_topic___add_focus_topic_to_env_file";
const FOCUS_TIME_TRIGGER_HOURS = (process.env.FOCUS_TIME_TRIGGER_HOURS !== undefined) ? process.env.FOCUS_TIME_TRIGGER_HOURS : 10;
// let TOPIC = '008hello_blEhUdcUc5rbPENZQwTU';
let TOPIC = MQTT_TOPIC + MQTT_BASE_KEY;
// let SERVER_TOPIC = "test_007_blEhUdcUc5rbPENZQwTU";
let SERVER_TOPIC = MQTT_SERVER_TOPIC + MQTT_BASE_KEY;
let FOCUS_TOPIC = MQTT_FOCUS_TOPIC + MQTT_BASE_KEY;
let FOCUS_TOPIC_SUB = MQTT_FOCUS_TOPIC + MQTT_BASE_KEY + "_" + BOT_MQTT_ID;

let FOCUS_TIME_TRIGGER_h = FOCUS_TIME_TRIGGER_HOURS;

console.log("----------------- ENV ----------------------------");
console.log("MQTT_BROKER=", MQTT_BROKER);
console.log("MQTT_FOCUS_ENABLE=", MQTT_FOCUS_ENABLE);
console.log("MQTT_FOCUS_TOPIC=", MQTT_FOCUS_TOPIC);
console.log("FOCUS_TOPIC_SUB=", FOCUS_TOPIC_SUB);
console.log("FOCUS_TIME_TRIGGER_h=", FOCUS_TIME_TRIGGER_h);
console.log("---------------------------------------------");

let ACC_NAME_FOR_REQUEST_FROM_SERVER = "NONE=GET_FROM_SERVER";

let client;

async function Delay_s(sec) {
    await new Promise((resolve) => setTimeout(resolve, sec * 1000));
}

async function Delay_ms(msec) {
    await new Promise((resolve) => setTimeout(resolve, msec));
}


function msgHandler_FOCUS(msg_) {
    //! {"id":"botbot","focus":"LIFE","focus_time":1657347859313,"focus_time_":1657381067545}

    console.log("*******************msg", msg_);

    if (msg_[0] !== "{") {
        console.log(chalk.bold.redBright.bgBlack("MQTT: ERROR MSG IS NOT JSON"));
        return;
    }

    try {
        let msg_o = JSON.parse(msg_)

        let bot_id = msg_o.id;
        if (bot_id == BOT_MQTT_ID) {
            mqtt_handle_data = msg_o;
            focus_gotten = true;
        } else {
            console.log("MQTT bot_id !== BOT_MQTT_ID");
        }

    } catch (error) {
        console.log("MQTT: ERROR NOT VALID MSG:", error.message);
    }
}

let TIME_TO_WAIT_FOCUS_ms = 5000;
let TIME_TO_WAIT_FOCUS_CHECK_INTERVAL_ms = 500;
let focus_gotten = false;
let mqtt_handle_data = {};


async function update_list(file_string) {
    let ret = "NG" //! OK

    let ret_data = {};
    mqtt_handle_data = {}; //! reset data
    focus_gotten = false; //! reset flag

    // setTimeout(() => {
    //     focus_gotten = true;
    // }, TIME_TO_WAIT_FOCUS_ms);

    //! send request
    // {"id":"botbot","sender_type":2,"data":"{}"}
    //! mqtt pub -t 'focus_blEhUdcUc5rbPENZQwTU' -h 'broker.hivemq.com' -m '{"id":"botbot","sender_type":3,"data":"{\"acc\":\"peoqa\"}"}'
    //! mqtt pub -t 'focus_blEhUdcUc5rbPENZQwTU' -h 'broker.hivemq.com' -m '{"id":"botbot","sender_type":4,"data":" zipped file string "}'
    let req = {
        "id": BOT_MQTT_ID,
        "sender_type": 4,
        "check": "update_cards_list",
        // "data": `{\"acc\":\"${acc_name}\"}`
        "data": ""
    }

    //! ZLIB
    //! let input = JSON.stringify(need_list);
    //! var deflated = zlib.deflateSync(input).toString('base64');
    //! var inflated = zlib.inflateSync(Buffer.from(deflated, 'base64')).toString()
    let deflated = zlib.deflateSync(file_string).toString('base64');

    req.data = deflated;

    console.log("************send mqtt msg", FOCUS_TOPIC, req);
    console.log("OOOOOOOOOOOOOOOOOOOOOOOOOOOOO");
    client.publish(FOCUS_TOPIC, JSON.stringify(req))

    let index = 0
    let cnt = TIME_TO_WAIT_FOCUS_ms / TIME_TO_WAIT_FOCUS_CHECK_INTERVAL_ms
    for (index = 0; index < cnt; index++) {
        if (focus_gotten) {
            try {
                //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                //! GET DATA FROM SERVER
                ret_data = JSON.parse(JSON.stringify(mqtt_handle_data));
                //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                if (ret_data.result == "OK") {
                    ret = "OK"
                } else {
                    ;
                }
            } catch (error) {
                console.log("Error parse mqtt_handle_data");
            }
            break;
        }
        await Delay_ms(TIME_TO_WAIT_FOCUS_CHECK_INTERVAL_ms);
        console.log(".", index);
    }
    if (index < cnt) {
        console.log("******************** index", index);
        console.log("******************** ret_data", ret_data);
    } else {
        console.log("MQTT FOCUS REQUEST TIMEOUT");
    }
    // return acc_focus;

    return ret;
}


;
(async () => {

    if (MQTT_ENABLE) {
        console.log("MQTT_ENABLE = true");

        client = mqtt.connect(MQTT_BROKER)

        try {
            client.on("error", function (error) {
                console.log(chalk.bold.redBright.bgBlack("MQTT: Can't connect" + error));

            });

            client.on('connect', function () {
                console.log(chalk.bold.greenBright.bgBlack("MQTT: connect"));
                // client.subscribe(TOPIC, function (err) {
                //     console.log(`mqtt subscribe [${TOPIC}]`);

                //     if (!err) {
                //         client.publish(TOPIC, `MQTT ${TOPIC} enabled. Loop test message`)
                //     }
                // })
                if (MQTT_FOCUS_ENABLE) {
                    client.subscribe(FOCUS_TOPIC_SUB, function (err) {
                        console.log(`mqtt subscribe [${FOCUS_TOPIC_SUB}]`);

                        if (!err) {
                            client.publish(FOCUS_TOPIC_SUB, `MQTT ${FOCUS_TOPIC_SUB} enabled. Loop test message`)
                        }
                    })
                }
            })
            client.on('message', function (topic, message) {
                //! message is Buffer
                console.log(chalk.bold.yellowBright.bgBlack(`[${topic}]-----------> MQTT: msg received [${message.toString()}] at ******* ${new Date(Date.now()).toLocaleString()} *******`))
                //   client.end()
                //! 
                // if (topic == TOPIC) {
                //     // msgHandler(message.toString());
                // } else 
                if (topic == FOCUS_TOPIC_SUB) {
                    console.log("IIIIIIIIIIIIIIIIIIIIIIIIIII");
                    msgHandler_FOCUS(message.toString());
                } else {
                    console.log("UNKNOWN TOPIC", topic);
                }
            })

        } catch (error) {
            console.log("MQTT INIT Exception: " + error.message);
        }


        // Enable graceful stop
        process.once('SIGINT', () => {
            console.log(chalk.bold.redBright.bgBlack("MQTT: unsubscribe and client end"));
            client.unsubscribe(TOPIC);
            client.end()
        })
        process.once('SIGTERM', () => {
            console.log(chalk.bold.redBright.bgBlack("MQTT: unsubscribe and client end"));
            client.unsubscribe(TOPIC);
            client.end()
        })
    } else {
        console.log("MQTT not enabled");
    }

    let ret = await update_list(rawtask); //! File_string

    if (ret == "OK") {
        console.log(`FILE [${LIST_FILE}] updated successfully`);
    } else {
        console.log(`FILE [${LIST_FILE}] updated FAILED`);
    }

    console.log(chalk.bold.redBright.bgBlack("MQTT: unsubscribe and client end"));
    client.unsubscribe(TOPIC);
    client.end()

})();