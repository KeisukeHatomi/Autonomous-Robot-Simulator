import { Point } from "./CoordinateFunctions";

export const PRESET_THOUZER = {
  type: "THOUZER",
  image: "./THOUZER1.png",
  scale: 1.1, // 元画像サイズに合わせた比率調整
  offset: 780, // 元画像に合わせた位置調整
  size: {
    width: 600, //Wd
    length: 885,  //Lt
    tread: 550, //Td
    towpos: new Point(-300, 0), //Tw
    drivingpos: Point.Zero(), // 原点
    rearend: -258,  // Re
    linkpos: Point.Zero(),  //Lk
    camerapos: new Point(500, 0), //Cm
  },
};

export const PRESET_CARRIRO = {
  type: "CARRIRO",
  image: "./CarriRo.png",
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
