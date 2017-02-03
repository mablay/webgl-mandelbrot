if (!Detector.webgl)
{
  Detector.addGetWebGLMessage();
}

//------------------------------------------
// Globals
//------------------------------------------
var stats, renderStats, cameraRTT, camera, sceneRTT, scene, renderer;
var rtTexture, rtTexture2, normalMap;
var simRes = 256;
var rtUniforms, mainUniforms, normalUniforms;
var water, waterMat;
var mouseDown;
var gui, guiParams, guiNeedsUpdate, mainFolder, lightFolder, waterColorFolder;
var normalMat, screenMat;
var light, lensFlare;
var animateLight = false;
var controls, clock;

var renderTargetLinearFloatParams = {
  minFilter:THREE.LinearFilter,
  magFilter:THREE.LinearFilter,
  wrapS:THREE.RenderTargetWrapping,
  wrapT:THREE.RenderTargetWrapping,
  format:THREE.RGBAFormat,
  stencilBuffer:false,
  depthBuffer:false,
  type:THREE.FloatType
};


//------------------------------------------
// Main init and loop
//------------------------------------------

var init = true;
var rtVertexShader,
  renderTextureFragmentSahder,
  normalMapVertexShader,
  normalMapFragmentShader;

var loader = new THREE.FileLoader();
loader.load('js/water/renderTexture-vertexShader.glsl', data => {rtVertexShader = data});
loader.load('js/water/renderTexture-fragmentShader.glsl', data => {renderTextureFragmentSahder = data});

loader.load('js/water/normalMap-vertexShader.glsl', data => {normalMapVertexShader = data});
loader.load('js/water/normalMap-fragmentShader.glsl', data => {normalMapFragmentShader = data});

loader.load('js/water/heightMap-vertexShader.glsl', data => {heightMapVertexShader = data});
loader.load('js/water/setColor-fragmentShader.glsl', data => {setColorFragmentShader = data});


THREE.DefaultLoadingManager.onLoad = function ( ) {
  if (init) {
    start();
    update();
    init = false;
  }
};



//------------------------------------------
// Initialization
//------------------------------------------
function start()
{
  scene = new THREE.Scene();
  sceneRTT = new THREE.Scene();

  clock = new THREE.Clock();

  renderer = new THREE.WebGLRenderer({ antialias:true });
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor(0x808080);
  renderer.autoClear = false;
  //renderer.shadowMapEnabled = true;

  document.body.appendChild( renderer.domElement );

  // add a basic directional light
  light = new THREE.DirectionalLight(0xffffff);
  light.position.set(300, 400, 600);
  light.target.position.set(0, 0, 0);
  light.castShadow = true;
  //light.shadowCameraVisible = true;
  scene.add( light );

  // Setup GUI
  setupGUI();

  // Setup render-to-texture scene
  setupRTTScene();

  // Setup main scene
  setupMainScene();

  // Setup mouse event handlers
  setupControls();

  // Setup FPS counter
  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.bottom = '0px';
  stats.domElement.style.left = '0px';
  document.body.appendChild( stats.domElement );

  // Setup rendering performance counter
  rendererStats = new THREEx.RendererStats();
  rendererStats.domElement.style.position	= 'absolute';
  rendererStats.domElement.style.bottom = '50px';
  rendererStats.domElement.style.left	= '0px';
  document.body.appendChild( rendererStats.domElement );

  // controls
  controls = new THREE.OrbitControls( camera );
}


