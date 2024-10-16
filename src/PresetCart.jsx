import { Point } from "./CoordinateFunctions";

export const PRESET_RIGIDCART = {
  type: "RIGID_CART",
  image: "",
  scale: 0.8, // 元画像サイズに合わせた比率調整
  offset: 450, // 元画像に合わせた位置調整
  size: {
    width: 1150,
    length: 1150,
    tread: 1050,
    towpos: new Point(-575, 0),
    drivingpos: Point.Zero(),
    rearend: -575,
    linkpos: Point.Zero(),
    camerapos:Point.Zero(),
  },
};

export const PRESET_SLIMCART1 = {
  type: "TOW_CART",
  image: "",
  scale: 0.8, // 元画像サイズに合わせた比率調整
  offset: 450, // 元画像に合わせた位置調整
  size: {
    width: 450,
    length: 1000,
    tread: 400,
    towpos: new Point(-1500, 0),
    drivingpos: new Point(-1400, 0),
    rearend: -1500,
    linkpos: Point.Zero(),
    camerapos: Point.Zero(),
  },
};

export const PRESET_ROLLBOXCART1 = {
  type: "TOW_CART",
  image: "",
  scale: 0.8, // 元画像サイズに合わせた比率調整
  offset: 450, // 元画像に合わせた位置調整
  size: {
    width: 800,
    length: 1000,
    tread: 700,
    towpos: new Point(-1500, 0),
    drivingpos: new Point(-1400, 0),
    rearend: -1500,
    linkpos: Point.Zero(),
    camerapos: Point.Zero(),
  },
};
export const ImageCart= new Image();
