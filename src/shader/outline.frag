#version 300 es
precision mediump float;

out vec4 pc_fragColor;

//THREE HEADER END

in vec3 worldPosition;
in vec2 texCoord;

uniform float uSize1;
uniform float uSize2;
uniform vec3 uColor;
uniform float uDistance;
uniform sampler2D tDiffuse;
uniform sampler2D tOutlineMask;

//layout (location = 0) out vec4 outColor;

void main() {
    const float offset = 0.002;
    pc_fragColor = vec4(vec3(1.f, .5f, 0.f), 1.f);
    vec4 col = texture(tDiffuse,texCoord);
    float alpha = col.a;
    float c1 = texture(tDiffuse,texCoord+vec2(offset,offset)).a;
    float c2 = texture(tDiffuse,texCoord+vec2(-offset,offset)).a;
    float c3 = texture(tDiffuse,texCoord+vec2(offset,-offset)).a;
    float c4 = texture(tDiffuse,texCoord+vec2(-offset,-offset)).a;
    float comb = (c1+c2+c3+c4)/4.;
    float outline = clamp(((comb-alpha)*10.),0.,1.);
    pc_fragColor = mix(col,vec4(1.,.6,0.,1.),outline);
    pc_fragColor = texture(tOutlineMask,texCoord);
    

    //gl_FragColor = vec4(uColor.rgb, mix(g2, g1, g1) /** pow(d, 3.0)*/);
    //gl_FragColor.a = mix(0.5 * gl_FragColor.a, gl_FragColor.a, g2);

}