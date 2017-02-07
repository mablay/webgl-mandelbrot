// Final pass fragment shader. Uses normal map and light/eye positions to determine
// final shaded color. Adds ambient lighting and specular highlights.

uniform sampler2D colorMap;
uniform sampler2D normalMap;
uniform float invRadius;
uniform vec3 ambient;
uniform vec3 diffuse;
uniform vec3 specular;
uniform float alpha;
uniform float shininess;

varying vec3 lightVec;
varying vec3 eyeVec;
varying vec2 texCoord;

void main (void)
{
    float distSqr = dot(lightVec, lightVec);
    float att = clamp(1.0 - invRadius * sqrt(distSqr), 0.0, 1.0);
    vec3 lVec = lightVec * inversesqrt(distSqr);
    vec3 vVec = normalize(eyeVec);

    vec4 base = texture2D(colorMap, texCoord);
    vec3 bump = normalize( texture2D(normalMap, texCoord).xyz * 2.0 - 1.0);

    vec4 vAmbient = vec4(ambient, alpha) * vec4(ambient, alpha);

    float diffuse2 = max( dot(lVec, bump), 0.0 );
    vec4 vDiffuse = vec4(diffuse, alpha) * vec4(diffuse, alpha) * diffuse2;

    float specular2 = pow(clamp(dot(reflect(-lVec, bump), vVec), 0.0, 1.0), shininess );
    vec4 vSpecular = vec4(specular, alpha) * vec4(specular, alpha) * specular2;

    gl_FragColor = vec4((( vAmbient*base + vDiffuse*base + vSpecular ) * att).xyz, alpha);
}
