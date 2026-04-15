const PARTICLES = [
  { left: '6%', top: '18%', size: '10px', delay: '0s', duration: '14s' },
  { left: '14%', top: '62%', size: '14px', delay: '1.4s', duration: '18s' },
  { left: '24%', top: '30%', size: '8px', delay: '2.1s', duration: '12s' },
  { left: '33%', top: '72%', size: '12px', delay: '0.8s', duration: '16s' },
  { left: '42%', top: '20%', size: '16px', delay: '3.2s', duration: '20s' },
  { left: '54%', top: '56%', size: '9px', delay: '1.8s', duration: '15s' },
  { left: '63%', top: '16%', size: '13px', delay: '2.8s', duration: '17s' },
  { left: '71%', top: '70%', size: '11px', delay: '0.4s', duration: '13s' },
  { left: '79%', top: '36%', size: '7px', delay: '1.1s', duration: '11s' },
  { left: '88%', top: '58%', size: '15px', delay: '2.5s', duration: '19s' },
];

const STREAKS = [
  { left: '12%', top: '14%', width: '28%', delay: '0s', duration: '18s', rotate: '-10deg' },
  { left: '48%', top: '28%', width: '34%', delay: '3s', duration: '20s', rotate: '8deg' },
  { left: '18%', top: '72%', width: '30%', delay: '5s', duration: '16s', rotate: '-6deg' },
];

export default function DashboardBackdrop({ variant = 'default' }) {
  return (
    <div className={`dashboard-backdrop dashboard-backdrop-${variant}`} aria-hidden="true">
      <div className="dashboard-backdrop-grid" />
      <div className="dashboard-backdrop-vignette" />

      <div className="dashboard-aurora dashboard-aurora-one" />
      <div className="dashboard-aurora dashboard-aurora-two" />
      <div className="dashboard-aurora dashboard-aurora-three" />

      <div className="dashboard-orbit dashboard-orbit-one" />
      <div className="dashboard-orbit dashboard-orbit-two" />

      {STREAKS.map((streak, index) => (
        <span
          key={`streak-${index}`}
          className="dashboard-streak"
          style={{
            '--streak-left': streak.left,
            '--streak-top': streak.top,
            '--streak-width': streak.width,
            '--streak-delay': streak.delay,
            '--streak-duration': streak.duration,
            '--streak-rotate': streak.rotate,
          }}
        />
      ))}

      {PARTICLES.map((particle, index) => (
        <span
          key={`particle-${index}`}
          className="dashboard-particle"
          style={{
            '--particle-left': particle.left,
            '--particle-top': particle.top,
            '--particle-size': particle.size,
            '--particle-delay': particle.delay,
            '--particle-duration': particle.duration,
          }}
        />
      ))}
    </div>
  );
}
