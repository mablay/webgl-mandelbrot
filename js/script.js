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
loader.load('js/shader/mandelbrot-vertex.glsl', data => {vertexShader = data});
loader.load('js/shader/mandelbrot-fragment.glsl', data => {fragmentShader = data});

THREE.DefaultLoadingManager.onLoad = function ( ) {
    createMesh();
    render();
};

function createMesh() {
    // create mandelbrot mesh
    geometry = new THREE.PlaneGeometry(3, 3 * aspect);
    material = new THREE.ShaderMaterial({
        uniforms: {
            zoom: { type: 'f', value: 0.05 }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
    });
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
}


function render (delta) {
    requestAnimationFrame(render);
    mesh.material.uniforms.zoom.value = 2;//Math.cos(delta / 500) + 1.5;
    renderer.render(scene, camera);
}

