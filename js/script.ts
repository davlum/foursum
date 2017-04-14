/**
 * Created by davidlum on 4/4/17.
 */
document.addEventListener("DOMContentLoaded", function(event) {

    var twoPi = Math.PI*2
    var canvas = document.getElementById("canv");
    var ctx = canvas.getContext("2d");
    canvas.height = h = 400;
    canvas.width = w = 2*h;
    ctx.translate(0.5, 0.5); // unsure if makes lines clearer
    var yOrig = h/2 //center of canvas
    var ampSum; // sum of the amplitude values
    var animCounter; // counter for the animator
    var div = document.getElementById("clearDiv"); // the div of clear buttons
    var form = document.getElementById("form"); // the canvas
    var play = document.getElementById("playsound"); // playing the sound
    var intervalID; // the id of the current animation so we can clear it
    var signal = []; // for the dft
    var userFreq; // freq of sound played
    var ac; // audiocontext


    //2d array of type [[String][Intx5]]
    // wave[0], amp[1], freq[2], phaseNumerator[4], phaseDenomitor[5]
    // Starts off with a sin wave
    //javascript wouldnt parse my zeros, so we get true
    var modArrSet = [["sin", 1, 1, true, true]];

    // Calculates the y value for a given point
    function yvalue(mas, t) {
        var yval = 0;
        for (var i = 0; i < mas.length; i++){
            var cosPhase = 0;
            var phase = 0;
            if (mas[i][3] !== true && mas[i][4] !== true) {
                phase = mas[i][3]/mas[i][4];
                console.log(phase);
            }
            if (mas[i][0] === "cos") { cosPhase = Math.PI/2; }
            yval += mas[i][1] * Math.sin(mas[i][2] * (2*Math.PI * t) +
                    (phase *  Math.PI) + cosPhase);
        }
        return yval;
    }

    // creates the set of buttons to clear individual waveforms
    function clearForm() {
        while(div.firstChild) {
            div.removeChild(div.firstChild);
        }
        ampSum = 0;
        for (var i = 0; i < modArrSet.length; i++) {
            ampSum += modArrSet[i][1];
        }
        for (var i = 0; i < modArrSet.length; i++) {
            var text = Math.round((modArrSet[i][1]/ampSum)*100)/100+" \xD7 "+ modArrSet[i][0]+"("+modArrSet[i][2]+" \xD7 "+"2\u03C0t";
            if (modArrSet[i][3] !== true && modArrSet[i][4] !== true && modArrSet[i][3] !== modArrSet[i][4]) {
                text = text+" + "+modArrSet[i][3]+"\u03C0/"+modArrSet[i][4]+")";
            }
            else {
                text = text + ")";
            }
            var newp = document.createElement("button");
            var br = document.createElement("br");
            newp.id = i.toString();
            var tnode = document.createTextNode(text);
            newp.appendChild(tnode);
            newp.addEventListener("click", function(event) {
                modArrSet.splice(parseInt(event.target.id), 1);
                clearForm();
                init(yArr());
            });
            div.appendChild(newp);
            div.appendChild(br);
        }
    }

    // Adds a waveform to the modArrSet and then plots it.
    // Does nothing if input is no bueno
    var addWave = function(event) {
        event.preventDefault(); // prevents page from reloading automatically
        var modArr = [];
        var addToArr = function(id) {
            var parsedInt = parseInt((document.getElementById(id).value), 10) || true;
            modArr.push(parsedInt);
        }
        var check = function() {
            for (var i = 0; i < 3 ; i++) {
                if (modArr[i] === true || modArr[i] < 1 || modArr[i] > 99) {
                    return true;
                }
            }
            for (var j = 3; j < 5; j++) {
                if (modArr[j] !== true && modArr[j] < 1 || modArr[j] > 99) {
                    modArr[j] = true;
                }
            }
            return false;
        };
        var wavetype = document.getElementById("wavetype").value;
        modArr.push(wavetype);
        addToArr("amp");
        addToArr("freq");
        addToArr("phaseNumerator");
        addToArr("phaseDenominator");
        if (check()) {
            console.log("bad inputs");
        }
        else {
            modArrSet.push(modArr);
            clearForm();
            init(yArr());
        }
    };

    // Creates the current array of y values
    function yArr() {
        animCounter = 0; // start Animation from beginning;
        var yArr = [];
        signal.length = 0;
        var inc = 2/w;
        var count = 0;
        ampSum = 0;
        for (var x = 0; x < w; x++){
            y = yvalue(modArrSet, count);
            count += inc;
            yArr.push(y);
            signal.push(y)
        }
        for (var i = 0; i < modArrSet.length; i++) {
            ampSum += modArrSet[i][1];
        }
        for (x = 0; x < 3*w; x++){
            yArr[x] = yOrig - yArr[x]/(ampSum)*(180);
        }
        return yArr;
    }

    // Plots the axes
    function graph() {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'black';
        ctx.moveTo(0, (yOrig));
        ctx.lineTo(w,(yOrig));
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.lineTo(0,h);
        ctx.stroke();
    }

    // starts the animation
    function init(arr) {
        clearInterval(intervalID);
        intervalID = setInterval(function(){plotWave(arr)}, 40);
    }

    // Plots the Wave
    function plotWave(arr){
        ctx.clearRect(0, 0, w, h);
        graph();
        ctx.beginPath();
        ctx.moveTo(0, arr[animCounter]);
        for (var x = 0; x < w; x++){
            ctx.lineTo(x, arr[(x + animCounter) % w]);
        }
        animCounter += 1;
        if (animCounter > 799) { animCounter = 0;}
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#4a7056';
        ctx.stroke();
    }

// ----------------------------------run this shit

    init(yArr());
    form.addEventListener("submit", addWave, true);
    clearForm();

    // quick to write slow to run dft
    // will change to fft
    function dft(sig) {
        var real,
            imag;
        var coefs = [];
        var period = sig.length/2;
        var realArr = new Float32Array(period);
        var imagArr = new Float32Array(period);
        for (var bin = 0; bin < period; bin++) {
            real = 0;
            imag = 0;
            for (var n = 0; n < period; n++) {
                real += sig[n] * Math.cos(-2*Math.PI*n*bin/period);
                imag += sig[n] * Math.sin(-2*Math.PI*n*bin/period);
            }
            realArr[bin] = real;
            imagArr[bin] = imag;
        }
        coefs.push(realArr);
        coefs.push(imagArr);
        return coefs;
    }


    //button for play Sound with Gain envelope
    play.addEventListener("submit", function(event) {
        if (ac !== undefined) { ac.close(); }
        event.preventDefault();
        userFreq = parseInt((document.getElementById("userFreq").value), 10) || true;
        if (userFreq === true || userFreq < 100 || userFreq > 2000) {
            userFreq = 220;
        }
        var coefs = dft(signal);
        var real = new Float32Array(2);
        var imag = new Float32Array(2);
        ac = new AudioContext();
        var osc = ac.createOscillator();
        var wave = ac.createPeriodicWave(coefs[0], coefs[1]);
        osc.setPeriodicWave(wave);
        osc.frequency.value = userFreq;
        var gainNode = ac.createGain();
        osc.connect(gainNode);
        gainNode.connect(ac.destination);
        gainNode.gain.setValueAtTime(0, ac.currentTime);
        osc.start();
        gainNode.gain.linearRampToValueAtTime(1, ac.currentTime+0.1);
        gainNode.gain.linearRampToValueAtTime(0, ac.currentTime+4);
        osc.stop(4);
    });

});
