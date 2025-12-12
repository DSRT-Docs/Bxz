// src/wasm/dsrt.cpp
#include <stdint.h>
#include <math.h>
#include <string.h>

extern "C" {

// scalar ops
double dsrt_add(double a, double b) {
    return a + b;
}

double dsrt_dot3(double ax, double ay, double az, double bx, double by, double bz) {
    return ax*bx + ay*by + az*bz;
}

double dsrt_length3(double x, double y, double z) {
    return sqrt(x*x + y*y + z*z);
}

// write cross product into out pointer (assumed double* of length 3)
void dsrt_cross(double ax, double ay, double az, double bx, double by, double bz, double* out) {
    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
}

// normalize vec3 into out pointer
void dsrt_normalize(double x, double y, double z, double* out) {
    double len = sqrt(x*x + y*y + z*z);
    if (len == 0.0) { out[0]=0; out[1]=0; out[2]=0; return; }
    out[0] = x / len;
    out[1] = y / len;
    out[2] = z / len;
}

// matrix4 multiply: a(16) * b(16) -> out(16)
void dsrt_mat4_mul(const double* a, const double* b, double* out) {
    for (int r=0;r<4;r++) {
        for (int c=0;c<4;c++) {
            double s = 0.0;
            for (int k=0;k<4;k++) {
                s += a[r*4 + k] * b[k*4 + c];
            }
            out[r*4 + c] = s;
        }
    }
}

// set identity matrix into out(16)
void dsrt_mat4_identity(double* out) {
    for (int i=0;i<16;i++) out[i]=0.0;
    out[0]=1; out[5]=1; out[10]=1; out[15]=1;
}

// transpose matrix (in -> out)
void dsrt_mat4_transpose(const double* in, double* out) {
    for (int r=0;r<4;r++)
        for (int c=0;c<4;c++)
            out[c*4 + r] = in[r*4 + c];
}

} // extern "C"
