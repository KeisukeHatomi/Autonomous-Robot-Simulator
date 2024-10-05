//
//　クラス
//
// ランドマーククラス
export class CLandMark {
  constructor(type, pos, ang, fix) {
    this.Type = type;
    this.Position = pos;
    this.Angle = ang;
    this.Fix = fix;

    // ランドマークの認識範囲
    this.width = 1000;
    this.height = 100;

    this.CalcRectangle();
  }

  CalcRectangle() {
    this.lefttop = Translate(Rotate(new Point(-this.width / 2, -this.height / 2), DegToRad(this.Angle)), this.Position);
    this.righttop = Translate(Rotate(new Point(this.width / 2, -this.height / 2), DegToRad(this.Angle)), this.Position);
    this.leftbottom = Translate(
      Rotate(new Point(-this.width / 2, this.height / 2), DegToRad(this.Angle)),
      this.Position
    );
    this.rightbottom = Translate(
      Rotate(new Point(this.width / 2, this.height / 2), DegToRad(this.Angle)),
      this.Position
    );
  }

  IsPointOnMark(pos) {
    // 引数座標を一度原点に戻してマークの角度だけ回転させて、矩形内かを判断する。
    let _tp = Translate(pos, this.Position.MulValue(-1));
    let npos = Rotate(_tp, DegToRad(-this.Angle));

    if (-this.width / 2 < npos.x && npos.x < this.width / 2 && -this.height / 2 < npos.y && npos.y < this.height / 2) {
      return true;
    } else {
      return false;
    }
  }

  Selecting(ctx, pos) {
    if (this.IsPointOnMark(pos)) {
      this.CalcRectangle();
      ctx.save();
      ctx.lineWidth = "2";
      ctx.strokeStyle = "rgb(0,0,0)";
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(WorldToClientPositionX(this.lefttop.x), WorldToClientPositionY(this.lefttop.y));
      ctx.lineTo(WorldToClientPositionX(this.righttop.x), WorldToClientPositionY(this.righttop.y));
      ctx.lineTo(WorldToClientPositionX(this.rightbottom.x), WorldToClientPositionY(this.rightbottom.y));
      ctx.lineTo(WorldToClientPositionX(this.leftbottom.x), WorldToClientPositionY(this.leftbottom.y));
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      return true;
    } else {
      return false;
    }
  }
}
