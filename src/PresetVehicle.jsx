export const PRESET_THOUZER = {
  type: "THOUZER",
  image: "./THOUZER.png",
  scale: 0.8, // 元画像サイズに合わせた比率調整
  offset: 450, // 元画像に合わせた位置調整
  size: {
    width: 1011,
    length: 901,
    tread: 244,
    towpos: -40,
    rearend: -210,
    linkpos: -40,
    camerapos: 0,
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
    towpos: -200,
    rearend: -166,
    linkpos: 0,
    camerapos: 551,
  },
};

export const ImageVehicle = new Image();
