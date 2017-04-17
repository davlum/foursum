/**
 * Created by davidlum on 4/4/17.
 */

const twoPi = Math.PI*2;

class Waves {
    waves: Wave[] = [];
    yvals: number[];
    ampSum: number;

    constructor() {
        let initWave: Wave;
        initWave = new Wave();
        this.waves.push(initWave);
    }

    calcAmpSum() : number {
        this.ampSum = 0;
        for (let wave of this.waves) {
            this.ampSum += wave.amplitude;
        }
        return this.ampSum;
    }

    calcY(t: number) : number {
        var yval = 0;
        let phase: number;
        for (let wave of this.waves) {
            phase = wave.phase * Math.PI;
            if (wave.waveType == "cos") {
                phase += Math.PI/2;
            }
            yval += wave.amplitude * Math.sin(wave.frequency * twoPi * t + phase)
        }
        return yval
    }

    // Creates the current array of y values
    calcYVals(canv: Canvas, sig: Signal) : void {
        this.yvals = [];
        canv.animCounter = 0;
        let count = 0;
        let inc = 2/ canv.width;
        for (let x = 0; x < canv.width; x++){
            let y = this.calcY(count);
            count += inc;
            this.yvals.push(y);
            sig.signal.push(y);
        }
        this.calcAmpSum();
        for (let x = 0; x < 3*canv.width; x++){
            this.yvals[x] = canv.origin - this.yvals[x]/(this.ampSum)*(180);
        }
    }
}

class Signal {
    signal: number[];

    // quick to write slow to run dft
    // will change to fft
    dft() : number[] {
        let real,
            imag: number;
        let coefs = [];
        let period = this.signal.length/2;
        let realArr = new Float32Array(period);
        let imagArr = new Float32Array(period);
        for (var bin = 0; bin < period; bin++) {
            real = 0;
            imag = 0;
            for (var n = 0; n < period; n++) {
                real += this.signal[n] * Math.cos(-2*Math.PI*n*bin/period);
                imag += this.signal[n] * Math.sin(-2*Math.PI*n*bin/period);
            }
            realArr[bin] = real;
            imagArr[bin] = imag;
        }
        coefs.push(realArr);
        coefs.push(imagArr);
        return coefs;
    }

}

class Wave {
    waveType: string;
    amplitude: number;
    frequency: number;
    phaseNum: number;
    phaseDenom: number;
    phase: number;

    constructor() {

        // parseInt returns NaN on zero sometimes.
        // This function kind of deals with that.
        let getAndParse = function(id: string) : number {
            let boolOrNum = parseInt($(id).val(), 10) || true;
            if (boolOrNum === true) {
                return 0;
            } else {return boolOrNum; }
        };

        this.waveType = $("#wavetype").val();
        this.amplitude = getAndParse("#amp");
        this.frequency = getAndParse("#freq");
        this.phaseNum =  getAndParse("#phaseNumerator");
        this.phaseDenom = getAndParse("#phaseDenominator");

        let check = function() : number {
            if (this.phaseNum === 0 || this.phaseDenom === 0) {
                return 0; }
            else {
                return this.phaseNum/this.phaseDenom; }
        };

        this.phase = check();
    }

    validateWave() : boolean {
        let test1 = function(i: number) { return (i < 1 || 1 > 99) };
        let test2 = function(i: number) { return (i < -99 || i > 99) };
        return !(test1(this.amplitude) ||
                 test1(this.frequency) ||
                 test2(this.phaseDenom) ||
                 test2(this.phaseNum))
    }
}

class Canvas {

    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    animCounter: number = 0;
    readonly height: number = 400;
    readonly width: number = this.height*2;
    readonly origin: number = this.height/2;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.innerHTML = "Browser does not support Canvas";
        this.ctx = this.canvas.getContext("2d");
    }

    // Plots the axis.
    plotGraph() : void {
        this.ctx.beginPath();
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = 'black';
        this.ctx.moveTo(0, (this.origin));
        this.ctx.lineTo(this.width,(this.origin));
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(0,0);
        this.ctx.lineTo(0,this.height);
        this.ctx.stroke();
    }

    // Plots the Wave
    plotWave(arr) : void {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.plotGraph();
        this.ctx.beginPath();
        this.ctx.moveTo(0, arr[this.animCounter]);
        for (var x = 0; x < this.width; x++){
            this.ctx.lineTo(x, arr[(x + this.animCounter) % this.width]);
        }
        this.animCounter += 1;
        if (this.animCounter > 799) { this.animCounter = 0;}
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = '#4a7056';
        this.ctx.stroke();
    }

}

