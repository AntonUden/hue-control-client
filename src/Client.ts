import * as io from 'socket.io-client';
import IConfiguration from './IConfiguration';
import { v3 } from 'node-hue-api';
import { Api } from "node-hue-api/dist/esm/api/Api";
import { Groups } from "node-hue-api/dist/esm/api/Groups";
import { LocalBootstrap } from "node-hue-api/dist/esm/api/http/LocalBootstrap";
import { rgbToXY } from './RGB';

const GroupLightState = require('node-hue-api').v3.model.lightStates.GroupLightState;

export default class Client {
	private api: Api;
	private configuration: IConfiguration;
	private socket;

	private GAMUT_A = {
		red: { x: 0.704, y: 0.296 },
		green: { x: 0.2151, y: 0.7106 },
		blue: { x: 0.138, y: 0.08 }
	};


	constructor(config: IConfiguration) {
		this.configuration = config;
		let localBootstrap: LocalBootstrap = v3.api.createLocal(config.bridge_ip);

		localBootstrap.connect(config.bridge_username).then((api) => {
			this.api = api;
			console.log("Hue API connected");

			this.setRGB(255, 0, 0);
		});

		this.socket = io.connect(config.url);

		this.socket.on('connect', () => {
			console.log('Successfully connected to the socket');
		});

		this.socket.on('color', (data) => {
			console.log("Someone requested R: " + data.r + " G: " + data.g + " B: " + data.b);
			this.setRGB(data.r, data.g, data.b);
		});
	}

	async setRGB(r: number, g: number, b: number) {
		const groups = await this.api.groups.getAll();
		const group = groups.find(group => group.name == this.configuration.light_group);

		if (group != null) {
			const [x, y] = rgbToXY([r, g, b], this.GAMUT_A);
			const state = new v3.model.lightStates.GroupLightState().on().xy(x, y);
			this.api.groups.setGroupState(group, state);
		} else {
			console.log("Error: cant find group: " + this.configuration.light_group);
		}
	}
}