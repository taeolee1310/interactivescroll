import React, { useEffect, useRef } from "react";

const ParticleAnimation = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // --- [이미지 속 상수 및 설정] ---
    const GRID_SIZE = 45;
    const PARTICLE_COUNT = 1000;
    const FOV = 800;

    let width, height, sizeMult;
    let particles = [];

    const modes = ["grid", "warp", "circle", "sphere", "cube"];
    let modeIdx = 0;
    let currentMode = modes[modeIdx];
    let isTransitioning = false;

    let rotation = { x: 0, y: 0 };
    let targetRotation = { x: 0, y: 0 };
    let mouse = { x: 0, y: 0, isActive: false };

    // --- [이미지 #2, #4의 Particle 클래스 완벽 이식] ---
    class Particle {
      constructor(id, total) {
        this.id = id;
        this.total = total;
        this.renderX = 0; // 이미지 하단 renderX 초기화 반영
        this.renderY = 0;
        this.init();

        // 초기 위치 (공간 분산)
        this.x = (Math.random() - 0.5) * 2000;
        this.y = (Math.random() - 0.5) * 2000;
        this.z = (Math.random() - 0.5) * 2000;
      }

      init() {
        sizeMult = width < 768 ? 1 : 1.5;
        const isMobile = width < 768;

        // [기본 속성]
        this.baseRadius = (Math.random() * 0.4 + 0.6) * sizeMult;
        this.disperseRadius = (Math.random() * 0.8 + 0.3) * sizeMult;
        this.radius = this.baseRadius;
        this.randomOpacity = 0.3 + Math.random() * 0.7;

        // [SECTION 1 DATA] Grid
        this.gridX = 0;
        this.gridY = 0;
        this.gridAxis = Math.random() > 0.5 ? "x" : "y";
        this.gridSpeed =
          (Math.random() > 0.5 ? 1 : -1) * (0.6 + Math.random() * 1.0);
        this.alignToGrid();

        // [SECTION 2 DATA] Warp
        this.warpZ = Math.random() * 1500;
        this.warpAngle = Math.random() * Math.PI * 2;
        this.warpDist = Math.random() * 900;

        // [SECTION 3 DATA] Circle
        const cAngle = (this.id / this.total) * Math.PI * 2;
        const cRadius = Math.min(width, height) * (isMobile ? 0.57 : 0.38);
        this.circleThickness = (Math.random() - 0.5) * 85;
        this.circleX =
          width / 2 + Math.cos(cAngle) * (cRadius + this.circleThickness);
        this.circleY =
          height / 2 + Math.sin(cAngle) * (cRadius + this.circleThickness);

        // 유영(Roaming) 속성
        this.isRoaming = Math.random() < 0.15;
        this.roamFactor = 60 + Math.random() * 120;
        this.roamFreq = 0.0006 + Math.random() * 0.0012;

        // Sphere Floating
        this.isSphereFloating = Math.random() < 0.2;

        // [SECTION 4 DATA] Sphere (Perfect Geometry)
        const phi = Math.acos(1 - 2 * (this.id / this.total));
        const sTheta = Math.PI * (1 + Math.sqrt(5)) * this.id;
        this.sphereNormX = Math.sin(phi) * Math.cos(sTheta);
        this.sphereNormY = Math.sin(phi) * Math.sin(sTheta);
        this.sphereNormZ = Math.cos(phi);

        const sRadius = 400;
        this.sphereX = this.sphereNormX * sRadius + width / 2;
        this.sphereY = this.sphereNormY * sRadius + height / 2;
        this.sphereZ = this.sphereNormZ * sRadius;

        // [SECTION 5 DATA] Cyber Cube (Perfect Center)
        const side = Math.ceil(Math.pow(this.total, 1 / 3));
        const offset = (side - 1) / 2;
        const cx = (this.id % side) - offset;
        const cy = (Math.floor(this.id / side) % side) - offset;
        const cz = Math.floor(this.id / (side * side)) - offset;

        this.cubeNormX = cx;
        this.cubeNormY = cy;
        this.cubeNormZ = cz;
        this.cubeSpacing = Math.min(width, height) * (isMobile ? 0.18 : 0.06);

        this.cubeX = width / 2 + this.cubeNormX * this.cubeSpacing;
        this.cubeY = height / 2 + this.cubeNormY * this.cubeSpacing;
        this.cubeZ = this.cubeNormZ * this.cubeSpacing;
      }

      // [alignToGrid 함수 완벽 이식]
      alignToGrid() {
        const offsetX = (width % GRID_SIZE) / 2;
        const offsetY = (height % GRID_SIZE) / 2;
        const sx = Math.random() * width;
        const sy = Math.random() * height;

        if (this.gridAxis === "x") {
          this.lineCoord =
            Math.round((sx - offsetX) / GRID_SIZE) * GRID_SIZE + offsetX;
          this.gridX = this.lineCoord;
          this.gridY = sy;
        } else {
          this.lineCoord =
            Math.round((sy - offsetY) / GRID_SIZE) * GRID_SIZE + offsetY;
          this.gridY = this.lineCoord;
          this.gridX = sx;
        }
      }

      update(mode) {
        let tx = 0,
          ty = 0,
          tz = 0;

        if (mode === "grid") {
          tx = this.gridX;
          ty = this.gridY;
          tz = 0;
        } else if (mode === "warp") {
          const time = Date.now() * 0.001;
          tx = width / 2 + Math.cos(this.warpAngle) * this.warpDist;
          ty = height / 2 + Math.sin(this.warpAngle) * this.warpDist;
          tz = ((this.warpZ + time * 600) % 1500) - 750;
        } else if (mode === "circle") {
          tx = this.circleX;
          ty = this.circleY;
          tz = 0;
          if (this.isRoaming) {
            const t = Date.now();
            tx += Math.sin(t * this.roamFreq) * this.roamFactor;
            ty += Math.cos(t * this.roamFreq) * this.roamFactor;
          }
        } else if (mode === "sphere") {
          tx = this.sphereX;
          ty = this.sphereY;
          tz = this.sphereZ;
          if (this.isSphereFloating) {
            tx += Math.sin(Date.now() * 0.001 + this.id) * 20;
          }
        } else if (mode === "cube") {
          tx = this.cubeX;
          ty = this.cubeY;
          tz = this.cubeZ;
        }

        // Pro-Level Lerp (보간)
        this.x += (tx - this.x) * 0.07;
        this.y += (ty - this.y) * 0.07;
        this.z += (tz - this.z) * 0.07;
      }

      draw(centerX, centerY) {
        // 중심점 기준 상대 좌표 계산
        let rx = this.x - centerX;
        let ry = this.y - centerY;
        let rz = this.z;

        // 3D 회전
        let x1 = rx * Math.cos(rotation.y) - rz * Math.sin(rotation.y);
        let z1 = rz * Math.cos(rotation.y) + rx * Math.sin(rotation.y);
        let y1 = ry * Math.cos(rotation.x) - z1 * Math.sin(rotation.x);
        let z2 = z1 * Math.cos(rotation.x) + ry * Math.sin(rotation.x);

        if (z2 > -FOV) {
          const scale = FOV / (FOV + z2);
          this.renderX = x1 * scale + centerX;
          this.renderY = y1 * scale + centerY;

          // [이미지 #3 비주얼 반영] Cyan Glow
          const alpha = this.randomOpacity * Math.min(1, (z2 + FOV) / FOV);
          ctx.fillStyle = `rgba(74, 222, 222, ${alpha})`;

          // 글로우 효과 (성능을 위해 원 하나만 더 그림)
          if (alpha > 0.6) {
            ctx.shadowBlur = 4;
            ctx.shadowColor = "rgba(74, 222, 222, 0.5)";
          }

          ctx.beginPath();
          ctx.arc(
            this.renderX,
            this.renderY,
            this.baseRadius * scale,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.shadowBlur = 0; // 초기화
        }
      }
    }

    const init = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++)
        particles.push(new Particle(i, PARTICLE_COUNT));
    };

    const animate = () => {
      ctx.fillStyle = "#020d14"; // 이미지 #3의 배경색
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // 마우스 인터랙션
      if (mouse.isActive) {
        targetRotation.x = (mouse.y - cy) * 0.0005;
        targetRotation.y = (mouse.x - cx) * 0.0005;
      } else {
        targetRotation.x = Math.sin(Date.now() * 0.0005) * 0.1;
        targetRotation.y += 0.001;
      }

      rotation.x += (targetRotation.x - rotation.x) * 0.05;
      rotation.y += (targetRotation.y - rotation.y) * 0.05;

      particles.forEach((p) => {
        p.update(currentMode);
        p.draw(cx, cy);
      });
      requestAnimationFrame(animate);
    };

    const handleWheel = (e) => {
      if (isTransitioning) return;
      if (Math.abs(e.deltaY) < 10) return;
      modeIdx =
        e.deltaY > 0
          ? (modeIdx + 1) % modes.length
          : (modeIdx - 1 + modes.length) % modes.length;
      currentMode = modes[modeIdx];
      isTransitioning = true;
      setTimeout(() => (isTransitioning = false), 1200);
    };

    window.addEventListener("resize", init);
    window.addEventListener("wheel", handleWheel);
    window.addEventListener("mousemove", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.isActive = true;
    });
    window.addEventListener("mouseleave", () => {
      mouse.isActive = false;
    });

    init();
    animate();

    return () => {
      window.removeEventListener("resize", init);
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // --- [이미지 #1 Elements 구조 및 CSS 반영] ---
  const styles = {
    wScreen: {
      position: "relative",
      width: "100vw",
      height: "100vh",
      overflow: "hidden",
      backgroundColor: "#020d14",
    },
    heroContainer: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      width: "100%",
    },
    gradient: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background:
        "radial-gradient(circle at center, transparent 0%, #020d14 100%)",
      pointerEvents: "none",
      zIndex: 2,
    },
    contentWrapper: {
      position: "relative",
      zIndex: 10, // 이미지 #1의 z-10 반영
      width: "100%",
      maxWidth: "1110px", // 이미지 #1의 max-w-[1110px] 반영
      margin: "0 auto",
      padding: "128px 15px", // py-32, px-[15px] 반영
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      color: "white",
      pointerEvents: "none",
      textAlign: "center",
    },
  };

  return (
    <div style={styles.wScreen}>
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", top: 0, left: 0 }}
      />
      <div style={styles.gradient} />

      {/* 이미지 #1의 계층 구조 반영 */}
      <div style={styles.heroContainer}>
        <div style={styles.contentWrapper}>
          <h1
            style={{
              fontSize: "clamp(2.5rem, 7vw, 5rem)",
              fontWeight: "800",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            CAREERS V3
          </h1>
          <p
            style={{
              fontSize: "1.1rem",
              marginTop: "20px",
              opacity: 0.6,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
            }}
          >
            Interactive Particle Engine
          </p>
        </div>
      </div>
    </div>
  );
};

export default ParticleAnimation;
