// Normal map fragment shader. Outputs to normalMap.

uniform float height;
uniform vec2 delta;
uniform sampler2D texture;

varying vec2 vUv;

void main() {

    float val = texture2D( texture, vUv ).r;

    float valU = texture2D( texture, vUv + vec2( delta.x, 0.0 ) ).r;
    float valV = texture2D( texture, vUv + vec2( 0.0, delta.y ) ).r;

    gl_FragColor = vec4( ( 0.5 * normalize( vec3( val - valU, val - valV, height ) ) + 0.5 ), 1.0 );

}
