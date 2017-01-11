precision highp float;
varying vec2 pos;
void main () {
    const int MAX_ITERATION = 50;
    vec2 fractal = pos;
    for (int i=0; i < MAX_ITERATION; i++) {
        fractal = pos + vec2(
            fractal.x * fractal.x - fractal.y * fractal.y,
            2.0 * fractal.x * fractal.y
        );

        // interpolate fractal color over position
        float b = float(i) / 50.0;
        gl_FragColor = vec4(b, b, b, 1);
        if (length(fractal) > 4.0) {
            break;
        }
        if (i == MAX_ITERATION - 1) {
            gl_FragColor = vec4(0.0,0.0,0.0,1.0);
        }
    }
}
