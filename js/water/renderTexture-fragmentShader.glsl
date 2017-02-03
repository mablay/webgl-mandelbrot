// Render texture fragment shader. Runs a simulation step.

uniform sampler2D texture;
uniform vec2 delta, mousePoint;
uniform int mouseActive;
uniform float damping, strength, radius;

varying vec2 vUv;
const float v = 3.14159;

void main()
{
    // get current frag value
    vec4 info = texture2D(texture, vUv);

    // Draw ripples with mouse
    if(mouseActive >= 1)
    {
        float m = max(0.0, 1.0 - length(vec2(mousePoint.x, 1.0 - mousePoint.y) - vUv) / radius);
        m = 0.5 -cos(m * v) * 0.5;
        info.r -= m * strength;
    }

    // Main wave propagation
    vec2 dx = vec2(delta.x, 0.0);
    vec2 dy = vec2(0.0, delta.y);
    float average = (
        texture2D(texture, vUv - dx).r +
        texture2D(texture, vUv - dy).r +
        texture2D(texture, vUv + dx).r +
        texture2D(texture, vUv + dy).r
    ) * 0.25;
    info.g += (average - info.r) * 2.0;

    // attenuate the velocity a little so waves do not last forever
    info.g *= damping;

    // move the vertex along the velocity
    info.r += info.g;

    // damp the final value
    info.r *= damping;

    // set the new vertex height (VS uses color to determine height)
    gl_FragColor = info;
}