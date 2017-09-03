import Store from './Store';
import VCO from './VCO';
import VCF from './VCF';
import VCA from './VCA';
import Delay from './Delay';
import Keyboard from './Keyboard';
import Controls from './Controls';

import { interfaceSettings } from './_interfaceSettings';
import { defaultSettings as settings } from './_settings';


export default class Synth {
	constructor() {

		try {
			window.AudioContext = window.AudioContext || window.webkitAudioContext;
			this.context = new AudioContext();
		}
		catch (e) {
			alert('Web Audio API is not supported in this browser');
			return;
		};

		this.store = new Store(settings);


		// creating controls
		this.controls = [];

		interfaceSettings.map(item => {
			this.controls.push(
				new Controls(
					item,
					this.store.changeParam
				)
			);
		});


		this.VCOs = {};

		// creating keyboard and bindings
		this.keyboard = new Keyboard(
			{
				id: 'keyboard'
			},
			// 'keyPressed' event callback
			(note, freq) => {
				if (this.VCOs[note]) {
					this.VCOs[note].play(freq);
				} else {
					let newVCO = new VCO(this.context, note, this.VCF);

					// creating osclillators for every key(note)
					// and binding it with settings store
					Object.keys(newVCO.oscillators).forEach(oscName => {
						['gain', 'detune', 'wavetype'].forEach(paramName => {
							this.store.subscribe(
								`${oscName}__${paramName}`,
								() => newVCO.set(
									oscName,
									paramName,
									this.store.settings[`${oscName}__${paramName}`]
								)
							)
						});
					});

					this.VCOs = Object.assign({}, this.VCOs, {
						[note]: newVCO
					});
					this.VCOs[note].play(freq);
				}
			},
			// 'keyUp' event callback
			(note, freq) => {
				if (this.VCOs[note]) {
					this.VCOs[note].stop(); // stop oscillators
				}
			}
		);


		// creating filter 
		this.VCF = new VCF(this.context);
		this.store.subscribe(
			'filter__freq',
			() => this.VCF.setFrequency(this.store.settings['filter__freq'])
		);
		this.store.subscribe(
			'filter__qual',
			() => this.VCF.setQ(this.store.settings['filter__qual'])
		);


		// creating delay
		this.Delay = new Delay(this.context);
		['gain', 'time', 'feedback', 'cutoff'].map(paramName => {
			this.store.subscribe(
				`delay__${paramName}`,
				() => this.Delay.set(paramName, this.store.settings[`delay__${paramName}`])
			)
		});

	
		this.init();
	}


	init = () => {

		// connections
		this.VCF.connect(this.Delay);
		this.VCF.connect(this.context.destination);
		this.Delay.connect(this.context.destination);
	
	}
}