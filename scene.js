// Brew Haven — 3D hero: a glazed cup of latte on a saucer, ringed by roasted coffee beans.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

const container = document.getElementById("heroVisual");
const canvas = document.getElementById("coffeeScene");

try {
  init();
} catch (error) {
  console.warn("3D scene unavailable — showing the illustration instead.", error);
  container.dataset.scene = "failed";
}

function init() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const random = seededRandom(7);

  // Renderer, scene, camera ----------------------------------------------------
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  canvas.addEventListener("webglcontextlost", () => {
    container.dataset.scene = "failed";
  });

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.85;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const cameraTarget = new THREE.Vector3(0, 0.6, 0);
  camera.position.set(0, 5.75, 11.6);
  camera.lookAt(cameraTarget);

  // Lights -------------------------------------------------------------------------
  scene.add(new THREE.HemisphereLight(0xfff3e4, 0x7a5236, 0.7));

  const key = new THREE.DirectionalLight(0xffe6c8, 2.4);
  key.position.set(-4, 7.5, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -4;
  key.shadow.camera.right = 4;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -4;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 20;
  key.shadow.radius = 4;
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.02;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xffc89a, 1.2);
  rim.position.set(5, 3, -4);
  scene.add(rim);

  // Rig: everything that tilts with the pointer -------------------------------
  const rig = new THREE.Group();
  scene.add(rig);

  // Ground: only shadows are visible, so the scene sits on the page.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.ShadowMaterial({ color: 0x4a2e1f, opacity: 0.16 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  rig.add(ground);

  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 4.6),
    new THREE.MeshBasicMaterial({ map: softShadowTexture(), transparent: true, depthWrite: false })
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = 0.002;
  rig.add(contact);

  // Cup + saucer (spins slowly; drag to spin it yourself)
  const cupGroup = new THREE.Group();
  rig.add(cupGroup);

  const ceramic = {
    roughness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
  };

  const saucer = new THREE.Mesh(
    new THREE.LatheGeometry(
      smoothProfile([
        [0, 0], [0.7, 0], [0.78, 0.02], [0.82, 0.06], [1.2, 0.12], [1.55, 0.18],
        [1.74, 0.24], [1.8, 0.285], [1.76, 0.31], [1.66, 0.29], [1.3, 0.2],
        [0.95, 0.145], [0.6, 0.125], [0, 0.12],
      ], 140),
      96
    ),
    new THREE.MeshPhysicalMaterial({ color: 0xf4ece1, ...ceramic })
  );
  saucer.castShadow = true;
  saucer.receiveShadow = true;
  cupGroup.add(saucer);

  const cup = new THREE.Group();
  cup.position.y = 0.12;
  cupGroup.add(cup);

  const outer = smoothProfile([
    [0, 0], [0.46, 0], [0.54, 0.02], [0.57, 0.07], [0.6, 0.12], [0.75, 0.28],
    [0.88, 0.52], [0.96, 0.82], [1.0, 1.08], [1.015, 1.2],
  ], 90);
  const inner = smoothProfile([
    [1.015, 1.2], [1.005, 1.255], [0.975, 1.272], [0.95, 1.245], [0.935, 1.15],
    [0.9, 0.86], [0.82, 0.56], [0.68, 0.32], [0.48, 0.18], [0.2, 0.15], [0, 0.15],
  ], 90).slice(1);
  const profile = [...outer, ...inner];
  const cupGeometry = new THREE.LatheGeometry(profile, 128);

  // Two-tone glaze: caramel outside, cream lip and inside.
  const glaze = new THREE.Color("#b5652f");
  const cream = new THREE.Color("#faf3ea");
  const colors = [];
  const positions = cupGeometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const j = i % profile.length;
    const isGlaze = j < outer.length && profile[j].y < 1.165;
    const c = isGlaze ? glaze : cream;
    colors.push(c.r, c.g, c.b);
  }
  cupGeometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  const cupBody = new THREE.Mesh(
    cupGeometry,
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, side: THREE.DoubleSide, ...ceramic })
  );
  cupBody.castShadow = true;
  cupBody.receiveShadow = true;
  cup.add(cupBody);

  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.078, 24, 64, Math.PI * 1.4),
    new THREE.MeshPhysicalMaterial({ color: glaze, ...ceramic })
  );
  handle.rotation.z = -Math.PI * 0.7;
  handle.position.set(1.02, 0.72, 0);
  handle.castShadow = true;
  cup.add(handle);

  const coffee = new THREE.Mesh(
    new THREE.CircleGeometry(0.94, 96),
    new THREE.MeshPhysicalMaterial({
      map: latteArtTexture(renderer.capabilities.getMaxAnisotropy()),
      roughness: 0.42,
      clearcoat: 0.6,
      clearcoatRoughness: 0.25,
    })
  );
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.y = 1.12;
  coffee.receiveShadow = true;
  cup.add(coffee);

  // Steam: three soft wisps, always facing the camera ------------------------
  const steam = new THREE.Group();
  scene.add(steam);
  const steamMaterials = [-0.32, 0.02, 0.34].map((x, i) => {
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uPhase: { value: i * 2.1 },
        uColor: { value: new THREE.Color("#a6825f") },
        uOpacity: { value: 0.55 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uPhase;
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec2 vUv;
        void main() {
          float y = vUv.y;
          float t = uTime + uPhase;
          float offset = sin(y * 6.0 - t * 1.6) * 0.16 * y + sin(y * 13.0 - t * 2.3) * 0.04 * y;
          float d = abs(vUv.x - 0.5 - offset);
          float w = mix(0.03, 0.085, y);
          float line = smoothstep(w, w * 0.2, d);
          float fade = smoothstep(0.0, 0.18, y) * (1.0 - smoothstep(0.5, 1.0, y));
          float breathe = 0.55 + 0.45 * sin(y * 5.0 - t * 1.9);
          float alpha = line * fade * breathe * uOpacity;
          if (alpha < 0.004) discard;
          gl_FragColor = vec4(uColor, alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });
    const wisp = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 1.9), material);
    wisp.position.set(x, 0.95 + (i % 2) * 0.08, 0);
    steam.add(wisp);
    return material;
  });
  const steamAnchor = new THREE.Object3D();
  steamAnchor.position.y = 1.3;
  rig.add(steamAnchor);

  // Coffee beans ------------------------------------------------------------------------
  const beanGeometry = coffeeBeanGeometry();
  const beanMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.42,
    clearcoat: 0.3,
    clearcoatRoughness: 0.35,
    envMapIntensity: 0.55,
  });
  const beanShades = ["#3a2013", "#4b2a17", "#5a341d", "#6a3f22"].map((c) => new THREE.Color(c));

  const ORBITING = 22;
  const orbiting = Array.from({ length: ORBITING }, (_, i) => ({
    radius: 2.0 + random() * 0.55,
    angle: (i / ORBITING) * Math.PI * 2 + random() * 0.35,
    speed: 0.14 + random() * 0.08,
    y: 0.55 + random() * 2.1,
    bob: 0.06 + random() * 0.12,
    bobSpeed: 0.6 + random() * 0.6,
    phase: random() * Math.PI * 2,
    axis: new THREE.Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize(),
    spin: random() * Math.PI * 2,
    spinSpeed: 0.35 + random() * 0.7,
    scale: 0.17 + random() * 0.09,
  }));

  // A few beans resting on the table beside the saucer.
  const resting = [
    [2.05, 0.6, 0.4],
    [-1.98, 0.85, 2.2],
    [-1.3, 1.75, -0.9],
    [0.95, 2.1, 1.3],
    [1.65, -1.5, 2.6],
  ].map(([x, z, turn]) => {
    const object = new THREE.Object3D();
    object.position.set(x, 0.085, z);
    object.rotation.set(Math.PI / 2, 0, turn);
    object.scale.setScalar(0.24);
    object.updateMatrix();
    return object.matrix.clone();
  });

  const beans = new THREE.InstancedMesh(beanGeometry, beanMaterial, ORBITING + resting.length);
  beans.castShadow = true;
  beans.receiveShadow = true;
  beans.frustumCulled = false;
  for (let i = 0; i < beans.count; i++) {
    beans.setColorAt(i, beanShades[Math.floor(random() * beanShades.length)]);
  }
  resting.forEach((matrix, i) => beans.setMatrixAt(ORBITING + i, matrix));
  rig.add(beans);

  // Interaction state ------------------------------------------------------------------
  const pointer = new THREE.Vector2();
  const tilt = new THREE.Vector2();
  let cupAngle = -0.6;
  let spinVelocity = 0.3;
  let dragging = false;
  let dragDelta = 0;
  let lastX = 0;

  window.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType !== "mouse") return;
      pointer.set((event.clientX / window.innerWidth) * 2 - 1, (event.clientY / window.innerHeight) * 2 - 1);
    },
    { passive: true }
  );

  canvas.addEventListener("pointerdown", (event) => {
    dragging = true;
    lastX = event.clientX;
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add("is-dragging");
    if (reducedMotion.matches) startLoop();
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    dragDelta += event.clientX - lastX;
    lastX = event.clientX;
  });
  const endDrag = () => {
    dragging = false;
    canvas.classList.remove("is-dragging");
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  // Per-frame update -----------------------------------------------------------------
  const dummy = new THREE.Object3D();
  const spinQuat = new THREE.Quaternion();
  const anchorWorld = new THREE.Vector3();

  function update(dt, time) {
    // Scroll: tip the scene back and spread the beans as the hero leaves.
    const rect = container.getBoundingClientRect();
    const scrollProgress = THREE.MathUtils.clamp(-rect.top / Math.max(rect.height, 1), 0, 1);

    // Pointer tilt (smoothed)
    const ease = 1 - Math.exp(-dt * 3);
    tilt.x += (pointer.x - tilt.x) * ease;
    tilt.y += (pointer.y - tilt.y) * ease;
    rig.rotation.y = tilt.x * 0.32;
    rig.rotation.x = tilt.y * 0.1 + scrollProgress * 0.35;
    rig.position.y = scrollProgress * 0.6;

    // Cup spin: drag to throw it, then it settles back to a slow idle turn.
    if (dragging) {
      const delta = dragDelta * 0.012;
      cupAngle += delta;
      spinVelocity = dt > 0 ? THREE.MathUtils.clamp(delta / dt, -8, 8) : 0;
      dragDelta = 0;
    } else {
      const idle = reducedMotion.matches ? 0 : 0.3;
      spinVelocity += (idle - spinVelocity) * (1 - Math.exp(-dt * 1.4));
      cupAngle += spinVelocity * dt;
    }
    cupGroup.rotation.y = cupAngle;

    // Beans
    const spread = 1 + scrollProgress * 0.4;
    for (let i = 0; i < ORBITING; i++) {
      const b = orbiting[i];
      const angle = b.angle + time * b.speed;
      dummy.position.set(
        Math.cos(angle) * b.radius * spread,
        b.y + Math.sin(time * b.bobSpeed + b.phase) * b.bob,
        Math.sin(angle) * b.radius * 0.85 * spread
      );
      dummy.quaternion.setFromAxisAngle(b.axis, b.spin + time * b.spinSpeed);
      spinQuat.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, angle);
      dummy.quaternion.premultiply(spinQuat);
      dummy.scale.setScalar(b.scale);
      dummy.updateMatrix();
      beans.setMatrixAt(i, dummy.matrix);
    }
    beans.instanceMatrix.needsUpdate = true;

    // Steam follows the cup and always faces the camera.
    steamAnchor.getWorldPosition(anchorWorld);
    steam.position.copy(anchorWorld);
    steam.quaternion.copy(camera.quaternion);
    for (const material of steamMaterials) material.uniforms.uTime.value = time;
  }

  // Loop control: only animate while visible, and respect reduced motion --------
  let elapsed = 3;
  let lastTime = null;
  let visible = true;
  let looping = false;

  function render() {
    renderer.render(scene, camera);
    if (container.dataset.scene !== "ready") container.dataset.scene = "ready";
  }

  function frame(now) {
    const dt = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    elapsed += dt;
    update(dt, elapsed);
    render();

    // Under reduced motion, keep running only while the user is spinning the cup.
    if (reducedMotion.matches && !dragging && Math.abs(spinVelocity) < 0.01) stopLoop();
  }

  function startLoop() {
    if (looping || !visible || document.hidden) return;
    looping = true;
    lastTime = null;
    renderer.setAnimationLoop(frame);
  }

  function stopLoop() {
    looping = false;
    renderer.setAnimationLoop(null);
  }

  function refresh() {
    if (!visible || document.hidden) return stopLoop();
    if (reducedMotion.matches) {
      stopLoop();
      update(0, elapsed);
      render();
    } else {
      startLoop();
    }
  }

  new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (!looping) {
      update(0, elapsed);
      render();
    }
  }).observe(canvas);

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    refresh();
  }).observe(container);

  document.addEventListener("visibilitychange", refresh);
  reducedMotion.addEventListener("change", refresh);

  update(0, elapsed);
  render();
  refresh();
}

