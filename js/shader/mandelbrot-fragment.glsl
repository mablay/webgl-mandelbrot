precision highp float;
varying vec2 pos;
varying vec2 distort;
void main () {
    const int MAX_ITERATION = 50;
    vec2 fractal = pos;
    float dist = 0.0;
    for (int i=0; i < MAX_ITERATION; i++) {
        // Iterate
        fractal = distort + vec2(
            fractal.x * fractal.x - fractal.y * fractal.y,
            2.0 * fractal.x * fractal.y
        );

        // interpolate fractal color over position
        float radius = length(fractal);
        dist += radius;
//        float b1 = float(i) / 50.0;
//        b1 = clamp(float(i) / float(MAX_ITERATION), 0.0, 1.0);
        float b1 = max((float(i) + 1.0 - log(log(radius))/log(2.0)) / float(MAX_ITERATION/4), 0.0);
        float b2 = mod(b1 + 1.0, 1.0);
        gl_FragColor = vec4(b1, b1, b1, 1);

        // Break condition
        if (length(fractal) > 4.0) {
            break;
        }
        if (i == MAX_ITERATION - 1) {
            gl_FragColor = vec4(1.0,1.0,1.0,1.0);
        }
    }
}
