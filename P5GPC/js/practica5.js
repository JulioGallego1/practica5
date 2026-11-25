// Variables globales que van siempre
var renderer, scene, camera;
var cameraControls;
var angulo = -0.01;
var cameraTop;

var robot, base, brazo, antebrazo, mano;
var pinzaIz, pinzaDe;
var materialSuelo, materialMetalMate, materialRotula, materialPinzas;

var controlsRobotUI = {
    giroBase: 0,
    giroBrazo: 0,
    giroAntebrazoY: 0,
    giroAntebrazoZ: 0,
    giroPinza: 0,
    separacionPinza: 10,
    alambres: false,
    anima: function () { animarRobot(); }
};

const controls = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    speed: 2
};


// Event listeners para controles
document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'ArrowUp':
            controls.moveForward = true;
            break;
        case 'ArrowDown':
            controls.moveBackward = true;
            break;
        case 'ArrowLeft':
            controls.moveLeft = true;
            break;
        case 'ArrowRight':
            controls.moveRight = true;
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'ArrowUp':
            controls.moveForward = false;
            break;
        case 'ArrowDown':
            controls.moveBackward = false;
            break;
        case 'ArrowLeft':
            controls.moveLeft = false;
            break;
        case 'ArrowRight':
            controls.moveRight = false;
            break;
    }
});


// 1-inicializa
init();

// 2-Crea una escena
loadScene();

// 3-renderiza
render();


function init() {
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(new THREE.Color(0x44ffff));
    renderer.shadowMap.enabled = true;

    document.getElementById("container").appendChild(renderer.domElement);

    scene = new THREE.Scene();

    var aspectRatio = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(50, aspectRatio, 1, 10000);
    camera.position.set(0, 100, 400);

    // Vista de arriba
    cameraTop = new THREE.OrthographicCamera(-100, 100, 100, -100, 1, 1000);
    cameraTop.position.set(0, 950, 0);
    cameraTop.lookAt(0, 0, 0);
    cameraTop.up.set(0, 0, 1);

    cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
    cameraControls.target.set(0, 100, 0);

    window.addEventListener("resize", updateAspectRatio);

    var gui_ = new dat.GUI();
    var gui = gui_.addFolder("Control Robot");
    gui.open();

    // Le pongo el listen para que se actualice en tiempo real en la GUI
    gui.add(controlsRobotUI, 'giroBase', -180, 180).name("Giro Base").listen();
    gui.add(controlsRobotUI, 'giroBrazo', -45, 45).name("Giro Brazo").listen();
    gui.add(controlsRobotUI, 'giroAntebrazoY', -180, 180).name("Giro Antebrazo Y").listen();
    gui.add(controlsRobotUI, 'giroAntebrazoZ', -90, 90).name("Giro Antebrazo Z").listen();
    gui.add(controlsRobotUI, 'giroPinza', -40, 220).name("Giro Pinza").listen();
    gui.add(controlsRobotUI, 'separacionPinza', 0, 15).name("Separacion Pinza").listen();
    gui.add(controlsRobotUI, 'alambres').name("alambres");
    gui.add(controlsRobotUI, 'anima').name("Animar");
}


