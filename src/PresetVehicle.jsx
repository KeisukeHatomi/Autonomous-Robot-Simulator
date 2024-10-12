import { Point } from "./CoordinateFunctions";

export const PRESET_THOUZER = {
  type: "THOUZER",
  image: "./THOUZER.png",
  scale: 0.8, // 元画像サイズに合わせた比率調整
  offset: 450, // 元画像に合わせた位置調整
  size: {
    width: 606,
    length: 906,
    tread: 515,
    towpos: new Point(-200, 0),
    drivingpos: Point.Zero(),
    rearend: -166,
    linkpos: Point.Zero(),
    camerapos: new Point(551, 0),
  },
};

export const PRESET_CARRIRO = {
  type: "CARRIRO",
  image: "./Image/CarriRo.png",
  scale: 0.69, // 元画像サイズに合わせた比率調整
  offset: 520, // 元画像に合わせた位置調整
  size: {
    width: 606,
    length: 906,
    tread: 515,
    towpos: new Point(-200, 0),
    drivingpos: Point.Zero(),
    rearend: -166,
    linkpos: Point.Zero(),
    camerapos: new Point(551, 0),
  },
};

export const ImageVehicle = new Image();