//------------------------------------------
// Setup the GUI defaults and functions
//------------------------------------------
function setupGUI()
{
  guiNeedsUpdate = false;
  guiParams = {
    damping: 0.99,
    strength: 0.075,
    radius: 0.025,
    scale: 10.0,
    alpha: 0.9,
    ambient: "#111111",
    diffuse: "#ffffff",
    specular: "#ffffff",
    shininess: 50,
    height: 0.05,
    lightPosX: 300.0,
    lightPosY: 400.0,
    lightPosZ: 600.0,
    animateLight: false,
    reset: function() {
      rtUniforms.damping.value = this.damping;
      rtUniforms.strength.value = this.strength;
      rtUniforms.radius.value = this.radius;
      mainUniforms.scale.value = this.scale;
      mainUniforms.alpha.value = this.alpha;
      mainUniforms.shininess.value = this.shininess;
      mainUniforms.lightPos.value.x = this.lightPosX;
      mainUniforms.lightPos.value.y = this.lightPosY;
      mainUniforms.lightPos.value.z = this.lightPosZ;
      animateLight = this.animateLight = false;
      this.ambient = "#111111";
      this.diffuse = "#ffffff";
      this.specular = "#ffffff";
      mainUniforms.ambient.value = new THREE.Color(this.ambient);
      mainUniforms.diffuse.value = new THREE.Color(this.diffuse);
      mainUniforms.specular.value = new THREE.Color(this.specular);
      normalUniforms.height.value = this.height;
      guiNeedsUpdate = true;
    }
  };

  // Setup materials
  setupMats();

  gui = new dat.GUI();

  mainFolder = gui.addFolder("Main Settings");
  mainFolder.add(rtUniforms.damping, "value", 0.0, 1.0).name("Damping");
  mainFolder.add(rtUniforms.strength, "value", 0.0, 0.1).name("Input Strength");
  mainFolder.add(rtUniforms.radius, "value", 0.0, 0.1).name("Input Radius");
  mainFolder.add(mainUniforms.scale, "value", 0.0, 100.0).name("Simulation Scale");
  mainFolder.open();

  lightFolder = gui.addFolder("Light Position");
  lightFolder.add(mainUniforms.lightPos.value, "x").name("X");
  lightFolder.add(mainUniforms.lightPos.value, "y").name("Y");
  lightFolder.add(mainUniforms.lightPos.value, "z").name("Z");
  lightFolder.add(guiParams, "animateLight").name("Animate Light").onChange(function(newValue) { animateLight = newValue; guiNeedsUpdate = true; });
  lightFolder.open();

  waterColorFolder = gui.addFolder("Water Colors");
  waterColorFolder.addColor(guiParams, "ambient").name("Ambient").onChange(function(colorValue) { mainUniforms.ambient.value = new THREE.Color(colorValue); });
  waterColorFolder.addColor(guiParams, "diffuse").name("Diffuse").onChange(function(colorValue) { mainUniforms.diffuse.value = new THREE.Color(colorValue); });
  waterColorFolder.addColor(guiParams, "specular").name("Specular").onChange(function(colorValue) { mainUniforms.specular.value = new THREE.Color(colorValue); });
  waterColorFolder.add(mainUniforms.alpha, "value", 0.0, 1.0).name("Opacity");
  waterColorFolder.add(mainUniforms.shininess, "value", 0.0, 300.0).name("Shininess");
  waterColorFolder.add(normalUniforms.height, "value", 0.001, 0.1).name("Normal Height");
  waterColorFolder.open();

  gui.add(guiParams, "reset").name("Reset to Defaults");
}


//------------------------------------------
// Setup the render target textures and materials
//------------------------------------------
function setupMats()
{
  // create buffers
  rtTexture = new THREE.WebGLRenderTarget( simRes, simRes, renderTargetLinearFloatParams );
  rtTexture2 = new THREE.WebGLRenderTarget( simRes, simRes, renderTargetLinearFloatParams );
  normalMap = new THREE.WebGLRenderTarget( simRes, simRes, renderTargetLinearFloatParams );

  var delta = 1.0 / simRes;

  // main render-to-texture material
  rtUniforms = {
    texture: { type: "t", value: rtTexture2 },
    delta: { type: "v2", value: new THREE.Vector2( delta, delta ) },
    mousePoint: { type:"v2", value: new THREE.Vector2(-1, -1) },
    mouseActive: { type:"i", value: 0 },
    damping: { type: "f", value: guiParams.damping },
    strength: { type: "f", value: guiParams.strength },
    radius: { type: "f", value: guiParams.radius }
  };
  screenMat = new THREE.ShaderMaterial({
    uniforms: rtUniforms,
    vertexShader: rtVertexShader,//document.getElementById( 'vs_rt' ).textContent,
    fragmentShader: renderTextureFragmentSahder //document.getElementById( 'fs_rt' ).textContent
  });

  // main water material and mesh
  mainUniforms = {
    heightMap: { type: "t", value: rtTexture2 },
    scale: { type: "f", value: guiParams.scale },
    alpha: { type: "f", value: guiParams.alpha },
    colorMap: { type: "t", value: THREE.ImageUtils.loadTexture( 'img/eerieYpos.png' ) },
    normalMap: { type: "t", value: normalMap },
    ambient: { type: "c", value: new THREE.Color(0x111111) },
    diffuse: { type: "c", value: new THREE.Color(0xffffff) },
    specular: { type: "c", value: new THREE.Color(0xffffff) },
    invRadius: { type: "f", value: 0.0 },
    shininess: { type: "f", value: 50.0 },
    lightPos: { type: "v3", value: light.position }
  };
  waterMat = new THREE.ShaderMaterial({
    uniforms: mainUniforms,
    vertexShader: heightMapVertexShader, //document.getElementById( 'vs_setHeight' ).textContent,
    fragmentShader: setColorFragmentShader, //document.getElementById( 'fs_setColor' ).textContent,
    transparent: true,
    side: THREE.DoubleSide
    //wireframe: true
  });

  // Setup normal material
  normalUniforms = {
    texture: { type: "t", value: rtTexture2 },
    delta: { type: "v2", value: new THREE.Vector2(delta, delta) },
    height: { type: "f", value: 0.05 }
  };
  normalMat = new THREE.ShaderMaterial({
    uniforms: normalUniforms,
    vertexShader: normalMapVertexShader, //document.getElementById( 'vs_normal' ).textContent,
    fragmentShader: normalMapFragmentShader// document.getElementById( 'fs_normal' ).textContent
  });
}