function loadScene() {

    // Cargo las texturas
    const textureLoader = new THREE.TextureLoader();

    const texturaSuelo = textureLoader.load('images/pisometalico_1024.jpg');
    const texturaMetalMate = textureLoader.load('images/metalMate.jpg');
    const texturaRotula = textureLoader.load('images/rotula_.jpg');
    const texturaPinzas = textureLoader.load('images/pinzas.jpg');

    texturaSuelo.wrapS = THREE.MirroredRepeatWrapping;
    texturaSuelo.wrapT = THREE.MirroredRepeatWrapping;
    texturaSuelo.repeat.set(6, 6);

    // Crear cubo
    const mapaEntorno = new THREE.CubeTextureLoader().setPath('images/cubemap/')
        .load(['right.png', 'left.png', 'up.png', 'down.png', 'front.png', 'back.png']);


    // Crear los materiales
    materialSuelo = new THREE.MeshLambertMaterial({ map: texturaSuelo });
    materialMetalMate = new THREE.MeshLambertMaterial({ map: texturaMetalMate });
    materialRotula = new THREE.MeshPhongMaterial({ map: texturaRotula, envMap: mapaEntorno, reflectivity: 1, shininess: 100 });
    materialPinzas = new THREE.MeshPhongMaterial({ map: texturaPinzas, shininess: 80 });

    // Crear luces pedidas por la práctica
    let luzAmbiental = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(luzAmbiental);

    let luzDireccional = new THREE.DirectionalLight(0xffff00, 0.3);
    luzDireccional.position.set(200, 100, 0);

    luzDireccional.target.position.set(0, 0, 0);
    luzDireccional.castShadow = true;
    luzDireccional.shadow.camera.left = -500;
    luzDireccional.shadow.camera.right = 500;
    luzDireccional.shadow.camera.top = 500;
    luzDireccional.shadow.camera.bottom = -500;
    luzDireccional.shadow.camera.far = 1200;

    scene.add(luzDireccional);

    let luzFocal = new THREE.SpotLight(0xffffff, 1);

    luzFocal.position.set(0, 700, 300);
    luzFocal.target.position.set(0, 0, 0);
    luzFocal.angle = 0.5;
    luzFocal.penumbra = 0.3;
    luzFocal.distance = 1000;
    luzFocal.decay = 0.3;
    luzFocal.castShadow = true;
    scene.add(luzFocal);

    let materialesHabitacion = [
        new THREE.MeshBasicMaterial({ map: textureLoader.load('images/cubemap/right.png'), side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ map: textureLoader.load('images/cubemap/left.png'), side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ map: textureLoader.load('images/cubemap/up.png'), side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ map: textureLoader.load('images/cubemap/down.png'), side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ map: textureLoader.load('images/cubemap/front.png'), side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ map: textureLoader.load('images/cubemap/back.png'), side: THREE.BackSide })
    ];

    let habitacion = new THREE.Mesh(new THREE.BoxGeometry(1010, 1010, 1010), materialesHabitacion);
    habitacion.position.y = 50;
    scene.add(habitacion);

    let suelo = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000, 100, 100), materialSuelo);

    suelo.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    suelo.receiveShadow = true;
    suelo.castShadow = true;
    scene.add(suelo);

    // Robot
    robot = new THREE.Object3D();
    scene.add(robot);

    // Crear base y añadirla al robot
    base = new THREE.Object3D();
    robot.add(base);

    let cilindroBaseGeometria = new THREE.CylinderGeometry(50, 50, 15, 40);

    let cilindroBase = new THREE.Mesh(cilindroBaseGeometria, materialMetalMate);
    cilindroBase.position.y = 7.5;
    base.add(cilindroBase);

    // Crear brazo y añadirlo a la base
    brazo = new THREE.Object3D();
    brazo.position.y = 20;
    base.add(brazo);

    let brazoEjeGeometria = new THREE.CylinderGeometry(20, 20, 18, 40);

    let eje = new THREE.Mesh(brazoEjeGeometria, materialRotula);
    eje.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    brazo.add(eje);


    let esparragoCilindroGeometria = new THREE.BoxGeometry(18, 120, 12);

    let esparrago = new THREE.Mesh(esparragoCilindroGeometria, materialMetalMate);
    esparrago.position.y = 120 / 2;
    brazo.add(esparrago);


    let rotulaGeometria = new THREE.SphereGeometry(20, 32, 32);

    let rotula = new THREE.Mesh(rotulaGeometria, materialRotula);
    rotula.position.y = 120;
    brazo.add(rotula);

    // Crear antebrazo y añadirlo al brazo
    antebrazo = new THREE.Object3D();
    antebrazo.position.y = 120;
    brazo.add(antebrazo);


    let discoGeometria = new THREE.CylinderGeometry(22, 22, 6, 32);

    let disco = new THREE.Mesh(discoGeometria, materialMetalMate);
    antebrazo.add(disco);


    // Cuatro nervios
    let nervios = new THREE.Object3D();
    antebrazo.add(nervios);

    let geometriaNervio = new THREE.BoxGeometry(4, 80, 4);

    for (let x = -8; x <= 8; x += 16) {
        for (let z = -8; z <= 8; z += 16) {
            let nervio = new THREE.Mesh(geometriaNervio, materialMetalMate);
            nervio.position.set(x, 40, z);
            nervio.receiveShadow = true;
            nervio.castShadow = true;
            nervios.add(nervio);
        }
    }

    // Mano y pinzas
    mano = new THREE.Object3D();
    mano.position.y = 80;
    antebrazo.add(mano);

    let cilindroManoGeometria = new THREE.CylinderGeometry(15, 15, 40, 40);

    let cilindroMano = new THREE.Mesh(cilindroManoGeometria, materialPinzas);
    cilindroMano.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    mano.add(cilindroMano);


    // Geometría de palma y dedo
    let geometriaPalma = new THREE.BoxGeometry(19, 20, 4);
    let geometriaDedo = crearGeometriaDedo();

    pinzaIz = crearPinza(geometriaPalma, geometriaDedo, materialPinzas);
    pinzaIz.position.set(10, 0, 10);
    mano.add(pinzaIz);


    pinzaDe = crearPinza(geometriaPalma, geometriaDedo, materialPinzas);
    pinzaDe.position.set(10, 0, -10);
    pinzaDe.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI);
    mano.add(pinzaDe);

    //Arrojar y recibir sombras
    suelo.receiveShadow = true;
    cilindroBase.castShadow = true;
    cilindroBase.receiveShadow = true;
    eje.castShadow = true;
    eje.receiveShadow = true;
    esparrago.castShadow = true;
    esparrago.receiveShadow = true;
    rotula.castShadow = true;
    rotula.receiveShadow = true;
    disco.castShadow = true;
    disco.receiveShadow = true;
    cilindroMano.castShadow = true;
    cilindroMano.receiveShadow = true;

}


