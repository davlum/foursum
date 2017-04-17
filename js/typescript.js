/**
 * Created by davidlum on 4/4/17.
 */
var twoPi = Math.PI * 2;
var Waves = (function () {
    function Waves() {
        this.waves = [];
        var initWave;
        initWave = new Wave();
        this.waves.push(initWave);
    }
    Waves.prototype.calcAmpSum = function () {
        this.ampSum = 0;
        for (var _i = 0, _a = this.waves; _i < _a.length; _i++) {
            var wave = _a[_i];
            this.ampSum += wave.amplitude;
        }
        return this.ampSum;
    };
    Waves.prototype.calcY = function (t) {
        var yval = 0;
        var phase;
        for (var _i = 0, _a = this.waves; _i < _a.length; _i++) {
            var wave = _a[_i];
            phase = wave.phase * Math.PI;
            if (wave.waveType == "cos") {
                phase += Math.PI / 2;
            }
            yval += wave.amplitude * Math.sin(wave.frequency * twoPi * t + phase);
        }
        return yval;
    };
    // Creates the current array of y values
    Waves.prototype.calcYVals = function (canv, sig) {
        this.yvals = [];
        canv.animCounter = 0;
        var count = 0;
        var inc = 2 / canv.width;
        for (var x = 0; x < canv.width; x++) {
            var y = this.calcY(count);
            count += inc;
            this.yvals.push(y);
            sig.signal.push(y);
        }
        this.calcAmpSum();
        for (var x = 0; x < 3 * canv.width; x++) {
            this.yvals[x] = canv.origin - this.yvals[x] / (this.ampSum) * (180);
        }
    };
    return Waves;
}());
var Signal = (function () {
    function Signal() {
    }
    // quick to write slow to run dft
    // will change to fft
    Signal.prototype.dft = function () {
        var real, imag;
        var coefs = [];
        var period = this.signal.length / 2;
        var realArr = new Float32Array(period);
        var imagArr = new Float32Array(period);
        for (var bin = 0; bin < period; bin++) {
            real = 0;
            imag = 0;
            for (var n = 0; n < period; n++) {
                real += this.signal[n] * Math.cos(-2 * Math.PI * n * bin / period);
                imag += this.signal[n] * Math.sin(-2 * Math.PI * n * bin / period);
            }
            realArr[bin] = real;
            imagArr[bin] = imag;
        }
        coefs.push(realArr);
        coefs.push(imagArr);
        return coefs;
    };
    return Signal;
}());
var Wave = (function () {
    function Wave() {
        // parseInt returns NaN on zero sometimes.
        // This function kind of deals with that.
        var getAndParse = function (id) {
            var boolOrNum = parseInt($(id).val(), 10) || true;
            if (boolOrNum === true) {
                return 0;
            }
            else {
                return boolOrNum;
            }
        };
        this.waveType = $("#wavetype").val();
        this.amplitude = getAndParse("#amp");
        this.frequency = getAndParse("#freq");
        this.phaseNum = getAndParse("#phaseNumerator");
        this.phaseDenom = getAndParse("#phaseDenominator");
        var check = function () {
            if (this.phaseNum === 0 || this.phaseDenom === 0) {
                return 0;
            }
            else {
                return this.phaseNum / this.phaseDenom;
            }
        };
        this.phase = check();
    }
    Wave.prototype.validateWave = function () {
        var test1 = function (i) { return (i < 1 || 1 > 99); };
        var test2 = function (i) { return (i < -99 || i > 99); };
        return !(test1(this.amplitude) ||
            test1(this.frequency) ||
            test2(this.phaseDenom) ||
            test2(this.phaseNum));
    };
    return Wave;
}());
var Canvas = (function () {
    function Canvas() {
        this.animCounter = 0;
        this.height = 400;
        this.width = this.height * 2;
        this.origin = this.height / 2;
        this.canvas = document.createElement('canvas');
        this.canvas.innerHTML = "Browser does not support Canvas";
        this.ctx = this.canvas.getContext("2d");
    }
    // Plots the axis.
    Canvas.prototype.plotGraph = function () {
        this.ctx.beginPath();
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = 'black';
        this.ctx.moveTo(0, (this.origin));
        this.ctx.lineTo(this.width, (this.origin));
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(0, this.height);
        this.ctx.stroke();
    };
    // Plots the Wave
    Canvas.prototype.plotWave = function (arr) {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.plotGraph();
        this.ctx.beginPath();
        this.ctx.moveTo(0, arr[this.animCounter]);
        for (var x = 0; x < this.width; x++) {
            this.ctx.lineTo(x, arr[(x + this.animCounter) % this.width]);
        }
        this.animCounter += 1;
        if (this.animCounter > 799) {
            this.animCounter = 0;
        }
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = '#4a7056';
        this.ctx.stroke();
    };
    return Canvas;
}());
var Initializer = (function () {
    function Initializer() {
        this.clearDiv = document.getElementById("clearDiv");
        this.form = document.getElementById("form"); // the form
        this.ws = new Waves();
        this.canvas = new Canvas();
        this.audio = new AudioButton();
        // Adds a waveform to waves[] and then plots it.
        // Does nothing if input is no bueno.
        var addWave = function (event) {
            event.preventDefault(); // prevents page from reloading automatically
            var wave = new Wave();
            if (wave.validateWave()) {
                console.log("bad Inputs.");
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
    Initializer.prototype.init = function () {
        this.ws.calcYVals(this.canvas, this.audio.signal);
        clearInterval(this.intervalID);
        this.intervalID = setInterval(function () {
            this.canvas.plotWave(this.waves.yvals);
        }, 40);
    };
    // creates the set of buttons to clear individual waveforms
    Initializer.prototype.clearForm = function () {
        while (this.clearDiv.firstChild) {
            this.clearDiv.removeChild(this.clearDiv.firstChild);
        }
        this.ws.calcAmpSum();
        var Idcounter = 0;
        for (var _i = 0, _a = this.ws.waves; _i < _a.length; _i++) {
            var w = _a[_i];
            var text = void 0;
            text = Math.round((w.amplitude / this.ws.ampSum) * 100) / 100 + " \xD7 " + w.waveType + "(" + w.frequency + " \xD7 " + "2\u03C0t";
            if (w.phase != 0 && (w.phaseNum != w.phaseDenom)) {
                text = text + " + " + w.phaseNum + "\u03C0/" + w.phaseDenom + ")";
            }
            else {
                text = text + ")";
            }
            var newp = document.createElement("button");
            var br = document.createElement("br");
            newp.id = Idcounter.toString();
            var tnode = document.createTextNode(text);
            newp.appendChild(tnode);
            newp.addEventListener("click", function (event) {
                this.ws.waves.splice(parseInt(event.target.id), 1);
                this.clearForm();
                this.init();
            });
            Idcounter++;
            this.clearDiv.appendChild(newp);
            this.clearDiv.appendChild(br);
        }
    };
    return Initializer;
}());
var AudioButton = (function () {
    function AudioButton() {
        this.play = document.getElementById("playsound"); // playing the sound
        this.signal = new Signal();
        //button for play Sound with Gain envelope
        this.play.addEventListener("submit", function (event) {
            if (this.ac !== undefined) {
                this.ac.close();
            }
            event.preventDefault();
            var getAndParse = function () {
                var freq = parseInt($("#userFreq").val(), 10) || true;
                if (freq === true || freq < 100 || freq > 2000) {
                    freq = 220;
                }
                return freq;
            };
            this.freq = getAndParse();
            var coefs = this.signal.dft();
            this.ac = new AudioContext();
            var osc = this.ac.createOscillator();
            var wave = this.ac.createPeriodicWave(coefs[0], coefs[1]);
            osc.setPeriodicWave(wave);
            osc.frequency.value = this.freq;
            var gainNode = this.ac.createGain();
            osc.connect(gainNode);
            gainNode.connect(this.ac.destination);
            gainNode.gain.setValueAtTime(0, this.ac.currentTime);
            osc.start();
            gainNode.gain.linearRampToValueAtTime(1, this.ac.currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, this.ac.currentTime + 4);
            osc.stop(4);
        });
    }
    return AudioButton;
}());
// run this shit
$(document).ready(function () {
    var init;
    init = new Initializer();
    init.init();
    init.clearForm();
});
