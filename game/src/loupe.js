// loupe.js — the magnifier: a circular 2x zoom lens that follows the pointer over either
// panel. It re-renders the panel's offscreen canvas scaled, then redraws any found-ring
// markers that fall inside the lens, a rim and a crosshair.

export const LOUPE_R = 92;
const ZOOM = 2;

export function drawLoupe(ctx, panels, found, diffs, px, py, sx, sy) {
  // px,py = pointer in canvas coords; sx,sy = pointer in scene coords of the hovered panel.
  const src = panels;
  ctx.save();
  ctx.beginPath();
  ctx.arc(px, py, LOUPE_R, 0, Math.PI * 2);
  ctx.clip();
  const half = LOUPE_R / ZOOM;
  ctx.drawImage(src, sx - half, sy - half, half * 2, half * 2, px - LOUPE_R, py - LOUPE_R, LOUPE_R * 2, LOUPE_R * 2);
  // rings inside the lens
  for (const d of diffs) {
    if (!found.has(d.id)) continue;
    const dx = px + (d.x - sx) * ZOOM, dy = py + (d.y - sy) * ZOOM;
    if (Math.hypot(dx - px, dy - py) > LOUPE_R) continue;
    ctx.strokeStyle = '#2ee66b'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(dx, dy, d.r * ZOOM * 0.62, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(dx, dy, d.r * ZOOM * 0.62 + 3, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
  // rim + handle + crosshair
  ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(px, py, LOUPE_R, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#14213d'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(px, py, LOUPE_R + 3, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(px - 12, py); ctx.lineTo(px + 12, py);
  ctx.moveTo(px, py - 12); ctx.lineTo(px, py + 12);
  ctx.stroke();
  ctx.save();
  ctx.translate(px + LOUPE_R * 0.72, py + LOUPE_R * 0.72); ctx.rotate(Math.PI / 4);
  ctx.fillStyle = '#8a6642'; ctx.fillRect(-6, 0, 12, 34);
  ctx.fillStyle = '#6f4f30'; ctx.fillRect(-6, 26, 12, 8);
  ctx.restore();
  ctx.fillStyle = '#14213d';
  ctx.font = '700 13px system-ui, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('2×', px, py - LOUPE_R - 10);
}
