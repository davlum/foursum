# foursum

A simple web app which lets the user add sinusoids to make a Fourier series and listen to the resulting sound. 
There is a discrete fourier transform implementation that I would like to change to a fft, but as there are only 
400 points sampled, the compute time shouldn't be too bad. However, as a result of the small number of samples, 
the dft is not the most accurate.

Things I would like to add are an animation of the unit circle developing the the sum of the sines waves, something 
like this; http://treeblurb.com/dev_math/sin_canv00.html.
Also an array specifically for the dft with higher sampling rate,and a method to sort the waves submitted by the user either by
amplitude, frequency, or phase. Maybe try to make the page look like it was built sometime after 1995 as well. 

If you would like to run it and have python installed, you can download it, cd into that directory
and run $ python -m SimpleHTTPServer 8000 and open up localhost:8000 in your web browser. 

contact: david.lum91@gmail.com
