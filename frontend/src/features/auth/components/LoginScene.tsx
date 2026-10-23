import { useEffect, useRef } from 'react';

type Star = {
    position: [number, number, number];
    size: number;
    color: { r: number; g: number; b: number };
    speed?: number;
};

const vertexShader = `
attribute float size;
attribute float phase;
attribute float speed;
attribute vec3 color;
uniform float t;
uniform float pr;
varying vec3 vC;
varying float vA;
void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float tw = 0.5 + 0.5 * sin(t * speed + phase);
    vA = 0.3 + 0.7 * tw * tw;
    vC = color;
    gl_PointSize = size * pr * (56.0 / -mv.z) * (0.7 + 0.55 * tw);
    gl_Position = projectionMatrix * mv;
}`;

const fragmentShader = `
varying vec3 vC;
varying float vA;
void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float core = pow(smoothstep(0.5, 0.0, d), 1.6);
    float halo = exp(-d * d * 28.0) * 0.5;
    float cross = max(0.0, 1.0 - abs(c.x) * 16.0) * max(0.0, 1.0 - abs(c.y) * 2.1)
        + max(0.0, 1.0 - abs(c.y) * 16.0) * max(0.0, 1.0 - abs(c.x) * 2.1);
    float a = min(1.0, (core + halo + cross * 0.6) * vA);
    if (a < 0.01) discard;
    gl_FragColor = vec4(vC * a, a);
}`;

