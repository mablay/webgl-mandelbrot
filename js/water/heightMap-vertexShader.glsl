// Final pass vertex shader. Sets final mesh deformation from heightmap.
// Calculates light and eye vectors and sends them to fragment shader.

uniform sampler2D heightMap;
uniform float scale;
uniform vec3 lightPos;

varying vec3 lightVec;
varying vec3 eyeVec;
varying vec2 texCoord;

void main(void)
{

    texCoord = uv;
    vec4 info = texture2D(heightMap, texCoord);

    vec3 newpos = position;

    // Multiply new height so we can actually see the difference.
    newpos.z = info.r * scale;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( newpos, 1.0 );

    vec3 n = normalize(normalMatrix * normal);
    vec3 t = normalize(normalMatrix * vec3(1.0, 0.0, 0.0));
    vec3 b = cross(n, t);

    vec3 vVertex = vec3(modelViewMatrix * vec4(newpos, 1.0)).xyz;
    vec3 tmpVec = vec3(modelViewMatrix * vec4(lightPos.x, -lightPos.z, lightPos.y, 1.0)).xyz - vVertex;

    lightVec.x = dot(tmpVec, t);
    lightVec.y = dot(tmpVec, b);
    lightVec.z = dot(tmpVec, n);

    tmpVec = -vVertex;
    eyeVec.x = dot(tmpVec, t);
    eyeVec.y = dot(tmpVec, b);
    eyeVec.z = dot(tmpVec, n);
}