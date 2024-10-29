#version 300 es
precision mediump float;

uniform mat4 viewMatrix;
uniform vec3 cameraPosition;

out vec4 pc_fragColor;

//THREE HEADER END

in vec3 worldPosition;
in vec2 texCoord;

uniform float uSize1;
uniform float uSize2;
uniform vec3 uColor;
uniform float uDistance;

//layout (location = 0) out vec4 outColor;

float getGrid(float size, float thickness) {

    vec2 coord = worldPosition.xy / size;
    vec2 width = fwidth(coord);
    vec2 lineWidth = width * 2.f * thickness;
    vec2 antialias = width;
    vec2 lineUV = 1.f - abs(fract(coord) * 2.f - 1.f);
    vec2 line = smoothstep(lineWidth + antialias, lineWidth - antialias, lineUV);
    float result = mix(line.x, 1.f, line.y) * (1.f - length(width) * .5f);
    return result;
}

void main() {

    float g1 = getGrid(.1f, .5f)*.1;
    float g2 = getGrid(1.f, 1.f)*.2;
    pc_fragColor = vec4(1.f, 1.f, 1.f, mix(g1, 1.f, g2));

    if(pc_fragColor.a <= 0.0f)
        discard;
    return;
    //gl_FragColor = vec4(uColor.rgb, mix(g2, g1, g1) /** pow(d, 3.0)*/);
    //gl_FragColor.a = mix(0.5 * gl_FragColor.a, gl_FragColor.a, g2);

}