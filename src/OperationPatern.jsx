// 自律移動スタート
export const AUTOSTART = [[3000, 277.778, 0, 0]];

//[距離mm, 速度mm/s, 旋回角度deg, 旋回半径mm]
export const OPERATION = [
  [
    // 0:Forward 3
    [300, 833.333, 0, 0], // マーク検知後300mmそのまま直進
    [0, 833.333, 0, 260], // 角度補正
    [11700, 833.333, 0, 0], // 指定アクション
  ],
  [
    // 1:Forward 2
    [300, 555.556, 0, 0],
    [0, 555.556, 0, 260],
    [11700, 555.556, 0, 0],
  ],
  [
    // 2:Forward 1
    [300, 277.778, 0, 0],
    [0, 277.778, 0, 260],
    [11700, 277.778, 0, 0],
  ],
  [
    // 3:Curve left
    [300, 277.778, 0, 0],
    [0, 277.778, 0, 260],
    [500, 277.778, 0, 0],
    [0, 277.778, 90, 1000],
    [12000, -1, 0, 0],
  ],
  [
    // 4:Curve right
    [300, 277.778, 0, 0],
    [0, 277.778, 0, 260],
    [500, 277.778, 0, 0],
    [0, 277.778, -90, 1000],
    [12000, -1, 0, 0],
  ],
  [
    // 5:Sharp turn left
    [300, 277.778, 0, 0],
    [0, 277.778, 0, 260],
    [850, 277.778, 0, 0],
    [0, 138.889, -90, 0],
    [12000, -1, 0, 0], // -1:直前の直進速度を適用
  ],
  [
    // 6:Sharp turn right
    [300, 277.778, 0, 0],
    [0, 277.778, 0, 260],
    [850, 277.778, 0, 0],
    [0, 138.889, 90, 0],
    [12000, -1, 0, 0],
  ],
  [
    // 7:Sharp turn > Curve left
    [300, 277.778, 0, 0],
    [0, 277.778, 0, 260],
    [850, 277.778, 0, 0],
    [0, 138.889, -90, 0],
    [0, 277.778, 90, 1000],
    [12000, -1, 0, 0],
  ],
  [
    // 8:Sharp turn > Curve right
    [300, 277.778, 0, 0],
    [0, 277.778, 0, 260],
    [850, 277.778, 0, 0],
    [0, 138.889, 90, 0],
    [0, 277.778, -90, 1000],
    [12000, -1, 0, 0],
  ],
];
