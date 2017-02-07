// Render texture vertex shader. Does not modify anything.

varying vec2 vUv;

void main()
{
    vUv = uv;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
