#version 300 es
precision mediump float;

// = object.matrixWorld
uniform mat4 modelMatrix;

// = camera.matrixWorldInverse * object.matrixWorld
uniform mat4 modelViewMatrix;

// = camera.projectionMatrix
uniform mat4 projectionMatrix;

// = camera.matrixWorldInverse
uniform mat4 viewMatrix;

// = inverse transpose of modelViewMatrix
uniform mat3 normalMatrix;

// = camera position in world space
uniform vec3 cameraPosition;
// default vertex attributes provided by BufferGeometry
in vec3 position;
in vec3 normal;
in vec2 uv;

//THREE HEADER END

out vec3 worldPosition;
out vec2 texCoord;

uniform float uDistance;

void main() {

    texCoord = uv;
    gl_Position = modelViewMatrix * projectionMatrix * vec4(position, 1.f);
    //gl_Position = vec4(position,1.);
}