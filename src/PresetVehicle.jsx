export const PRESET_THOUZER = {
  type: "THOUZER",
  image: "./THOUZER.png",
  scale: 0.1, // 元画像サイズに合わせた比率
  offset: 500, // 元画像に合わせた位置調整
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

export const ImageVehicle = new Image();
ImageVehicle.src = PRESET_THOUZER.image;
