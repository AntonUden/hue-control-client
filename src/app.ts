import Client from "./Client";
import IConfiguration from "./IConfiguration";

require('console-stamp')(console, '[HH:MM:ss.l]');

const config: IConfiguration = require("../config.json");

new Client(config);