//------------------------------------------
// Setup the render-to-texture scene
//------------------------------------------
function setupRTTScene()
{
  cameraRTT = new THREE.OrthographicCamera( simRes / - 2, simRes / 2, simRes / 2, simRes / - 2, -10000, 10000 );

  var screenGeo = new THREE.PlaneGeometry( simRes, simRes );
  screenQuad = new THREE.Mesh( screenGeo, screenMat );
  screenQuad.position.z = -100;
  sceneRTT.add( screenQuad );
}


//------------------------------------------
// Setup the main scene
//------------------------------------------
function setupMainScene()
{
  camera = new THREE.PerspectiveCamera( 60, window.innerWidth/window.innerHeight, 1, 10000 );
  camera.position.y = 450;
  camera.position.z = 450;
  camera.rotation.x = THREE.Math.degToRad(-45);

  var waterGeo = new THREE.PlaneGeometry( 512, 512, simRes-1, simRes-1 );
  water = new THREE.Mesh( waterGeo , waterMat );
  water.rotation.x = THREE.Math.degToRad(-90);
  scene.add( water );

  // lower 'floor' plane
  var floorTexture = THREE.ImageUtils.loadTexture( 'img/checkerboard.jpg' );
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set( 5, 5 );
  var floorPlaneGeo = new THREE.PlaneGeometry( 512, 512, 1, 1 );
  var floorPlane = new THREE.Mesh( floorPlaneGeo, new THREE.MeshLambertMaterial({color:0xffffff, map: floorTexture}) );
  floorPlane.position.set(0, -50, 0);
  floorPlane.rotation.x = THREE.Math.degToRad(-90);
  scene.add( floorPlane );

  // debug the render texture by applying it to a basic plane in the upper-left
  // area of the scene
  var rtDbgGeo = new THREE.PlaneGeometry( 150, 150, 1, 1 );
  var rtDbgMat = new THREE.MeshBasicMaterial({ color: 0xffffff, map: normalMap });
  var rtDbg = new THREE.Mesh( rtDbgGeo, rtDbgMat );
  rtDbg.position.set(-300, 200, 0);
  scene.add( rtDbg );

  // Lens flare
  var textureFlare0 = THREE.ImageUtils.loadTexture( "img/lensflare0.png" );
  var textureFlare2 = THREE.ImageUtils.loadTexture( "img/lensflare2.png" );
  var textureFlare3 = THREE.ImageUtils.loadTexture( "img/lensflare3.png" );
  var flareColor = new THREE.Color( 0xffffff );
  lensFlare = new THREE.LensFlare( textureFlare0, 700, 0.0, THREE.AdditiveBlending, flareColor );
  lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );
  lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );
  lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );
  lensFlare.add( textureFlare3, 60, 0.6, THREE.AdditiveBlending );
  lensFlare.add( textureFlare3, 70, 0.7, THREE.AdditiveBlending );
  lensFlare.add( textureFlare3, 120, 0.9, THREE.AdditiveBlending );
  lensFlare.add( textureFlare3, 70, 1.0, THREE.AdditiveBlending );
  lensFlare.customUpdateCallback = lensFlareUpdateCallback;
  lensFlare.position = light.position;
  scene.add( lensFlare );

  // sphere to test that lighting is working
  var sp = new THREE.SphereGeometry( 50, 30, 15 );
  var spm = new THREE.Mesh( sp, new THREE.MeshLambertMaterial({color:0xff0000}) );
  spm.position.set(300, 200, 0);
  scene.add( spm );
}


