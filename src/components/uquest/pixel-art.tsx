export function HeroAvatar() {
  return (
    <div className="hero-stage">
      <div className="pixel-person">
        <div className="hair" />
        <div className="head" />
        <div className="body" />
        <div className="leg1" />
        <div className="leg2" />
      </div>
      <div className="ground" />
      <div className="big-sword" />
    </div>
  );
}

export function MiniAvatar() {
  return (
    <div className="avatar-mini">
      <div className="mini-head" />
      <div className="mini-body" />
      <div className="mini-sword" />
    </div>
  );
}

export function TreeArt({ hitKey }: { hitKey: number }) {
  return (
    <div className={`tree${hitKey ? " hit" : ""}`} id="tree" key={`tree-${hitKey}`}>
      <div className="leaf one" />
      <div className="leaf two" />
      <div className="leaf three" />
      <div className="trunk" />
    </div>
  );
}

export function PixelSword({ upgrading }: { upgrading: boolean }) {
  return (
    <div className={`pixel-sword${upgrading ? " upgrading" : ""}`}>
      <div className="blade-tip" />
      <div className="blade" />
      <div className="guard" />
      <div className="handle" />
    </div>
  );
}
