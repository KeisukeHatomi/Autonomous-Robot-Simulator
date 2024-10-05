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

const point2D = () => {
  //２点間の角度
  function PointToAngle(ps, pe) {
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
  function UnitToAngle(p) {
    return PointToAngle(new Point(0, 0), p);
  }

  //２点間の距離
  function PointToDistance(ps, pe) {
    return Math.sqrt(Math.pow(pe.x - ps.x, 2) + Math.pow(pe.y - ps.y, 2));
  }

  //２点間の単位ベクトル
  function PointToUnit(ps, pe) {
    let d = PointToDistance(ps, pe);
    let u = new Point(0, 0);
    u.x = (pe.x - ps.x) / d;
    u.y = (pe.y - ps.y) / d;
    return u;
  }

  //角度の単位ベクトル
  function AngleToUnit(rad) {
    return new Point(Math.cos(rad), -Math.sin(rad));
  }

  //座標回転
  function Rotate(p, rad) {
    let po = new Point(0, 0);
    po.x = p.x * Math.cos(rad) + p.y * Math.sin(rad);
    po.y = -p.x * Math.sin(rad) + p.y * Math.cos(rad);
    return po;
  }

  //座標平行移動
  function Translate(p0, t) {
    return new Point(p0.x + t.x, p0.y + t.y);
  }

  //Degree → Radian 変換
  function DegToRad(deg) {
    return (deg * Math.PI) / 180;
  }
  //Radian → Degree 変換
  function RadToDeg(rad) {
    return (rad / Math.PI) * 180;
  }

  //ワールド座標 → クライアント座標変換
  function WorldToClientPositionX(wpx) {
    return wpx * scale - offset.x;
  }
  function WorldToClientPositionY(wpy) {
    return wpy * scale - offset.y;
  }
  function WorldToClientPosition(wp) {
    let cpx = WorldToClientPositionX(wp.x);
    let cpy = WorldToClientPositionY(wp.y);
    return new Point(cpx, cpy);
  }
  function WorldToClientScale(scl) {
    return scl * scale;
  }

  //クライアント座標 → ワールド座標変換
  function ClientToWorldPositionX(cpx) {
    return (cpx + offset.x) / scale;
  }
  function ClientToWorldPositionY(cpy) {
    return (cpy + offset.y) / scale;
  }
  function ClientToWorldPosition(cp) {
    let wpx = ClientToWorldPositionX(cp.x);
    let wpy = ClientToWorldPositionY(cp.y);
    return new Point(wpx, wpy);
  }
};

export default point2D();