//------------------------------------------
// Update the lens flare
//------------------------------------------
function lensFlareUpdateCallback( object )
{
  var f, fl = object.lensFlares.length;
  var flare;
  var vecX = -object.positionScreen.x * 2;
  var vecY = -object.positionScreen.y * 2;

  for( f = 0; f < fl; f++ )
  {
    flare = object.lensFlares[ f ];

    flare.x = object.positionScreen.x + vecX * flare.distance;
    flare.y = object.positionScreen.y + vecY * flare.distance;

    flare.rotation = 0;
  }

  object.lensFlares[ 2 ].y += 0.025;
  object.lensFlares[ 3 ].rotation = object.positionScreen.x * 0.5 + THREE.Math.degToRad( 45 );
}


//------------------------------------------
// Setup mouse event handlers
//------------------------------------------
function setupControls()
{
  // Add mouse controls
  renderer.domElement.onmousedown = function (event)
  {
    if (event.button === 0)
    {
      mouseDown = true;
    }
  };

  renderer.domElement.onmouseup = function ()
  {
    mouseDown = false;
    rtUniforms.mouseActive.value = 0;
  };

  renderer.domElement.onmouseout = function ()
  {
    rtUniforms.mouseActive.value = 0;
  };

  renderer.domElement.onclick = function (event)
  {
    rtUniforms.mouseActive.value = 2;
  };

  renderer.domElement.onmousemove = function (a)
  {
    rtUniforms.mousePoint.value.set(a.clientX / window.innerWidth, a.clientY / window.innerHeight);
    if (1 > Math.abs(rtUniforms.mousePoint.value.x) && 1 > Math.abs(rtUniforms.mousePoint.value.y))
      rtUniforms.mouseActive.value = mouseDown ? 2 : 0;
  };
}


//------------------------------------------
// Main loop
//------------------------------------------
function update()
{
  requestAnimationFrame( update );

  if (animateLight)
  {
    light.position.x = Math.sin(clock.getElapsedTime()) * 400.0;
    light.position.z = Math.cos(clock.getElapsedTime()) * 400.0;
    guiNeedsUpdate = true;
  }

  // Refresh GUI
  if (guiNeedsUpdate)
  {
    // Iterate over all controllers
    for (var i in gui.__controllers)
    {
      gui.__controllers[i].updateDisplay();
    }
    for (var j in mainFolder.__controllers)
    {
      mainFolder.__controllers[j].updateDisplay();
    }
    for (var k in lightFolder.__controllers)
    {
      lightFolder.__controllers[k].updateDisplay();
    }
    for (var l in waterColorFolder.__controllers)
    {
      waterColorFolder.__controllers[l].updateDisplay();
    }
    guiNeedsUpdate = false;
  }

  lensFlare.position = light.position;

  render();

  stats.update();
  controls.update();
  rendererStats.update(renderer);
}


//------------------------------------------
// Main rendering
//------------------------------------------
function render()
{
  renderer.clear();

  // Run heightMap simulation, updating both buffers
  stepSim();
  stepSim();

  // Generate normalMap from new heightMap
  updateNormals();

  // Final render pass
  renderer.render( scene, camera );
}


//------------------------------------------
// A single simulation step
//------------------------------------------
function stepSim()
{
  // Run the ripple propagation in the sceneRTT fragment shader and
  // render it into rtTexture
  renderer.render( sceneRTT, cameraRTT, rtTexture, true );

  // Swap buffers
  swapBuffers();
}


//------------------------------------------
// Generate normalMap
//------------------------------------------
function updateNormals()
{
  // Switch to custom normalmap material
  screenQuad.material = normalMat;

  // Render the normals into the buffers. This mixes normal colors in.
  renderer.render( sceneRTT, cameraRTT, normalMap, true );

  // Switch back to simulation material
  screenQuad.material = screenMat;
}


//------------------------------------------
// Swaps the rendering buffers
//------------------------------------------
function swapBuffers()
{
  var a = rtTexture2;
  rtTexture2 = rtTexture;
  rtTexture = a;
  rtUniforms.texture.value = rtTexture2;
}