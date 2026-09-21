// CycleSave mark: six lime dots in a circle around a black centre (a rotating cycle).
export default function Logo() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="5" fill="#0a0a0a" />
      {[[26, 16], [21, 24.66], [11, 24.66], [6, 16], [11, 7.34], [21, 7.34]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill="#b6e64c" />
      ))}
    </svg>
  );
}