function crearPinza(geometriaPalma, geometriaDedo, material) {
    let pinza = new THREE.Object3D();

    let palma = new THREE.Mesh(geometriaPalma, material);
    palma.position.set(6.5, 0, 2);
    pinza.add(palma);

    let dedo = new THREE.Mesh(geometriaDedo, material);
    pinza.add(dedo);

    return pinza;
}


function crearGeometriaDedo() {

    let geometry = new THREE.BufferGeometry();
    // Vértices del dedo
    let vertices = new Float32Array([
        // Cara interior
        15, -10, 0,
        15, 10, 0,
        34, 5, 0,
        34, -5, 0,
        // Cara exterior
        15, -10, 4,
        34, -5, 2,
        34, 5, 2,
        15, 10, 4,
        // Cara inferior
        15, -10, 0,
        34, -5, 0,
        34, -5, 2,
        15, -10, 4,
        // Cara superior
        15, 10, 0,
        15, 10, 4,
        34, 5, 2,
        34, 5, 0,
        // Cara posterior
        15, -10, 0,
        15, -10, 4,
        15, 10, 4,
        15, 10, 0,
        // Punta
        34, -5, 0,
        34, 5, 0,
        34, 5, 2,
        34, -5, 2
    ]);


    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    // Emplear técnica de coordenadas UV para poder texturizar el dedo
    let uvs = new Float32Array([
        // Cara interior
        0, 0,
        0, 1,
        1, 1,
        1, 0,
        // Cara exterior
        0, 0,
        1, 0,
        1, 1,
        0, 1,
        // Cara inferior
        0, 0,
        1, 0,
        1, 1,
        0, 1,
        // Cara superior
        0, 0,
        0, 1,
        1, 1,
        1, 0,
        // Cara posterior
        0, 0,
        1, 0,
        1, 1,
        0, 1,
        // Punta
        0, 0,
        0, 1,
        1, 1,
        1, 0
    ]);

    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    let indices = new Uint16Array([
        0, 1, 2, 0, 2, 3,
        4, 5, 6, 4, 6, 7,
        8, 9, 10, 8, 10, 11,
        12, 13, 14, 12, 14, 15,
        16, 17, 18, 16, 18, 19,
        20, 21, 22, 20, 22, 23]);

    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();

    return geometry;
}


function updateAspectRatio() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}


function update() {
    cameraControls.update();

    // Movimiento del robot
    if (controls.moveForward)
        robot.position.z -= controls.speed;
    if (controls.moveBackward)
        robot.position.z += controls.speed;
    if (controls.moveLeft)
        robot.position.x -= controls.speed;
    if (controls.moveRight)
        robot.position.x += controls.speed;

    // Articulaciones
    base.rotation.y = controlsRobotUI.giroBase / 180 * Math.PI;
    brazo.rotation.z = controlsRobotUI.giroBrazo / 180 * Math.PI;
    antebrazo.rotation.y = controlsRobotUI.giroAntebrazoY / 180 * Math.PI;
    antebrazo.rotation.z = controlsRobotUI.giroAntebrazoZ / 180 * Math.PI;
    mano.rotation.z = controlsRobotUI.giroPinza / 180 * Math.PI;

    // Apertura/cierre
    pinzaIz.position.z = controlsRobotUI.separacionPinza;
    pinzaDe.position.z = -controlsRobotUI.separacionPinza;

    // Alámbrico
    materialSuelo.wireframe = controlsRobotUI.alambres;
    materialMetalMate.wireframe = controlsRobotUI.alambres;
    materialRotula.wireframe = controlsRobotUI.alambres;
    materialPinzas.wireframe = controlsRobotUI.alambres;
    TWEEN.update();
}


function animarRobot() {

    var tween1 = new TWEEN.Tween(controlsRobotUI)
        .to({
            giroBase: -180,
            giroBrazo: -45,
            giroAntebrazoY: -100,
            giroAntebrazoZ: -45,
            giroPinza: -20,
            separacionPinza: 0
        }, 4000);


    var tween2 = new TWEEN.Tween(controlsRobotUI)
        .to({
            giroBase: 120,
            giroBrazo: 40,
            giroAntebrazoY: 120,
            giroAntebrazoZ: 70,
            giroPinza: 220,
            separacionPinza: 15
        }, 4500);


    var tween3 = new TWEEN.Tween(controlsRobotUI)
        .to({
            giroBase: 0,
            giroBrazo: 0,
            giroAntebrazoY: 0,
            giroAntebrazoZ: 0,
            giroPinza: 0,
            separacionPinza: 10
        }, 4000);


    tween1.chain(tween2);
    tween2.chain(tween3);

    tween1.start();
}


function render() {
    requestAnimationFrame(render);
    update();

    // Vista general
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.setScissorTest(false);
    renderer.render(scene, camera);

    // Vista de arriba
    let lado = Math.min(window.innerWidth, window.innerHeight) / 4;

    renderer.setViewport(0, window.innerHeight - lado, lado, lado);
    renderer.setScissor(0, window.innerHeight - lado, lado, lado);
    renderer.setScissorTest(true);
    renderer.render(scene, cameraTop);
    renderer.setScissorTest(false);
}