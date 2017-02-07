// this is similar to http://relicweb.com/webgl/rt.html

console.log('Hello World!');

var width = window.innerWidth;
var height = window.innerHeight;
var scene = new THREE.Scene();
var aspect = height / width;
var camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
camera.position.z = 1;
//camera.position.x = -1;
//camera.lookAt(new THREE.Vector3(-1.0, 0.0, 0.0));

// create canvas
var renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

var geometry, material, mesh;
var vertexShader, fragmentShader;
var loader = new THREE.FileLoader();
loader.load('js/kernel/kernel-vertex-shader.glsl', data => {vertexShader = data});
loader.load('js/kernel/kernel-fragment-shader.glsl', data => {fragmentShader = data});

THREE.DefaultLoadingManager.onLoad = function ( ) {
  createMesh();
  render();
  registerEventHandler();
};

function createMesh() {
  // create mandelbrot mesh
  geometry = new THREE.PlaneGeometry(3, 3 * aspect);
  material = new THREE.ShaderMaterial({
    uniforms: {
      zoom: { type: 'f', value: 2.0 },
      julia: { type: 'vec2', value: {x: 0, y: 0} },
      mouse: { type: 'vec2', value: {x: 0, y: 0} }
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader
  });
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

}


function render (delta) {
  setTimeout(()=>requestAnimationFrame(render), 1000);
  // requestAnimationFrame(render);

  //mesh.material.uniforms.zoom.value = 1;//Math.cos(delta / 500) * 0.1 + 2;
  ///var julia = mesh.material.uniforms.julia.value;
  //console.log('julia %o', mesh.material.uniforms.julia);
  mesh.material.uniforms.julia.value.x = (Math.cos(delta / 1000) - .4 ) * 0.9*0.9;
  mesh.material.uniforms.julia.value.y = Math.sin(delta / 1000) * 1.1*0.9;
  //mesh.material.uniforms.julia.y = 1;
  renderer.render(scene, camera);
}


function registerEventHandler() {

  // Mouse Move
  window.addEventListener('mousemove', function(event){
    //console.log('[MOUSE] (%d, %d)', event.x, event.y);
    mesh.material.uniforms.mouse.value.x = (event.x - window.innerWidth / 2.0) / 100;
    mesh.material.uniforms.mouse.value.y = (event.y - window.innerHeight / 2.0) / 100;
  });


  // Scroll
  window.addEventListener('mousewheel', function(event){
    event.preventDefault();
    // console.log('[SCROLL] %d', event.wheelDelta);
    mesh.material.uniforms.zoom.value += event.wheelDelta / 1000.0;
  });

}
