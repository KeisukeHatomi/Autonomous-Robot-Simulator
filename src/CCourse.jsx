// コースクラス
export class CCourse {
  constructor(type, pos, fix) {
    this.Type = type;
    this.Position = pos;
    this.Fix = fix;
  }

  IsPointOnCourse(pos) {
    let res = {
      ResultP: false,
      ResultE: false,
      Id: -1,
    };

    for (let i = 0; i < this.Position.length; i++) {
      // 引数座標を一度原点に戻して、矩形内かを判断する。
      let tpos = Translate(pos, this.Position[i].MulValue(-1));

      let lineWidth = 200; // 対象の線幅を200としてその内側にPposが存在する場合はtrue
      // 節の検知
      if (-lineWidth / 2 < tpos.x && tpos.x < lineWidth / 2 && -lineWidth / 2 < tpos.y && tpos.y < lineWidth / 2) {
        res.ResultP = true;
        res.Id = i;
        return res;
      }

      if (i < this.Position.length - 1) {
        let rad = PointToAngle(this.Position[i], this.Position[i + 1]);
        tpos = Rotate(tpos, -rad);
        let ep = Rotate(Translate(this.Position[i + 1], this.Position[i].MulValue(-1)), -rad);

        // 要素の検知
        if (
          lineWidth / 2 < tpos.x &&
          tpos.x < ep.x - lineWidth / 2 &&
          -lineWidth / 2 < tpos.y &&
          tpos.y < lineWidth / 2
        ) {
          res.ResultE = true;
          res.Id = i;
          return res;
        }
      }
    }
    return res;
  }

  Selecting(ctx, pos) {
    let res = this.IsPointOnCourse(pos);
    let val = {
      ResultP: false,
      ResultE: false,
      SelectedId: -1,
    };

    if (res.ResultP) {
      ctx.save();
      ctx.lineWidth = "2";
      ctx.strokeStyle = "rgb(0,0,0)";
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(
        WorldToClientPositionX(this.Position[res.Id].x),
        WorldToClientPositionY(this.Position[res.Id].y),
        WorldToClientScale(100),
        0,
        2 * Math.PI,
        true
      );
      ctx.stroke();
      ctx.restore();

      val.ResultP = true;
      val.SelectedId = res.Id;
    }

    return val;
  }
}