// Geometry & textures -------------------------------------------------------------------

/** Ellipsoid with a flattened face and an S-shaped centre crease. */
function coffeeBeanGeometry() {
  let geometry = new THREE.SphereGeometry(1, 128, 72);
  geometry.deleteAttribute("normal");
  geometry.deleteAttribute("uv");
  geometry = mergeVertices(geometry);

  const position = geometry.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i);
    let x = v.x * 0.66;
    const y = v.y;
    let z = v.z * 0.5;

    if (z > 0) {
      z *= 0.72;
      const centre = 0.07 * Math.sin(y * 3.2);
      const distance = x - centre;
      const taper = Math.sqrt(Math.max(0, 1 - (y / 0.93) ** 2));
      const facing = Math.min(1, z / 0.12);
      z -= 0.15 * Math.exp(-((distance / 0.075) ** 2)) * taper * facing;
    }
    position.setXYZ(i, x, y, z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

/** Smooth a lathe profile through control points; x is clamped to stay on the axis side. */
function smoothProfile(points, divisions) {
  const curve = new THREE.SplineCurve(points.map(([x, y]) => new THREE.Vector2(x, y)));
  return curve.getSpacedPoints(divisions).map((p) => new THREE.Vector2(Math.max(0, p.x), p.y));
}

function latteArtTexture(anisotropy) {
  const size = 512;
  const r = size / 2;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const random = seededRandom(3);

  // Crema
  const crema = ctx.createRadialGradient(r, r * 1.04, r * 0.1, r, r, r);
  crema.addColorStop(0, "#b97c47");
  crema.addColorStop(0.55, "#9c5e31");
  crema.addColorStop(0.86, "#7b4423");
  crema.addColorStop(1, "#58301a");
  ctx.fillStyle = crema;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 1600; i++) {
    const a = random() * Math.PI * 2;
    const d = Math.sqrt(random()) * r;
    ctx.fillStyle = random() < 0.5 ? `rgba(60,30,12,${random() * 0.2})` : `rgba(226,178,128,${random() * 0.18})`;
    ctx.beginPath();
    ctx.arc(r + Math.cos(a) * d, r + Math.sin(a) * d, random() * 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Layered heart
  const heart = (s, cy) => {
    ctx.beginPath();
    ctx.moveTo(r, cy + s * 0.62);
    ctx.bezierCurveTo(r - s * 1.05, cy - s * 0.02, r - s * 0.6, cy - s * 0.82, r, cy - s * 0.3);
    ctx.bezierCurveTo(r + s * 0.6, cy - s * 0.82, r + s * 1.05, cy - s * 0.02, r, cy + s * 0.62);
    ctx.closePath();
  };
  const s = r * 0.8;
  const cy = r * 0.98;

  ctx.save();
  ctx.shadowColor = "rgba(90, 45, 20, 0.55)";
  ctx.shadowBlur = 22;
  heart(s, cy);
  ctx.fillStyle = "#f8eddf";
  ctx.fill();
  ctx.restore();

  ctx.lineWidth = 5;
  ctx.strokeStyle = "rgba(178, 124, 76, 0.5)";
  for (const k of [0.66, 0.47, 0.3]) {
    heart(s * k, cy - s * (1 - k) * 0.28);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(248, 237, 223, 0.95)";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(r, cy - s * 0.55);
  ctx.quadraticCurveTo(r + 4, cy, r, cy + s * 0.7);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
}

function softShadowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, "rgba(60, 32, 16, 0.5)");
  gradient.addColorStop(0.55, "rgba(60, 32, 16, 0.18)");
  gradient.addColorStop(1, "rgba(60, 32, 16, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function seededRandom(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
