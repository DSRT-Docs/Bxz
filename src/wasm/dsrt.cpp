// src/wasm/dsrt.cpp
#include <stdint.h>
#include <math.h>

extern "C" {

// contoh fungsi math cepat (skalar)
double dsrt_add(double a, double b) {
    return a + b;
}

// dot product 3 elements (menerima 6 double - sederhana tanpa pointer)
// NOTE: untuk pointer/array, butuh glue cwrap / memory handling; ini contoh sederhana:
double dsrt_dot3(double ax, double ay, double az, double bx, double by, double bz) {
    return ax*bx + ay*by + az*bz;
}

// compute length of vec3 (skalar args)
double dsrt_length3(double x, double y, double z) {
    return sqrt(x*x + y*y + z*z);
}

} // extern "C"
