precision mediump float;

uniform mat4 viewMatrix;
uniform vec3 cameraPosition;

//THREE HEADER END

varying vec3 worldPosition;
varying vec2 texCoord;
varying float camDist;

uniform float uSize1;
uniform float uSize2;
uniform vec3 uColor;
uniform float uDistance;

float getGrid(float size,float thickness) {

    vec2 scaledPos = worldPosition.xy / size;

    vec2 grid = abs(fract(scaledPos - 0.5) - 0.5);
    grid = step(thickness / size,grid);
    float line = min(grid.x, grid.y);

    return 1.0 - min(line, 1.0);
}

void main() {

                  //float d = 1.0 - min(distance(cameraPosition.xy, worldPosition.xy) / uDistance, 1.0);
    float dist = (camDist*0.299-21.)*2.;
    float g1 = getGrid(.1,.003*dist);
    float g2 = getGrid(1.,.01*dist);
    float mix = mix(g2, g1, g1);
    gl_FragColor = vec4(vec3(mix), 1.);

    if(gl_FragColor.r <= 0.0)
        discard;
    return;
    //gl_FragColor = vec4(uColor.rgb, mix(g2, g1, g1) /** pow(d, 3.0)*/);
    //gl_FragColor.a = mix(0.5 * gl_FragColor.a, gl_FragColor.a, g2);


}