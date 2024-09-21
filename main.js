import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';

let scene, camera, renderer, labelRenderer, controls;
let closestLanguageText;

const languageData = {
    'Python': [50, 80, 30],
    'JavaScript': [40, 60, 25],
    'Java': [70, 100, 40],
    'C++': [90, 40, 15],
    'Rust': [80, 30, 10],
    'Go': [60, 50, 20],
    'Ruby': [30, 70, 200],
    'C#': [75, 90, 30],
    'TypeScript': [45, 65, 28],
    'Swift': [55, 75, 32],
    'Kotlin': [65, 85, 38],
    'Scala': [35, 155, 22]
};

function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(100, 100, 200);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // CSS2D renderer for labels
    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    document.body.appendChild(labelRenderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;

    // Axes helper with numbers
    createAxesWithNumbers();

    createConvexHull();
    createLegend();
    createSliders();

    window.addEventListener('resize', onWindowResize);
}

function createAxesWithNumbers() {
    const axesHelper = new THREE.AxesHelper(100);
    scene.add(axesHelper);

    const labelStyle = 'color: #ffffff; font-family: Arial; font-size: 8px;';

    for (let i = 0; i <= 100; i += 20) {
        // X-axis
        const labelX = document.createElement('div');
        labelX.textContent = i.toString();
        labelX.style.cssText = labelStyle;
        const labelXObj = new CSS2DObject(labelX);
        labelXObj.position.set(i, 0, 0);
        scene.add(labelXObj);

        // Y-axis
        const labelY = document.createElement('div');
        labelY.textContent = i.toString();
        labelY.style.cssText = labelStyle;
        const labelYObj = new CSS2DObject(labelY);
        labelYObj.position.set(0, i, 0);
        scene.add(labelYObj);

        // Z-axis
        const labelZ = document.createElement('div');
        labelZ.textContent = i.toString();
        labelZ.style.cssText = labelStyle;
        const labelZObj = new CSS2DObject(labelZ);
        labelZObj.position.set(0, 0, i);
        scene.add(labelZObj);
    }
}


function createConvexHull() {
    const points = [];
    const colors = [];

    Object.entries(languageData).forEach(([language, [x, y, z]], index) => {
        points.push(new THREE.Vector3(x, y, z));
        
        const hue = index / Object.keys(languageData).length;
        const color = new THREE.Color().setHSL(hue, 1, 0.5);
        colors.push(color);
    });

    const geometry = new ConvexGeometry(points);
    const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
    });
    const convexHull = new THREE.Mesh(geometry, material);
    scene.add(convexHull);

    // Add points
    const pointGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const pointMaterial = new THREE.PointsMaterial({ size: 3, vertexColors: true });
    pointGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors.flatMap(c => c.toArray()), 3));
    const pointCloud = new THREE.Points(pointGeometry, pointMaterial);
    scene.add(pointCloud);
}

function createLegend() {
    const legendEl = document.createElement('div');
    legendEl.id = 'legend';
    legendEl.style.position = 'absolute';
    legendEl.style.top = '10px';
    legendEl.style.right = '10px';
    legendEl.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    legendEl.style.color = 'white';
    legendEl.style.padding = '10px';
    legendEl.style.borderRadius = '5px';
    legendEl.style.fontFamily = 'Arial, sans-serif';
    legendEl.style.fontSize = '12px';

    Object.entries(languageData).forEach(([language, [x, y, z]], index) => {
        const hue = index / Object.keys(languageData).length;
        const color = new THREE.Color().setHSL(hue, 1, 0.5);
        const legendItem = document.createElement('div');
        legendItem.style.color = `#${color.getHexString()}`;
        legendItem.textContent = `${language}: (${x}s, ${y}MB, ${z}J)`;
        legendEl.appendChild(legendItem);
    });

    document.body.appendChild(legendEl);
}

function createSliders() {
    const sliderContainer = document.createElement('div');
    sliderContainer.style.position = 'absolute';
    sliderContainer.style.bottom = '10px';
    sliderContainer.style.left = '10px';
    sliderContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    sliderContainer.style.padding = '10px';
    sliderContainer.style.borderRadius = '5px';
    sliderContainer.style.color = 'white';
    sliderContainer.style.fontFamily = 'Arial, sans-serif';

    const sliders = ['Execution Time (s)', 'Memory Usage (MB)', 'Energy Consumption (J)'];
    const minMaxValues = calculateMinMax();

    sliders.forEach((sliderName, index) => {
        const sliderLabel = document.createElement('label');
        sliderLabel.textContent = sliderName + ': ';
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = minMaxValues[index].min;
        slider.max = minMaxValues[index].max;
        slider.value = (minMaxValues[index].min + minMaxValues[index].max) / 2;
        slider.step = 1;
        const valueDisplay = document.createElement('span');
        valueDisplay.textContent = slider.value;

        slider.oninput = function() {
            valueDisplay.textContent = this.value;
            updateClosestLanguage();
        };

        sliderLabel.appendChild(slider);
        sliderLabel.appendChild(valueDisplay);
        sliderContainer.appendChild(sliderLabel);
        sliderContainer.appendChild(document.createElement('br'));
    });

    closestLanguageText = document.createElement('div');
    closestLanguageText.style.marginTop = '10px';
    sliderContainer.appendChild(closestLanguageText);

    document.body.appendChild(sliderContainer);
    updateClosestLanguage();
}

function calculateMinMax() {
    const values = Object.values(languageData);
    const mins = [Infinity, Infinity, Infinity];
    const maxs = [-Infinity, -Infinity, -Infinity];

    values.forEach(value => {
        for (let i = 0; i < 3; i++) {
            mins[i] = Math.min(mins[i], value[i]);
            maxs[i] = Math.max(maxs[i], value[i]);
        }
    });

    return mins.map((min, i) => ({ min, max: maxs[i] }));
}

function updateClosestLanguage() {
    const sliders = document.querySelectorAll('input[type="range"]');
    const selectedPoint = [
        parseFloat(sliders[0].value),
        parseFloat(sliders[1].value),
        parseFloat(sliders[2].value)
    ];

    let closestLanguage = '';
    let minDistance = Infinity;

    Object.entries(languageData).forEach(([language, point]) => {
        const distance = Math.sqrt(
            Math.pow(selectedPoint[0] - point[0], 2) +
            Math.pow(selectedPoint[1] - point[1], 2) +
            Math.pow(selectedPoint[2] - point[2], 2)
        );

        if (distance < minDistance) {
            minDistance = distance;
            closestLanguage = language;
        }
    });

    closestLanguageText.textContent = `Closest language: ${closestLanguage}`;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

init();
animate();
