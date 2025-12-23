// ==================== API CONFIG ====================
// ดึงข้อมูลจาก GitHub Gist โดยตรง (สำหรับ Vercel)
const GIST_URL = "https://gist.githubusercontent.com/pumplike115-hub/1807f1da5aeeab3ffbc6b75ee75221f0/raw/bot-stats.json";

let lastData = null;

// ==================== FETCH DATA ====================
async function fetchBotData() {
    try {
        const response = await fetch(GIST_URL + "?t=" + Date.now());
        if (!response.ok) throw new Error("Gist Error");
        const data = await response.json();
        lastData = data;
        updateDashboard(data);
        updateStatusBadge(true);
    } catch (error) {
        console.log("Cannot fetch data:", error.message);
        if (!lastData) updateStatusBadge(false);
    }
}

function updateStatusBadge(online) {
    const badge = document.querySelector('.status-badge');
    if (badge) {
        badge.className = online ? 'status-badge online' : 'status-badge offline';
        badge.textContent = online ? '● ออนไลน์' : '● ออฟไลน์';
    }
}

function updateDashboard(data) {
    smoothUpdate('stat-users', data.users?.toLocaleString() || '0');
    smoothUpdate('stat-servers', data.servers?.toLocaleString() || '0');
    smoothUpdate('stat-clusters', data.clusters || '1');
    smoothUpdate('stat-shards', data.shards || '1');
    smoothUpdate('stat-playing', `${data.playing || 0} / ${data.voice_connections || 0}`);
    smoothUpdate('stat-latency', `${data.latency || 0} ms`);
    
    if (data.clusters_list?.[0]) {
        const c = data.clusters_list[0];
        smoothUpdate('cluster-info', `${c.shards} ชาร์ด • ${c.servers} เซิร์ฟเวอร์ • ${c.users?.toLocaleString()} ผู้ใช้งาน • ${c.latency} ms`);
        smoothUpdate('cluster-latency', `${c.latency} ms`);
    }
    
    if (data.players?.[0]) {
        const p = data.players[0];
        smoothUpdate('player-name', p.name);
        smoothUpdate('player-connections', `${p.connections} ห้อง`);
        smoothUpdate('player-playing', `${p.playing} ห้อง`);
        smoothUpdate('player-uptime', p.uptime);
    }
}

function smoothUpdate(id, value) {
    const el = document.getElementById(id);
    if (el && el.textContent !== value) el.textContent = value;
}

setInterval(fetchBotData, 15000);

// ==================== PAGE NAVIGATION ====================
document.addEventListener('DOMContentLoaded', () => {
    fetchBotData();
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.dataset.page;
            
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            const currentPage = document.querySelector('.page.active');
            const newPage = document.getElementById(`page-${targetPage}`);
            
            if (currentPage && newPage && currentPage !== newPage) {
                currentPage.style.animation = 'fadeOut 0.3s ease forwards';
                setTimeout(() => {
                    currentPage.classList.remove('active');
                    currentPage.style.animation = '';
                    newPage.classList.add('active');
                    newPage.style.animation = 'fadeIn 0.3s ease forwards';
                }, 250);
            }
        });
    });
});

// ==================== PARTICLES ====================
const canvas = document.getElementById('particles-canvas');
const ctx = canvas?.getContext('2d');
let particles = [];
let mouseX = 0, mouseY = 0;

function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

class Particle {
    constructor(x, y, isMouse = false) {
        this.x = x || Math.random() * canvas.width;
        this.y = y || Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 2;
        this.speedY = (Math.random() - 0.5) * 2;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.isMouse = isMouse;
        this.life = isMouse ? 100 : Infinity;
        this.hue = Math.random() * 60 + 300;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (!this.isMouse) {
            const dx = mouseX - this.x, dy = mouseY - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 150 && dist > 0) {
                const f = (150 - dist) / 150;
                this.speedX += (dx/dist) * f * 0.02;
                this.speedY += (dy/dist) * f * 0.02;
            }
        }
        this.speedX *= 0.99;
        this.speedY *= 0.99;
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        if (this.isMouse) { this.life--; this.opacity = this.life / 100; }
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 100%, 70%, ${this.opacity})`;
        ctx.fill();
    }
}

function initParticles() {
    if (!canvas) return;
    particles = [];
    const count = Math.min(60, Math.floor((canvas.width * canvas.height) / 20000));
    for (let i = 0; i < count; i++) particles.push(new Particle());
}

function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 100) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(255, 105, 180, ${(100-dist)/100*0.3})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
    }
}

function animate() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => !p.isMouse || p.life > 0);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    requestAnimationFrame(animate);
}

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    const glow = document.getElementById('mouse-glow');
    if (glow) { glow.style.left = mouseX + 'px'; glow.style.top = mouseY + 'px'; glow.style.opacity = '1'; }
    if (canvas && Math.random() > 0.8) particles.push(new Particle(mouseX, mouseY, true));
});

document.addEventListener('click', (e) => {
    if (!canvas) return;
    for (let i = 0; i < 8; i++) {
        const p = new Particle(e.clientX, e.clientY, true);
        p.speedX = (Math.random() - 0.5) * 8;
        p.speedY = (Math.random() - 0.5) * 8;
        particles.push(p);
    }
});

if (canvas) {
    resizeCanvas();
    initParticles();
    animate();
    window.addEventListener('resize', () => { resizeCanvas(); initParticles(); });
}
