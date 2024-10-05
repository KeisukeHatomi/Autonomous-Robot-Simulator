//カートクラス
export class CCart {
  constructor(width, length, tread, drivingpos, linkpos, towpos, rearend, camerapos, id) {
    this.Width = width;
    this.Length = length;
    this.Tread = tread; // 駆動輪のトレッド幅
    this._DrivingPos = drivingpos; // 固定輪中心位置
    this._LinkPos = linkpos; // Rigid台車連結位置
    this._TowPos = towpos; // Towing台車連結位置
    this._RearEnd = rearend;
    this._CameraPos = camerapos;
    this.Id = id;

    this.IsTowingCart = rearend + length < 0; // 牽引バーの有無確認
  }

  // カートの位置角度から、ワールド座標系におけるカート形状を計算
  Calc(worldPos, degree) {
    this.Position = worldPos; //被牽引連結位置　※基準（ワールド座標における機体の位置）
    this.Degree = degree; //ワールド座標における機体の角度
    this.Radian = DegToRad(degree);

    this.DrivingPos = Translate(Rotate(this._DrivingPos, this.Radian), this.Position);
    this.LinkPos = Translate(Rotate(this._LinkPos, this.Radian), this.Position);
    this.TowPos = Translate(Rotate(this._TowPos, this.Radian), this.Position);
    this.CameraPos = Translate(Rotate(this._CameraPos, this.Radian), this.Position);

    this._LeftRear = new Point(this._RearEnd, -this.Width / 2);
    this._RightRear = new Point(this._RearEnd, this.Width / 2);
    this._RightFront = new Point(this.Length + this._RearEnd, this.Width / 2);
    this._LeftFront = new Point(this.Length + this._RearEnd, -this.Width / 2);
    this._FrontPos = new Point(this.Length + this._RearEnd, 0);

    this.LeftRear = Translate(Rotate(this._LeftRear, this.Radian), this.Position);
    this.RightRear = Translate(Rotate(this._RightRear, this.Radian), this.Position);
    this.RightFront = Translate(Rotate(this._RightFront, this.Radian), this.Position);
    this.LeftFront = Translate(Rotate(this._LeftFront, this.Radian), this.Position);
    this.FrontPos = Translate(Rotate(this._FrontPos, this.Radian), this.Position);
  }

  IsPointOnCart(pos) {
    // 引数座標を一度原点に戻してマークの角度だけ回転させて、矩形内かを判断する。
    let _tp = Translate(pos, this.Position.MulValue(-1));
    let npos = Rotate(_tp, -this.Radian);

    if (
      this._RearEnd < npos.x &&
      npos.x < this.Length + this._RearEnd &&
      -this.Width / 2 < npos.y &&
      npos.y < this.Width / 2
    ) {
      return true;
    } else {
      return false;
    }
  }
  Selecting(ctx, pos) {
    if (this.IsPointOnCart(pos)) {
      ctx.save();
      ctx.lineWidth = "5";
      ctx.strokeStyle = "rgb(0,0,0)";
      ctx.setLineDash([15, 10]);
      ctx.beginPath();
      ctx.moveTo(WorldToClientPositionX(this.LeftRear.x), WorldToClientPositionY(this.LeftRear.y));
      ctx.lineTo(WorldToClientPositionX(this.RightRear.x), WorldToClientPositionY(this.RightRear.y));
      ctx.lineTo(WorldToClientPositionX(this.RightFront.x), WorldToClientPositionY(this.RightFront.y));
      ctx.lineTo(WorldToClientPositionX(this.LeftFront.x), WorldToClientPositionY(this.LeftFront.y));
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      return true;
    } else {
      return false;
    }
  }
}
