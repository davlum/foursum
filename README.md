# foursum

A simple web app which lets the user add sinusoids to make a Fourier series and listen to the resulting sound.
There is a discrete fourier transform implementation that I would like to change to a fft, but as there are 
only 400 points sampled, the compute time shouldn't be too bad. However, as a result of the small number of samples, 
the dft is not the most accurate.

If you would like to run it and have python installed, you can download it, cd into that directory
and run $ python -m SimpleHTTPServer 8000 and open up localhost:8000 in your web browser. 

contact: david.lum91@gmail.com