class Initializer {
    ws: Waves;
    canvas: Canvas;
    audio: AudioButton;
    intervalID: number; // the id of the current animation so we can clear it
    clearDiv: HTMLElement = document.getElementById("clearDiv");
    form: HTMLElement = document.getElementById("form"); // the form

    constructor(){
        this.ws = new Waves();
        this.canvas = new Canvas();
        this.audio = new AudioButton();


        // Adds a waveform to waves[] and then plots it.
        // Does nothing if input is no bueno.
        let addWave = function(this: Initializer, event: any) {
            event.preventDefault(); // prevents page from reloading automatically
            let wave = new Wave();

            if (wave.validateWave()) {
                console.log("bad Inputs.")
            }
            else {
                this.ws.waves.push(wave);
                this.clearForm();
                this.init();
            }
        };
        this.form.addEventListener("submit", addWave, true);
    }
    
    // starts the animation
    init() : void {
        this.ws.calcYVals(this.canvas, this.audio.signal);
        clearInterval(this.intervalID);
        this.intervalID = setInterval(function(){
            this.canvas.plotWave(this.waves.yvals)
        }, 40);
    }

    // creates the set of buttons to clear individual waveforms
    clearForm() : void {
        while (this.clearDiv.firstChild) {
            this.clearDiv.removeChild(this.clearDiv.firstChild);
        }
        this.ws.calcAmpSum();
        let Idcounter = 0;
        for (let w of this.ws.waves) {
            let text: string;
            text = Math.round((w.amplitude/this.ws.ampSum)*100)/100+" \xD7 "+ w.waveType + "("+ w.frequency +" \xD7 "+"2\u03C0t";
            if (w.phase != 0 && (w.phaseNum != w.phaseDenom)) {
                text = text+" + "+w.phaseNum+"\u03C0/"+w.phaseDenom+")";
            } else {
                text = text + ")";
            }

            let newp = document.createElement("button");
            let br = document.createElement("br");
            newp.id = Idcounter.toString();
            let tnode = document.createTextNode(text);
            newp.appendChild(tnode);
            newp.addEventListener("click", function(this: Initializer, event: any) {
                this.ws.waves.splice(parseInt((<HTMLElement>event.target).id), 1);
                this.clearForm();
                this.init();
            });
            Idcounter++;
            this.clearDiv.appendChild(newp);
            this.clearDiv.appendChild(br);
        }
    }
}


class AudioButton {
    play: HTMLElement = document.getElementById("playsound"); // playing the sound
    ac: AudioContext;
    freq: number;
    signal: Signal;

    constructor(){
        this.signal = new Signal();
        //button for play Sound with Gain envelope
        this.play.addEventListener("submit", function(this: AudioButton, event: any) {
            if (this.ac !== undefined) { this.ac.close(); }
            event.preventDefault();
            let getAndParse = function() {
                let freq = parseInt($("#userFreq").val(), 10) || true;
                if (freq === true || freq < 100 || freq > 2000) {
                    freq = 220;
                }
                return freq;
            };
            this.freq = getAndParse();
            let coefs = this.signal.dft();
            this.ac = new AudioContext();
            let osc = this.ac.createOscillator();
            let wave = this.ac.createPeriodicWave(coefs[0], coefs[1]);
            osc.setPeriodicWave(wave);
            osc.frequency.value = this.freq;
            var gainNode = this.ac.createGain();
            osc.connect(gainNode);
            gainNode.connect(this.ac.destination);
            gainNode.gain.setValueAtTime(0, this.ac.currentTime);
            osc.start();
            gainNode.gain.linearRampToValueAtTime(1, this.ac.currentTime+0.1);
            gainNode.gain.linearRampToValueAtTime(0, this.ac.currentTime+4);
            osc.stop(4);
        });
    }
}


// run this shit
$(document).ready(function(){
    let init: Initializer;
    init = new Initializer();
    init.init();
    init.clearForm();
});
