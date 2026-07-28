#version 330

/* Shader taken from: https://www.shadertoy.com/view/XsjSzR
 * Original Author: Timothy Lottes
 *
 * Translated to GLSL 330 by Google Gemini.
 */

// Input vertex attributes (from vertex shader)
in vec2 fragTexCoord;
in vec4 fragColor;

// Input uniform values
uniform sampler2D texture0;
uniform vec4 colDiffuse;

// Output fragment color
out vec4 finalColor;

// Custom uniforms
uniform vec2 resolution; // Screen resolution

// --- CRT Shader Parameters ---
const float hardScan  = -8.0;    // -8.0 = soft, -16.0 = medium
const float hardPix   = -3.0;    // -2.0 to -4.0
const vec2  warp      = vec2(1.0/32.0, 1.0/24.0); // 0 = none, 1.0/8.0 = extreme
const float maskDark  = 0.9;     // 0.5 to 1.0
const float maskLight = 1.1;     // 1.5 to 2.5

// --- CRT Functions ---

// Nearest emulated sample given floating point position and texel offset.
// Also zero's off screen.
vec3 Fetch(vec2 pos, vec2 off) {
    pos = floor(pos * resolution + off) / resolution;
    if (max(abs(pos.x - 0.5), abs(pos.y - 0.5)) > 0.5) return vec3(0.0, 0.0, 0.0);
    return texture(texture0, pos.xy + vec2(0.5) / resolution).rgb;
}

// Distance in emulated pixels to nearest texel.
vec2 Dist(vec2 pos) {
    pos = pos * resolution;
    return -((pos - floor(pos)) - vec2(0.5));
}

// 1D Gaussian.
float Gaus(float pos, float scale) {
    return exp2(scale * pos * pos);
}

// 3-tap Gaussian filter along horz line.
vec3 Horz3(vec2 pos, float off) {
    vec3 b = Fetch(pos, vec2(-1.0, off));
    vec3 c = Fetch(pos, vec2( 0.0, off));
    vec3 d = Fetch(pos, vec2( 1.0, off));
    float dst = Dist(pos).x;
    
    // Convert distance to weight.
    float scale = hardPix;
    float wb = Gaus(dst - 1.0, scale);
    float wc = Gaus(dst + 0.0, scale);
    float wd = Gaus(dst + 1.0, scale);
    
    // Return filtered sample.
    return (b * wb + c * wc + d * wd) / (wb + wc + wd);
}

// Return scanline weight.
float Scan(vec2 pos, float off) {
    float dst = Dist(pos).y;
    return Gaus(dst + off, hardScan);
}

// Allow nearest three lines to effect pixel.
vec3 Tri(vec2 pos) {
    vec3 a = Horz3(pos, -1.0);
    vec3 b = Horz3(pos,  0.0);
    vec3 c = Horz3(pos,  1.0);
    
    float wa = Scan(pos, -1.0);
    float wb = Scan(pos,  0.0);
    float wc = Scan(pos,  1.0);
    
    return a * wa + b * wb + c * wc;
}

// Distortion of scanlines, and end of screen alpha.
vec2 Warp(vec2 pos) {
    pos = pos * 2.0 - 1.0;
    pos *= vec2(1.0 + (pos.y * pos.y) * warp.x, 1.0 + (pos.x * pos.x) * warp.y);
    return pos * 0.5 + 0.5;
}

// Shadow mask.
vec3 Mask(vec2 pos) {
    pos.x += pos.y * 3.0;
    vec3 mask = vec3(maskDark, maskDark, maskDark);
    pos.x = fract(pos.x / 6.0);
    if (pos.x < 0.333) mask.r = maskLight;
    else if (pos.x < 0.666) mask.g = maskLight;
    else mask.b = maskLight;
    return mask;
}

void main() {
    vec2 pos = Warp(fragTexCoord);
    
    // Un-comment to disable warp (and use standard UVs)
    // pos = fragTexCoord;

    // Check if we are fetching outside the warped screen area
    // (Warp puts valid coordinates in 0.0 to 1.0)
    // if (pos.x < 0.0 || pos.x > 1.0 || pos.y < 0.0 || pos.y > 1.0) {
    //     finalColor = vec4(0.0, 0.0, 0.0, 1.0);
    //     return;
    // }

    // Apply the CRT effect
    vec3 col = Tri(pos) * Mask(fragTexCoord * resolution);
    
    // Add simple vignette (optional, often pairs well with Warp)
    float vignette = 1.0 - dot(pos - 0.5, pos - 0.5);
    col *= smoothstep(0.0, 1.0, vignette);

    // Apply brightness to compensate for scanline darkness
    col = pow(col, vec3(1.0 / 2.2)); // Gamma correction if needed, or just brighten
    col *= 1.2; // boost brightness

    finalColor = vec4(col, 1.0);
}
