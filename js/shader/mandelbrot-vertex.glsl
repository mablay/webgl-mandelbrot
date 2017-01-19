precision highp float;
uniform float zoom;
uniform vec2 julia;
varying vec2 pos;
varying vec2 distort;
void main () {
    distort = julia;
    //julia.x += .01;// = vec2( julia.x + 0.1 , julia.y );
    pos = (position.xy + vec2(-0.0  , 0.0)) * zoom;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}