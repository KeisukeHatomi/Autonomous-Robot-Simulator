//
//　座標計算関数ライブラリ
//

//座標クラス
export class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  AddPoint(p) {
    return new Point(this.x + p.x, this.y + p.y);
  }
  AddXY(px, py) {
    return new Point(this.x + px, this.y + py);
  }
  SubPoint(p) {
    return new Point(this.x - p.x, this.y - p.y);
  }
  SubXY(px, py) {
    return new Point(this.x - px, this.y - py);
  }
  MulValue(c) {
    return new Point(this.x * c, this.y * c);
  }
  static Zero() {
    return new Point(0, 0);
  }
}

//２点間の角度
export function PointToAngle(ps, pe) {
  let dx = pe.x - ps.x;
  let dy = pe.y - ps.y;

  if (dx == 0 && dy > 0) return (Math.PI / 2) * 3;
  if (dx == 0 && dy < 0) return Math.PI / 2;
  if (dx > 0 && dy == 0) return 0.0;
  if (dx < 0 && dy == 0) return Math.PI;
  if (dx < 0) return Math.atan(-dy / dx) + Math.PI;
  if (dx > 0 && dy < 0) return Math.atan(-dy / dx);

  return Math.atan(-dy / dx);
}

//単位ベクトルから角度
export function UnitToAngle(p) {
  return PointToAngle(new Point(0, 0), p);
}

//２点間の距離
export function PointToDistance(ps, pe) {
  return Math.sqrt(Math.pow(pe.x - ps.x, 2) + Math.pow(pe.y - ps.y, 2));
}

//２点間の単位ベクトル
export function PointToUnit(ps, pe) {
  let d = PointToDistance(ps, pe);
  let u = new Point(0, 0);
  u.x = (pe.x - ps.x) / d;
  u.y = (pe.y - ps.y) / d;
  return u;
}

//角度の単位ベクトル
export function AngleToUnit(rad) {
  return new Point(Math.cos(rad), -Math.sin(rad));
}

//座標回転
export function Rotate(p, rad) {
  let po = new Point(0, 0);
  po.x = p.x * Math.cos(rad) + p.y * Math.sin(rad);
  po.y = -p.x * Math.sin(rad) + p.y * Math.cos(rad);
  return po;
}

//座標平行移動
export function Translate(p0, t) {
  return new Point(p0.x + t.x, p0.y + t.y);
}

//Degree → Radian 変換
export function DegToRad(deg) {
  return (deg * Math.PI) / 180;
}
//Radian → Degree 変換
export function RadToDeg(rad) {
  return (rad / Math.PI) * 180;
}

//ワールド座標 → クライアント座標変換
export function WorldToClientPositionX(wpx, scale, offset) {
  return wpx * scale - offset.x;
}
export function WorldToClientPositionY(wpy, scale, offset) {
  return wpy * scale - offset.y;
}
export function WorldToClientPosition(wp, scale, offset) {
  let cpx = WorldToClientPositionX(wp.x, scale, offset);
  let cpy = WorldToClientPositionY(wp.y, scale, offset);
  return new Point(cpx, cpy);
}
export function WorldToClientScale(scl, scale) {
  return scl * scale;
}

//クライアント座標 → ワールド座標変換
export function ClientToWorldPositionX(cpx, scale, offset) {
  return (cpx + offset.x) / scale;
}
export function ClientToWorldPositionY(cpy, scale, offset) {
  return (cpy + offset.y) / scale;
}
export function ClientToWorldPosition(cp, scale, offset) {
  let wpx = ClientToWorldPositionX(cp.x, scale, offset);
  let wpy = ClientToWorldPositionY(cp.y, scale, offset);
  return new Point(wpx, wpy);
}