// Star field with a clock whose hour, minute and second hands follow Vietnam time
// (frontend/ui/Shiftly Dang nhap.html, "Sao lấp lánh" scene).
export function LoginScene() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let disposed = false;
        let cleanup: (() => void) | undefined;

        void import('three').then((THREE) => {
            if (disposed) return;

            let renderer: InstanceType<typeof THREE.WebGLRenderer>;
            try {
                renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            } catch {
                return; // No WebGL: the dark panel still reads fine without the scene.
            }

            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.domElement.style.cssText = 'display:block;width:100%;height:100%';
            container.appendChild(renderer.domElement);

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
            camera.position.set(0, 0, 14);
            const uniforms = {
                t: { value: 0 },
                pr: { value: renderer.getPixelRatio() },
            };
            const material = new THREE.ShaderMaterial({
                uniforms,
                vertexShader,
                fragmentShader,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            });

            let seed = 7;
            const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
            const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;
            const colors = {
                ink: new THREE.Color(0xf2f0eb),
                warm: new THREE.Color(0xffd2ad),
                dim: new THREE.Color(0x8a8577),
                ember: new THREE.Color(0xe06a2c),
            };
            const geometries: Array<InstanceType<typeof THREE.BufferGeometry>> = [];

            const points = (stars: Star[]) => {
                const count = stars.length;
                const position = new Float32Array(count * 3);
                const color = new Float32Array(count * 3);
                const size = new Float32Array(count);
                const phase = new Float32Array(count);
                const speed = new Float32Array(count);

                stars.forEach((star, index) => {
                    position.set(star.position, index * 3);
                    color.set([star.color.r, star.color.g, star.color.b], index * 3);
                    size[index] = star.size;
                    phase[index] = rnd() * 6.283;
                    speed[index] = star.speed ?? 0.6 + rnd() * 2.4;
                });

                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
                geometry.setAttribute('color', new THREE.BufferAttribute(color, 3));
                geometry.setAttribute('size', new THREE.BufferAttribute(size, 1));
                geometry.setAttribute('phase', new THREE.BufferAttribute(phase, 1));
                geometry.setAttribute('speed', new THREE.BufferAttribute(speed, 1));
                geometries.push(geometry);

                return new THREE.Points(geometry, material);
            };

            const field: Star[] = [];
            for (let i = 0; i < 2400; i++) {
                const r = rnd();
                field.push({
                    position: [(rnd() - 0.5) * 64, (rnd() - 0.5) * 40, -32 + rnd() * 36],
                    size: 1.4 + Math.pow(rnd(), 3) * 5,
                    color: r < 0.04 ? colors.ember : r < 0.2 ? colors.warm : r < 0.45 ? colors.dim : colors.ink,
                });
            }
            const fieldPoints = points(field);
            scene.add(fieldPoints);

            const dial = new THREE.Group();
            // A slight tilt keeps the 3D feel while 12 o'clock stays up and the hands stay readable.
            dial.rotation.set(-0.45, 0.2, 0);
            scene.add(dial);

            // 12-hour clock face: 12 o'clock points up, time runs clockwise.
            const angle = (hour: number) => Math.PI / 2 - ((hour % 12) / 12) * Math.PI * 2;
            const ring: Star[] = [];
            for (let i = 0; i < 1500; i++) {
                const a = rnd() * 6.283;
                const r = 4.3 + gauss() * 0.16;
                ring.push({
                    position: [Math.cos(a) * r, Math.sin(a) * r, gauss() * 0.08],
                    size: 0.7 + rnd() * 1.1,
                    color: rnd() < 0.5 ? colors.dim : colors.ink,
                });
            }
            // Minute ticks, longer marks on the hours and longest on 12, 3, 6 and 9.
            for (let minute = 0; minute < 60; minute++) {
                const a = angle(minute / 5);
                const hourMark = minute % 5 === 0;
                const major = minute % 15 === 0;
                const length = major ? 7 : hourMark ? 4 : 1;
                for (let j = 0; j < length; j++) {
                    const r = 4.7 + j * 0.09;
                    ring.push({
                        position: [Math.cos(a) * r, Math.sin(a) * r, 0],
                        size: major ? 3.2 : hourMark ? 2.2 : 1.3,
                        color: hourMark ? colors.ink : colors.dim,
                        speed: 1.2,
                    });
                }
            }
            // Shift arcs (start/end hour) inside the clock face.
            (
                [
                    [6, 14, 3.55, colors.ink],
                    [8, 17, 3.15, colors.ink],
                    [14, 22, 2.75, colors.ember],
                    [17, 23, 2.35, colors.warm],
                ] as const
            ).forEach(([start, end, radius, color]) => {
                const count = Math.round((end - start) * 26);
                for (let i = 0; i < count; i++) {
                    const a = angle(start + (end - start) * (i / count) + gauss() * 0.04);
                    const r = radius + gauss() * 0.06;
                    ring.push({
                        position: [Math.cos(a) * r, Math.sin(a) * r, gauss() * 0.05],
                        size: 1.2 + rnd() * 1.8,
                        color,
                    });
                }
                [start, end].forEach((hour) =>
                    ring.push({
                        position: [Math.cos(angle(hour)) * radius, Math.sin(angle(hour)) * radius, 0],
                        size: 4.5,
                        color,
                        speed: 1.6,
                    }),
                );
            });
            ring.push({ position: [0, 0, 0], size: 7, color: colors.ember, speed: 1.4 });
            dial.add(points(ring));

            const makeHand = (
                length: number,
                count: number,
                fromSize: number,
                toSize: number,
                tipSize: number,
                color: Star['color'],
                width: number,
            ) => {
                const hand = new THREE.Group();
                const stars: Star[] = [];
                for (let i = 0; i < count; i++) {
                    const r = 0.35 + (i / count) * length;
                    for (let k = 0; k < width; k++) {
                        stars.push({
                            position: [(k - (width - 1) / 2) * 0.07, r, 0.02 + gauss() * 0.02],
                            size: fromSize + (i / count) * (toSize - fromSize),
                            color,
                            speed: 2.5,
                        });
                    }
                }
                stars.push({ position: [0, length + 0.4, 0.02], size: tipSize, color, speed: 1.8 });
                hand.add(points(stars));
                dial.add(hand);
                return hand;
            };
            const hourHand = makeHand(2.5, 40, 2.2, 3, 7, colors.ember, 3);
            const minuteHand = makeHand(3.9, 70, 1.8, 2.8, 5.5, colors.ink, 2);
            const secondHand = makeHand(4.3, 90, 1.3, 1.9, 4, colors.ember, 1);
            const vietnamNow = () => {
                const ms = Date.now() + 7 * 3600000;
                return { h: (ms / 3600000) % 24, m: (ms / 60000) % 60, s: (ms / 1000) % 60 };
            };

            const shootGeometry = new THREE.BufferGeometry();
            shootGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
            shootGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array([1, 0.95, 0.9, 0, 0, 0]), 3));
            geometries.push(shootGeometry);
            const shootMaterial = new THREE.LineBasicMaterial({
                vertexColors: true,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            });
            const shoot = new THREE.Line(shootGeometry, shootMaterial);
            scene.add(shoot);
            let shootNext = 2.5;
            let shootStart = -10;
            let shootFrom: [number, number, number] | null = null;

            let base = { x: 3.4, y: 0.9 };
            let dialScale = 1.3;
            const resize = () => {
                const width = container.clientWidth;
                const height = container.clientHeight;
                if (!width || !height) return;
                renderer.setSize(width, height, false);
                const aspect = width / height;
                camera.aspect = aspect;
                camera.position.z = 13 * Math.max(1, 1.35 / aspect);
                base = aspect < 1.3 ? { x: 0.8, y: 3.2 } : { x: 4.2, y: 0.6 };
                dialScale = aspect < 1.3 ? 1.15 : 1.35;
                camera.updateProjectionMatrix();
            };
            const resizeObserver = new ResizeObserver(resize);
            resizeObserver.observe(container);
            resize();

            let mouseX = 0;
            let mouseY = 0;
            let targetX = 0;
            let targetY = 0;
            const handlePointerMove = (event: PointerEvent) => {
                const rect = container.getBoundingClientRect();
                targetX = (event.clientX - rect.left) / rect.width - 0.5;
                targetY = (event.clientY - rect.top) / rect.height - 0.5;
            };
            window.addEventListener('pointermove', handlePointerMove);

            const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const startedAt = performance.now();
            let frame = 0;
            const tick = () => {
                const t = still ? 6 : (performance.now() - startedAt) / 1000;
                uniforms.t.value = t;
                const intro = 1 - Math.pow(1 - Math.min(1, t / 2.2), 3);
                dial.scale.setScalar(dialScale * (0.7 + 0.3 * intro));
                dial.position.set(base.x, base.y, 0);
                fieldPoints.rotation.y = t * 0.008;
                fieldPoints.rotation.x = Math.sin(t * 0.05) * 0.02;

                // Hands are built pointing at 12; rotate clockwise by the elapsed fraction.
                const now = vietnamNow();
                hourHand.rotation.z = -((now.h % 12) / 12) * Math.PI * 2;
                minuteHand.rotation.z = -(now.m / 60) * Math.PI * 2;
                secondHand.rotation.z = -(Math.floor(now.s) / 60) * Math.PI * 2;

                mouseX += (targetX - mouseX) * 0.04;
                mouseY += (targetY - mouseY) * 0.04;
                camera.position.x = mouseX * 2.2;
                camera.position.y = -mouseY * 1.4;
                camera.lookAt(base.x * 0.35, base.y * 0.35, 0);

                shoot.visible = false;
                if (!still) {
                    if (t > shootNext) {
                        shootStart = t;
                        shootNext = t + 4 + rnd() * 5;
                        shootFrom = [base.x + 2 + rnd() * 10, 6 + rnd() * 5, -4 - rnd() * 6];
                    }
                    const k = (t - shootStart) / 0.9;
                    if (k >= 0 && k <= 1 && shootFrom) {
                        const headX = shootFrom[0] - k * 9;
                        const headY = shootFrom[1] - k * 4.5;
                        const length = 2.6 * Math.sin(k * Math.PI);
                        const attribute = shootGeometry.attributes.position;
                        (attribute.array as Float32Array).set([
                            headX, headY, shootFrom[2],
                            headX + length, headY + length * 0.5, shootFrom[2],
                        ]);
                        attribute.needsUpdate = true;
                        shootMaterial.opacity = Math.sin(k * Math.PI);
                        shoot.visible = true;
                    }
                }

                renderer.render(scene, camera);
                frame = requestAnimationFrame(tick);
            };
            tick();

            cleanup = () => {
                cancelAnimationFrame(frame);
                resizeObserver.disconnect();
                window.removeEventListener('pointermove', handlePointerMove);
                geometries.forEach((geometry) => geometry.dispose());
                material.dispose();
                shootMaterial.dispose();
                renderer.dispose();
                renderer.domElement.remove();
            };
        });

        return () => {
            disposed = true;
            cleanup?.();
        };
    }, []);

    return <div aria-hidden="true" className="absolute inset-0" ref={containerRef} />;
}
