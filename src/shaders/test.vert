#include <common>

varying vec3 v2f_position;

void main() {
      v2f_position = position;
      vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
      vec4 mvPosition =  viewMatrix * worldPosition;
      gl_Position = projectionMatrix * mvPosition;
}