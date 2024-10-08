import React, { useEffect, useRef, useCallback, useState } from "react";
import * as Styles from "./Styles";
import {
  Authenticator,
  Flex,
  Button,
  TextAreaField,
  Divider,
  Grid,
  Card,
  Tabs,
  Input,
  Label,
  Image,
  CheckboxField,
  SliderField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  StepperField,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { PRESET_THOUZER, ImageVehicle, PRESET_CARRIRO } from "./PresetVehicle";
import { ImageLandMark } from "./PresetLandmark";
import { AUTOSTART, OPERATION } from "./OperationPatern";
import {
  Point,
  WorldToClientPosition,
  WorldToClientScale,
  ClientToWorldPosition,
  PointToDistance,
  RadToDeg,
  DegToRad,
  PointToAngle,
  AngleToUnit,
} from "./CoordinateFunctions";
import { CCart } from "./CCart";
import { CLandMark } from "./CLandmark";
import { CCourse } from "./CCourse";

const DEBUG = true;

function Canvas({ command, client }) {
  const DEFAULT_SCALE = 0.1;
  const CR = "\n";
  const LANDMARK_IMAGE_SCALE = 0.595; // 元画像サイズに合わせた比率
  const START_TIME = 0.0; //シミュレーション開始時刻[sec]
  const TIME_SPAN = 10; //シミュレーション時間間隔[msec]

  const [operate, setOperate] = useState(command.command);
  const [tab, setTab] = useState("1");
  const intervalId = useRef("");
  const exec = useRef(false);
  const directionX = useRef(1);
  const directionY = useRef(1);
  const stepX = useRef(0);
  const stepY = useRef(0);
  const speed = useRef(1);
  const offset = useRef(Point.Zero());
  const scale = useRef(DEFAULT_SCALE);
  const VehicleStartPosition = useRef(Point.Zero());
  const VehicleStartDegree = useRef(0.0);
  const CVehicle = useRef();
  const CRigidCart = useRef();
  const id = useRef(0);
  const cbTrace = useRef(false);
  const cbVisVehicle = useRef(false);
  const cbVisLandmark = useRef(false);
  const cbScroll = useRef(false);
  const IsCartSelecting = useRef(false);
  const IsCartMovingMode = useRef(false);
  const onCanvasPos = useRef(Point.Zero());
  const IsMarkLayoutMode = useRef(false);
  const IsMarkSelecting = useRef(false);
  const IsCourseLayoutMode = useRef(false);
  const IsCourseSelecting = useRef(false);
  const measuring = useRef(false);
  const msDownS = useRef(Point.Zero());
  const msDownSL = useRef(Point.Zero());
  const msDownE = useRef(Point.Zero());
  const msdown = useRef(false);
  const msdownL = useRef(false);
  const prevMousePoint = useRef(Point.Zero());
  const IsCourseReLayoutMode = useRef(false);
  const markPos = useRef(Point.Zero());
  const markAngle = useRef(0.0);
  const cartPos = useRef(Point.Zero());
  const prevCartPos = useRef(Point.Zero());
  const prevCartDeg = useRef(0.0);
  const cartDegree = useRef(0.0);
  const keyPressEsc = useRef(false);
  const CartSelectingId = useRef(-1);
  const CTowCart = useRef([]);
  const offy = useRef(0.0);
  const times = useRef(1.0); //再生速度
  const sTime = useRef(0.0);
  const cTime = useRef(0.0);
  const trace_counter = useRef(0);
  const stopTime = useRef(0.0);
  const simTime = useRef(START_TIME);
  const LandMarkLayout = useRef([]);
  const CourseLayout = useRef([]);
  const ActionBlock = useRef(0);
  const DriveTime = useRef([]);
  const DriveLeftSpeed = useRef([]);
  const DriveRightSpeed = useRef([]);
  const visCartPosition = useRef(Point.Zero());
  const visCartAngle = useRef(0.0);
  const [btnStartDisable, setBtnStartDisable] = useState(false);
  const [btnResetDisable, setBtnResetDisable] = useState(false);
  const [btnStartContent, setBtnStartContent] = useState("Start");
  const currentLandmarkId = useRef(0);
  const [cbRidgidCart, setCbRidgid] = useState(false);
  const [cbTowCart, setCbTowCaart] = useState(false);
  const [TowCartQty, setTowCartQty] = useState(0);

  console.log("🔵Canvas.jsx started!");

  // 走行機体プリセット
  const [vehicleProp, setVehicle] = useState(PRESET_CARRIRO.size);

  const [rangeStep, setRangeStep] = useState(10);

  const canvasCart = {
    canvas: "",
    ctx: "",
  };
  const canvasGrid = {
    canvas: "",
    ctx: "",
  };
  const canvasCourse = {
    canvas: "",
    ctx: "",
  };

  /**
   * 初期画面描画
   */
  const initDraw = () => {
    clearCanvas(canvasCart);
    clearCanvas(canvasCourse);
    clearCanvas(canvasGrid);

    id.current = 0;
    // 走行機体生成
    CVehicle.current = new CCart(vehicleProp, id.current);
    CVehicle.current.Calc(VehicleStartPosition.current, VehicleStartDegree.current, scale.current, offset.current);

    let prev_towpos = CVehicle.current.TowPos;
    // 台車剛体連結生成

    // 牽引台車 1~ 生成

    drawGrid();
    drawAllCarts();
  };

  /**
   * 走行機体をイメージで表示させる
   * @param {*} ctx
   * @param {*} image
   * @param {*} wp
   * @param {*} rad
   * @param {*} scl
   * @param {*} offs
   */
  const DrawImageVehicle = (ctx, image, wp, rad, scl, offs) => {
    // クライアント座標へ変換
    const p = WorldToClientPosition(wp, scale.current, offset.current);
    // コンテキストを保存する
    ctx.save();
    const imgScale = scale.current / scl;
    const cx = image.width - offs;
    const cy = image.height / 2;
    // イメージを座標移動する
    ctx.translate(p.x, p.y);
    ctx.scale(imgScale, imgScale);
    ctx.rotate(rad);

    ctx.shadowColor = "gray";
    ctx.shadowBlur = 10;
    if (IsCartSelecting.current && IsCartMovingMode.current) {
      ctx.shadowOffsetX = 15;
      ctx.shadowOffsetY = 15;
    } else {
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;
    }
    // イメージ原点をFixedPosへシフトして描画
    ctx.drawImage(image, -cx, -cy, image.width, image.height);
    // コンテキストを元に戻す
    ctx.restore();
  };

  /**
   * ランドマークをイメージで表示させる
   * @param {*} ctx
   * @param {*} image
   * @param {*} wp
   * @param {*} rad
   * @param {*} scl
   * @param {*} shadow
   */
  const DrawImageLandMark = (ctx, image, wp, rad, scl, shadow) => {
    // クライアント座標へ変換
    const p = WorldToClientPosition(wp, scale.current, offset.current);
    // コンテキストを保存する
    ctx.save();
    const imgScale = scale / scl;
    const cx = image.width / 2;
    const cy = image.height / 2;
    // イメージを座標移動する
    ctx.translate(p.x, p.y);
    ctx.scale(imgScale, imgScale);
    ctx.rotate(-rad);

    if (shadow) {
      ctx.shadowColor = "gray";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;
    }
    // イメージ原点をランドマーク中央へシフトして描画
    if (cbVisLandmark.current) ctx.drawImage(image, -cx, -cy, image.width, image.height);
    // コンテキストを元に戻す
    ctx.restore();
  };

  /**
   * 全カートを描画する
   */
  const drawAllCarts = () => {
    if (!cbTrace.current) clearCanvas(canvasCart);

    if (cbVisVehicle.current) {
      DrawImageVehicle(
        canvasCart.ctx,
        ImageVehicle,
        CVehicle.current.Position,
        -CVehicle.current.Radian,
        PRESET_THOUZER.scale,
        PRESET_THOUZER.offset
      );
    } else {
      DrawCart(CVehicle.current, "rgb(128,32,32)", "1", canvasCart.ctx);
    }

    // if (cbRidgid) {
    //   DrawCart(CRigidCart.current, "rgb(64,64,64)", "2", canvasCart.ctx);
    // }

    // if (TowCartQty > 0) {
    //   CTowCart.forEach((element) => {
    //     DrawCart(element, "rgb(64,64,64)", "2", canvasCart.ctx);
    //   });
    // }
  };

  /**
   * 一台のカートを描画する
   * @param {*} cobj
   * @param {*} color
   * @param {*} width
   * @param {*} ctx
   */
  const DrawCart = (cobj, color, width, ctx) => {
    ctx.beginPath();
    const lp = WorldToClientPosition(cobj.Position, scale.current, offset.current);
    const fp = WorldToClientPosition(cobj.FrontPos, scale.current, offset.current);
    const lf = WorldToClientPosition(cobj.LeftFront, scale.current, offset.current);
    const rf = WorldToClientPosition(cobj.RightFront, scale.current, offset.current);
    const rr = WorldToClientPosition(cobj.RightRear, scale.current, offset.current);
    const lr = WorldToClientPosition(cobj.LeftRear, scale.current, offset.current);
    ctx.moveTo(lf.x, lf.y);
    ctx.lineTo(rf.x, rf.y);
    ctx.lineTo(rr.x, rr.y);
    ctx.lineTo(lr.x, lr.y);
    ctx.closePath();

    if (cobj.IsTowingCart) {
      // 牽引バーがある場合
      ctx.moveTo(lp.x, lp.y);
      ctx.lineTo(fp.x, fp.y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    const p1 = WorldToClientPosition(cobj.TowPos, scale.current, offset.current);
    ctx.arc(p1.x, p1.y, WorldToClientScale(20, scale.current), 0, Math.PI * 2, true);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    const p2 = WorldToClientPosition(cobj.Position, scale.current, offset.current);
    ctx.arc(p2.x, p2.y, WorldToClientScale(20, scale.current), 0, Math.PI * 2, true);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    const p3 = WorldToClientPosition(cobj.DrivingPos, scale.current, offset.current);
    ctx.arc(p3.x, p3.y, WorldToClientScale(10, scale.current), 0, Math.PI * 2, true);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    const p4 = WorldToClientPosition(cobj.CameraPos, scale.current, offset.current);
    ctx.arc(p4.x, p4.y, WorldToClientScale(50, scale.current), 0, Math.PI * 2, true);
    ctx.stroke();
  };

  /**
   * Gridキャンパスに5m,1mグリッドを描画
   */
  const drawGrid = () => {
    clearCanvas(canvasGrid);

    // 1m間隔グリッド
    canvasGrid.ctx.lineWidth = "1";
    canvasGrid.ctx.strokeStyle = "rgb(225,225,225)";
    for (let x = 0; x < canvasGrid.canvas.width + offset.current.x; x += 1000 * scale.current) {
      canvasGrid.ctx.beginPath();
      canvasGrid.ctx.moveTo(x - offset.current.x, 0);
      canvasGrid.ctx.lineTo(x - offset.current.x, canvasGrid.canvas.height);
      canvasGrid.ctx.stroke();
    }
    for (let y = 0; y < canvasGrid.canvas.height + offset.current.y; y += 1000 * scale.current) {
      canvasGrid.ctx.beginPath();
      canvasGrid.ctx.moveTo(0, y - offset.current.y);
      canvasGrid.ctx.lineTo(canvasGrid.canvas.width, y - offset.current.y);
      canvasGrid.ctx.stroke();
    }
    for (let x = 0; x > -canvasGrid.canvas.width + offset.current.x; x -= 1000 * scale.current) {
      canvasGrid.ctx.beginPath();
      canvasGrid.ctx.moveTo(x - offset.current.x, 0);
      canvasGrid.ctx.lineTo(x - offset.current.x, canvasGrid.canvas.height);
      canvasGrid.ctx.stroke();
    }
    for (let y = 0; y > -canvasGrid.canvas.height + offset.current.y; y -= 1000 * scale.current) {
      canvasGrid.ctx.beginPath();
      canvasGrid.ctx.moveTo(0, y - offset.current.y);
      canvasGrid.ctx.lineTo(canvasGrid.canvas.width, y - offset.current.y);
      canvasGrid.ctx.stroke();
    }

    // 5m間隔グリッド
    canvasGrid.ctx.lineWidth = "1";
    canvasGrid.ctx.strokeStyle = "rgb(192,192,192)";
    for (let x = 0; x < canvasGrid.canvas.width + offset.current.x; x += 5000 * scale.current) {
      canvasGrid.ctx.beginPath();
      canvasGrid.ctx.moveTo(x - offset.current.x, 0);
      canvasGrid.ctx.lineTo(x - offset.current.x, canvasGrid.canvas.height);
      canvasGrid.ctx.stroke();
    }
    for (let y = 0; y < canvasGrid.canvas.height + offset.current.y; y += 5000 * scale.current) {
      canvasGrid.ctx.beginPath();
      canvasGrid.ctx.moveTo(0, y - offset.current.y);
      canvasGrid.ctx.lineTo(canvasGrid.canvas.width, y - offset.current.y);
      canvasGrid.ctx.stroke();
    }
    for (let x = 0; x > -canvasGrid.canvas.width + offset.current.x; x -= 5000 * scale.current) {
      canvasGrid.ctx.beginPath();
      canvasGrid.ctx.moveTo(x - offset.current.x, 0);
      canvasGrid.ctx.lineTo(x - offset.current.x, canvasGrid.canvas.height);
      canvasGrid.ctx.stroke();
    }
    for (let y = 0; y > -canvasGrid.canvas.height + offset.current.y; y -= 5000 * scale.current) {
      canvasGrid.ctx.beginPath();
      canvasGrid.ctx.moveTo(0, y - offset.current.y);
      canvasGrid.ctx.lineTo(canvasGrid.canvas.width, y - offset.current.y);
      canvasGrid.ctx.stroke();
    }
  };

  /**
   * コース・ランドマークを描画する
   */
  const drawCourse = () => {
    clearCanvas(canvasCourse);

    // Landmark
    LandMarkLayout.current.forEach((element) => {
      const id = element.Id;
      const type = element.Type;
      const shadow = !element.Fix;

      const pos = element.Fix ? element.Position : markPos;
      const deg = element.Fix ? element.Angle : markAngle;

      DrawImageLandMark(
        canvasCourse.ctx,
        ImageLandMark.current[type],
        pos,
        DegToRad(deg),
        LANDMARK_IMAGE_SCALE,
        shadow
      );
    });

    // Course
    canvasCourse.ctx.lineWidth = WorldToClientScale(200, scale.current, offset.current);
    canvasCourse.ctx.strokeStyle = "rgb(128,128,128)";
    canvasCourse.ctx.lineCap = "round";
    canvasCourse.ctx.lineJoin = "round";

    CourseLayout.current.forEach((element) => {
      const pos = element.Position;
      if (pos.length > 0) {
        canvasCourse.ctx.beginPath();
        const p0 = WorldToClientPosition(pos[0], scale.current, offset.current);
        canvasCourse.ctx.moveTo(p0.x, p0.y);
        for (let i = 1; i < pos.length; i++) {
          const pi = WorldToClientPosition(pos[i], scale.current, offset.current);
          canvasCourse.ctx.lineTo(pi.x, pi.y);
        }
        canvasCourse.ctx.stroke();
      }
    });
  };

  //
  // シミュレーション
  //
  const Mileage = useRef(0.0);
  const StackLandmarkID = useRef([]);
  const prevSpeed = useRef(0.0);

  /**
   * [距離mm, 速度mm/s, 旋回角度deg, 旋回半径mm] から　[ドライブ時間sec, 左駆動速度mm/s, 右駆動速度mm/s] を計算
   * @param {*} ope
   */
  const OperationToDriveParam = (ope) => {
    ActionBlock.current = 0;
    DriveTime.current = [];
    DriveLeftSpeed.current = [];
    DriveRightSpeed.current = [];
    const td = CVehicle.current.Tread;

    for (let i in ope) {
      if (ope[i][0] > 0) {
        // @直進
        DriveTime.current.push((ope[i][0] / ope[i][1]) * 1000);
        DriveLeftSpeed.current.push(ope[i][1]);
        DriveRightSpeed.current.push(ope[i][1]);
      }
      if (ope[i][1] < -1) {
        // @直進バック
        DriveTime.current.push((ope[i][0] / -ope[i][1]) * 1000);
        DriveLeftSpeed.current.push(ope[i][1]);
        DriveRightSpeed.current.push(ope[i][1]);
      }
      if (ope[i][1] == -1) {
        // 速度が-1の時は、直前の直進速度を適用
        DriveTime.push((ope[i][0] / prevSpeed) * 1000);
        DriveLeftSpeed.current.push(prevSpeed);
        DriveRightSpeed.current.push(prevSpeed);
      }

      if (ope[i][0] == 0 && ope[i][3] > 0) {
        // @カーブ
        let rc = ope[i][3];
        if (ope[i][2] != 0) {
          // 旋回角度が0以外
          let rl, rr;
          if (ope[i][2] > 0) {
            rl = ope[i][3] + td / 2;
            rr = ope[i][3] - td / 2;
          } else {
            rl = ope[i][3] - td / 2;
            rr = ope[i][3] + td / 2;
          }
          let dc = 2 * Math.PI * rc * (Math.abs(ope[i][2]) / 360);
          DriveTime.current.push((dc / ope[i][1]) * 1000);
          DriveLeftSpeed.current.push(ope[i][1] * (rl / rc));
          DriveRightSpeed.current.push(ope[i][1] * (rr / rc));
        } else {
          //旋回角度が0の時は時間0で直進（何もしない）
          //let dc = 2 * Math.PI * rc * (Math.abs(ope[i][2]) / 360);
          DriveTime.current.push(0);
          DriveLeftSpeed.current.push(ope[i][1]);
          DriveRightSpeed.current.push(ope[i][1]);
        }
      }

      if (ope[i][0] == 0 && ope[i][3] == 0) {
        // @シャープターン
        let dc = 2 * Math.PI * (td / 2) * (Math.abs(ope[i][2]) / 360);
        DriveTime.current.push((dc / ope[i][1]) * 1000);
        if (ope[i][2] > 0) {
          DriveLeftSpeed.current.push(-ope[i][1]);
          DriveRightSpeed.current.push(ope[i][1]);
        } else {
          DriveLeftSpeed.current.push(ope[i][1]);
          DriveRightSpeed.current.push(-ope[i][1]);
        }
      }

      if (ope[i][0] == 0 && ope[i][1] == 0) {
        // @Pause
        DriveTime.current.push(1000);
        DriveLeftSpeed.current.push(ope[i][1]);
        DriveRightSpeed.current.push(ope[i][1]);
      }
    }
  };

  /**
   *  1ステップ当たりのオブジェクト移動計算(次のポジションを Vector で返す)
   * @param {*} ts
   * @param {*} spl
   * @param {*} spr
   * @param {*} ang
   */
  const MotorDrive = (ts, spl, spr, ang) => {
    const clm = (spl * ts) / 1000;
    const crm = (spr * ts) / 1000;
    const clp = new Point(-CVehicle.current.Tread / 2, clm);
    const crp = new Point(CVehicle.current.Tread / 2, crm);

    let ddg = DegToRad(ang) + PointToAngle(clp, crp);

    if (ddg < 0) {
      ddg += 2 * Math.PI;
    }
    if (ddg > 2 * Math.PI) {
      ddg -= 2 * Math.PI;
    }

    const vec = {
      p: AngleToUnit(ddg).MulValue((clm + crm) / 2),
      r: ddg,
    };

    return vec;
  };

  /**
   * 連続描画処理
   */
  const simulate = () => {
    if (trace_counter.current > rangeStep) trace_counter.current = 0;
    else trace_counter.current++;

    if (cbTrace.current) {
      // 軌跡表示
      if (trace_counter.current > rangeStep) {
        // 軌跡表示間隔
        drawAllCarts(); //全カート描画
      }
    } else {
      drawAllCarts(); //全カート描画
    }

    visCartPosition.current = CVehicle.current.Position;
    visCartAngle.current = CVehicle.current.Degree;

    // 表示域のステータスを更新　※直接DOMを操作しているので、Reactでは推奨されません・・
    document.getElementById("simTime").innerHTML = (simTime.current / 1000).toFixed(1);
    document.getElementById("posx").innerHTML = CVehicle.current.Position.x.toFixed(2);
    document.getElementById("posy").innerHTML = CVehicle.current.Position.y.toFixed(2);
    document.getElementById("angle").innerHTML = visCartAngle.current.toFixed(1);
    document.getElementById("milage").innerHTML = (Mileage.current / 1000).toFixed(2);
    document.getElementById("speed").innerHTML = ((speed.current / 1000000) * 3600).toFixed(2);

    // 次の位置を計算
    if (!nextPosition()) {
      //戻り値がfalseの場合、シミュレーション終了
      clearInterval(intervalId.current);
      exec.current = false;
      setBtnStartDisable(false);
      setBtnResetDisable(true);
    }
  };

  /**
   * ステップ毎カート位置計算
   */
  const nextPosition = () => {
    const block = ActionBlock.current; // １ランドマーク毎の各アクション
    const remainTime = DriveTime.current[block]; // １アクションの残り時間

    if (block < DriveTime.current.length) {
      if (remainTime <= 0) {
        ActionBlock.current++;
        if (ActionBlock.current >= DriveTime.current.length) {
          return false;
        }
      }

      const vec = MotorDrive(
        TIME_SPAN,
        DriveLeftSpeed.current[block],
        DriveRightSpeed.current[block],
        CVehicle.current.Degree
      );
      if (vec.p.x < 0) {
        let a = 0;
      }
      // 走行距離加算
      Mileage.current += PointToDistance(vec.p, new Point(0, 0));

      //機体位置計算
      const deg = RadToDeg(vec.r);
      const pos = CVehicle.current.Position.AddPoint(vec.p);
      CartPosition(pos, deg);

      //機体中心にキャンバスをスクロール
      if (cbScroll.current) {
        const offs = CVehicle.current.Position.MulValue(scale.current);
        offset.current.x = offs.x - canvasCart.canvas.width / 2;
        offset.current.y = offs.y - canvasCart.canvas.height / 2;

        drawGrid();
        drawCourse();
      }

      // 機体が通過するランドマークタイプは？
      const id = LandarkIdOnPoint();
      if (Number(id) >= 0) {
        if (currentLandmarkId.current != id) {
          //　一つのランドマークを通過中は最初だけを検知
          currentLandmarkId.current = id;
          const type = LandMarkLayout.current[id].Type;

          // マークと機体の侵入角度から角度補正
          const LAng = LandMarkLayout[id].current.Angle;
          const CAng = CVehicle.current.Degree;
          let dAng = LAng - CAng + 90;
          const ope = OPERATION[type];
          if (dAng > 90) dAng -= 360;
          if (dAng < 0.5 && dAng > -0.5) {
            // 誤差が小さいときは補正しない
            ope[1][2] = 0; // 補正用の角度を変更
          } else {
            ope[1][2] = dAng; // 補正用の角度を変更
          }
          if (type <= 2) {
            //直進ランドマークならば速度を保存
            prevSpeed.current = ope[2][1];
          }

          if (dAng <= 45.0 && dAng >= -45.0) {
            //進入角度が±45°以内でランドマークアクション
            if (speed.current > 0) {
              OperationToDriveParam(ope);
              //console.log(id + ',' + type + "," + dAng);
            }
          }
        }
      } else {
        currentLandmarkId.current = -1;
      }

      speed.current = (DriveLeftSpeed.current[block] + DriveRightSpeed.current[block]) / 2;
      DriveTime.current[ActionBlock.current] -= TIME_SPAN;
      simTime.current += TIME_SPAN;

      return true;
    } else {
      return false;
    }
  };

  /**
   * シミュレート中のカートに位置を計算
   * @param {*} pos
   * @param {*} deg
   */
  const CartPosition = (pos, deg) => {
    CVehicle.current.Calc(pos, deg);

    // 機体剛体連結台車の場合
    if (cbRidgidCart) {
      CRigidCart.current.Calc(CVehicle.current.LinkPos, deg);
    }

    // 牽引台車の場合
    if (TowCartQty > 0) {
      // 潜り込み連結時の牽引ならば、台車に牽引連結し、機体単独ならば、機体に牽引連結する
      const prev_towpos = cbRidgidCart ? CRigidCart.current.TowPos : CVehicle.current.TowPos;

      let _prev_towpos = prev_towpos;
      CTowCart.current.forEach((element) => {
        const _deg = RadToDeg(PointToAngle(element.DrivingPos, _prev_towpos));
        const _pos = _prev_towpos;
        element.Calc(_pos, _deg);
        _prev_towpos = element.TowPos;
      });
      // letを使わない方法。全体が動くことを確認してから試す
      // CTowCart.current.reduce((prevTowPos, element) => {
      //   const _deg = RadToDeg(PointToAngle(element.DrivingPos, prevTowPos));
      //   const _pos = prevTowPos;
      //   element.Calc(_pos, _deg);
      //   return element.TowPos; // 次のループに向けて新しいTowPosを返す
      // }, prev_towpos);
    }
  };

  const LandarkIdOnPoint = () => {
    const cpos = CVehicle.current.CameraPos;

    let i = 0;
    for (let elem of LandMarkLayout.current) {
      if (elem.IsPointOnMark(cpos)) {
        return i;
      }
      i++;
    }
    return -1;
  };

  const updateCourseTextData = () => {};

  const setVehicleProperty = () => {};

  const resetSimulateParam = () => {
    //変数初期化
    simTime.current = START_TIME;
    exec.current = false;
    setBtnStartContent("Start");

    msDownS.current = Point.Zero();
    msDownE.current = Point.Zero();
    msDownSL.current = Point.Zero();
    scale.current = DEFAULT_SCALE;
    Mileage.current = 0;

    // 表示域のステータスを更新　※直接DOMを操作しているので、Reactでは推奨されません・・
    document.getElementById("simTime").innerHTML = (simTime.current / 1000).toFixed(1);
    document.getElementById("posx").innerHTML = CVehicle.current.Position.x.toFixed(2);
    document.getElementById("posy").innerHTML = CVehicle.current.Position.y.toFixed(2);
    document.getElementById("angle").innerHTML = visCartAngle.current.toFixed(1);
    document.getElementById("milage").innerHTML = (Mileage.current / 1000).toFixed(2);
    document.getElementById("speed").innerHTML = ((speed.current / 1000000) * 3600).toFixed(2);
  };

  const fitCanvas = () => {
    if (!exec.current) {
      const { clientWidth, clientHeight } = document.getElementById("canvasAreaCard");
      canvasCart.canvas.width = clientWidth;
      canvasCart.canvas.height = clientHeight - 8; // 8pxほど高さを小さくしないと合わない。。
      canvasCourse.canvas.width = clientWidth;
      canvasCourse.canvas.height = clientHeight - 8;
      canvasGrid.canvas.width = clientWidth;
      canvasGrid.canvas.height = clientHeight - 8;
      return { clientWidth, clientHeight };
    }
  };

  const clearCanvas = (canvas) => {
    canvas.ctx.clearRect(0, 0, canvas.canvas.width, canvas.canvas.height);
  };

  useEffect(() => {
    // document.body.style.overflow = "hidden"; //ブラウザのスクロールバーを表示させない
    canvasCart.canvas = document.getElementById("cartCanvas");
    canvasCart.ctx = canvasCart.canvas.getContext("2d");
    canvasGrid.canvas = document.getElementById("gridCanvas");
    canvasGrid.ctx = canvasGrid.canvas.getContext("2d");
    canvasCourse.canvas = document.getElementById("courseCanvas");
    canvasCourse.ctx = canvasCourse.canvas.getContext("2d");

    // document.addEventListener("keydown", onKeyDown);
    // document.addEventListener("keyup", onKeyUp);

    // body要素に対して右クリックを禁止する
    document.body.oncontextmenu = function () {
      return false;
    };

    window.onresize = fitCanvas;

    const val = fitCanvas();

    VehicleStartPosition.current = Point.Zero();
    VehicleStartDegree.current = 0.0;

    ImageVehicle.src = PRESET_THOUZER.image;

    initDraw();

    OperationToDriveParam(AUTOSTART);
  });

  /**
   * MQTT コマンドを受信した場合の処理
   */
  useEffect(() => {
    setOperate(command.command);
    switch (command.command) {
      case "up":
        directionY.current = -1;
        stepX.current = 0;
        stepY.current = 1;
        break;
      case "left":
        directionX.current = -1;
        stepX.current = 1;
        stepY.current = 0;
        break;
      case "right":
        directionX.current = 1;
        stepX.current = 1;
        stepY.current = 0;
        break;
      case "down":
        directionY.current = 1;
        stepX.current = 0;
        stepY.current = 1;
        break;
      case "stop":
        stepX.current = 0;
        stepY.current = 0;
        break;
      case "speedUp":
        speed.current < 10 ? speed.current++ : speed.current;
        break;
      case "speedDown":
        speed.current > 1 ? speed.current-- : speed.current;
        break;
      default:
        break;
    }
  }, [command]);

  const OnStartStopButtonClick = () => {
    if (!exec.current) {
      intervalId.current = setInterval(simulate, 1);
      exec.current = true;
      setBtnResetDisable(true);
      setBtnStartContent("Pause");
    }
  };

  const handleStop = () => {
    if (exec.current) {
      clearInterval(intervalId.current);
      exec.current = false;
      setBtnResetDisable(true);
      setBtnStartContent("Start");
    }
  };

  const handleInputVehiclePropNum = (e) => {
    const { name, value } = e.currentTarget;
    setVehicle((prevVehicle) => ({
      ...prevVehicle,
      [name]: value,
    }));
  };

  const handleInputVehiclePropPoint = (e) => {
    const { name, value } = e.currentTarget;
    setVehicle((prevVehicle) => ({
      ...prevVehicle,
      [name]: new Point(value, 0),
    }));
  };

  const OnChangeCartParam = () => {
    if (exec.current) {
      OnStartStopButtonClick();
    }
    OnResetButtonClick();
  };

  const handleChangeTow = () => {
    if (exec.current) {
      OnStartStopButtonClick();
    }

    if (CTowCart) {
      document.getElementById("nm_tow").disabled = "";
      setTowCartQty(TowCartQty);
    } else {
      document.getElementById("nm_tow").disabled = "disabled";
      setTowCartQty(0);
    }
    OnResetButtonClick();
  };

  const handleChangeRidgid = () => {
    if (exec.current) {
      OnStartStopButtonClick();
    }
    setCbRidgid(!cbRidgidCart);
    OnResetButtonClick();
  };

  const OnResetButtonClick = () => {};

  const handleTrace = () => {
    cbTrace.current = !cbTrace.current;
  };
  const handleVisVehicle = () => {
    cbVisVehicle.current = !cbVisVehicle.current;
    if (!exec.current) drawAllCarts(); //全カート描画
  };

  const handleScroll = () => {
    cbScroll.current = !cbScroll.current;
  };

  const handleMouseDown = (e) => {
    // The left button was pressed
    if (e.button == 0) {
      const rect = canvasCart.canvas.getBoundingClientRect();
      onCanvasPos.current = new Point(e.clientX - rect.x, e.clientY - rect.y);
      const mspos = ClientToWorldPosition(onCanvasPos.current, scale.current, offset.current);

      // 二点間距離測定
      if (e.altKey && !IsMarkLayoutMode.current && !IsCourseLayoutMode.current) {
        if (measuring.current) {
          msDownE.current = mspos;
          measuring.current = false;
          alert(
            "始点座標  " +
              "x= " +
              msDownS.current.x.toFixed(0) +
              ", y= " +
              msDownS.current.y.toFixed(0) +
              "\n" +
              "終点座標  " +
              "x= " +
              msDownE.current.x.toFixed(0) +
              ", y= " +
              msDownE.current.y.toFixed(0) +
              "\n" +
              "二点間距離 " +
              "d= " +
              PointToDistance(msDownE.current, msDownS.current).toFixed(0) +
              " [mm]"
          );
          canvasCourse.ctx.clearRect(0, 0, canvasCart.width, canvasCart.height);
          msdownL.current = false;
        } else {
          msDownS.current = mspos;
          measuring.current = true;
          msDownSL.current = onCanvasPos.current;
          msdownL.current = true;
        }
      } else {
        msdown.current = true;
        msDownS.current = onCanvasPos.current;
        offset.current = prevMousePoint.current;
        measuring.current = false;
        msdownL.current = false;
      }

      if (IsMarkLayoutMode.current && !e.shiftKey) {
      }

      if (IsCourseLayoutMode.current && !IsCourseReLayoutMode.current && !e.shiftKey) {
      }

      if (IsCourseReLayoutMode.current && !e.shiftKey) {
      }

      if (IsCartMovingMode.current && !e.shiftKey) {
        IsCartMovingMode.current = false;
        IsCartSelecting.current = false;
        drawAllCarts();
      }

      drawCourse();
      updateCourseTextData();
    }
  };

  const handleMouseUp = (e) => {
    msdown.current = false;
    prevMousePoint.current = offset.current;

    // The left button was pressed
    if (e.button == 0) {
      if (!IsMarkLayoutMode.current && IsMarkSelecting.current && !e.shiftKey) {
      }
      if (!IsCourseLayoutMode.current && IsCourseSelecting.current && !e.shiftKey) {
      }
      if (!IsCartMovingMode.current && IsCartSelecting.current && !e.shiftKey) {
        const mspos = ClientToWorldPosition(onCanvasPos.current, scale.current, offset.current);
        cartPos.current = new Point(Math.round(mspos.x / 100) * 100, Math.round(mspos.y / 100) * 100);
        prevCartPos.current = CVehicle.current.Position;
        prevCartDeg.current = CVehicle.current.Degree;
        cartPos.current = CVehicle.current.Position;
        cartDegree.current = CVehicle.current.Degree;
        IsCartMovingMode.current = true;
        IsCartSelecting.current = true;

        drawAllCarts();
      }
    }
    updateCourseTextData();
  };

  const handleMouseMove = (e) => {
    const rect = canvasCart.canvas.getBoundingClientRect();
    onCanvasPos.current = new Point(e.clientX - rect.x, e.clientY - rect.y);
    const mspos = ClientToWorldPosition(onCanvasPos.current, scale.current, offset.current);

    if (e.shiftKey) {
      if (!cbTrace.current.checked && !cbScroll.current.checked) {
        if (msdown.current) {
          const pt = msDownS.current.SubPoint(onCanvasPos.current);
          offset.current = prevMousePoint.current.AddPoint(pt);
        }
      }
    }

    drawGrid();
    if (!exec.current) {
      drawAllCarts();
    }
    drawCourse();

    if (IsMarkLayoutMode.current && !keyPressEsc.current) {
    }
    if (!IsMarkLayoutMode.current && !e.shiftKey) {
    }
    if (IsCourseLayoutMode.current && !keyPressEsc.current) {
    }
    if (!IsCourseLayoutMode.current && !e.shiftKey) {
    }

    if (!IsCartMovingMode.current && !e.shiftKey) {
      IsCartSelecting.current = false;
      CartSelectingId.current = -1;
      if (CVehicle.current.Selecting(canvasCart.ctx, mspos)) {
        CartSelectingId.current = CVehicle.current.Id;
        IsCartSelecting.current = true;
      }
    }

    if (IsCartMovingMode.current && !e.shiftKey) {
      if (e.altKey) {
        cartPos.current = mspos;
      } else {
        cartPos.current = new Point(Math.round(mspos.x / 100) * 100, Math.round(mspos.y / 100) * 100);
      }
      // Cart位置再計算
      CartPosition(cartPos.current, cartDegree.current);
      VehicleStartPosition.current = cartPos.current;
      VehicleStartDegree.current = cartDegree.current;
    }

    if (e.shiftKey) {
      if (msdown.current && cbTrace.current.checked) {
        canvasCourse.ctx.font = "12pt Arial";
        canvasCourse.ctx.fillStyle = "rgb(96,96,128)";
        canvasCourse.ctx.fillText(
          "軌跡表示中は画面移動できません。",
          e.clientX + 5 - canvasCart.canvas.offsetLeft,
          e.clientY + 30
        );
      }
      if (msdown.current && cbScroll.current.checked) {
        canvasCourse.ctx.font = "12pt Arial";
        canvasCourse.ctx.fillStyle = "rgb(96,96,128)";
        canvasCourse.ctx.fillText(
          "スクロール中は画面移動できません。",
          e.clientX + 5 - canvasCart.canvas.offsetLeft,
          e.clientY + 30
        );
      }
    }
    if (e.altKey) {
      canvasCourse.ctx.font = "12pt Arial";
      canvasCourse.ctx.fillStyle = "rgb(96,96,128)";
      canvasCourse.ctx.fillText(
        "(" + mspos.x.toFixed(0) + "," + mspos.y.toFixed(0) + ")",
        e.clientX + 10 - canvasCourse.canvas.offsetLeft,
        e.clientY + 30 - canvasCourse.canvas.offsetTop
      );
      // マウスの位置が右側、下側になったとき、表示文字がクライアント域からはみ出さないよう調整したほうが良い
    }

    if (e.altKey && measuring.current) {
      if (msdownL.current) {
        canvasCourse.ctx.beginPath();
        canvasCourse.ctx.moveTo(msDownSL.current.x, msDownSL.current.y);
        canvasCourse.ctx.lineTo(onCanvasPos.current.x, onCanvasPos.current.y);
        canvasCourse.ctx.strokeStyle = "rgb(96,96,255)";
        canvasCourse.ctx.lineWidth = "1";
        canvasCourse.ctx.stroke();
      }
    } else {
      msdownL.current = false;
      measuring.current = false;
    }

    updateCourseTextData();
  };

  const handleMouseWheel = (e) => {};

  return (
    <Grid
      height="100%"
      padding="10px"
      id="gridArea"
      columnGap="0.5rem"
      rowGap="0.5rem"
      templateColumns="500px 1fr"
      templateRows="60px 1fr 60px"
    >
      <Card columnStart="1" columnEnd="-1">
        <h3>Autonomous Robot Simulator</h3>
      </Card>
      <Card rowStart="2" rowEnd="-1">
        <Tabs
          value={tab}
          onValueChange={(tab) => setTab(tab)}
          items={[
            {
              label: "Simulate",
              value: "1",
              content: (
                <Flex direction="column" alignItems={"center"}>
                  <Flex direction="row" alignItems={"center"}>
                    <Button width={100} onClick={OnStartStopButtonClick} isDisabled={btnStartDisable}>
                      {btnStartContent}
                    </Button>
                    <Button width={100} onClick={handleStop} isDisabled={btnResetDisable}>
                      Reset
                    </Button>
                  </Flex>
                  <CheckboxField
                    label="Show trace line"
                    name="cb_trace"
                    defaultChecked={cbTrace.current}
                    onChange={handleTrace}
                  />
                  <SliderField
                    label="Trace interval steps"
                    min={5}
                    max={120}
                    trackSize="5"
                    value={rangeStep}
                    onChange={setRangeStep}
                  />
                  <CheckboxField
                    label="Vehicle shows screen center"
                    name="cb_scroll"
                    defaultChecked={cbScroll.current}
                    onChange={handleScroll}
                  />
                  <Table caption="Simulate status" highlightOnHover={true} size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell width={"200px"}>Driving Time [sec]</TableCell>
                        <TableCell id="simTime" colSpan={2}>
                          0.0
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Position [m]</TableCell>
                        <TableCell id="posx">0.0</TableCell>
                        <TableCell id="posy">0.0</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Angle [degree]</TableCell>
                        <TableCell id="angle" colSpan={2}>
                          0.0
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Milage [m]</TableCell>
                        <TableCell id="milage" colSpan={2}>
                          0.0
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Speed [km/h]</TableCell>
                        <TableCell id="speed" colSpan={2}>
                          0.0
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <label>
                    MQTT Receive Command
                    <TextAreaField name="postContent" rows={1} cols={40} value={operate} />
                  </label>
                </Flex>
              ),
            },
            {
              label: "Vehicle",
              value: "2",
              content: (
                <>
                  <p>機体仕様</p>
                  <Flex direction="row" gap="small">
                    <Flex direction="column" gap="small">
                      <Label {...Styles.inputLabel}>Wt</Label>
                      <Input
                        {...Styles.inputNumber}
                        name="width"
                        defaultValue={vehicleProp.width}
                        onInput={(e) => handleInputVehiclePropNum(e)}
                      ></Input>
                    </Flex>
                    <Flex direction="column" gap="small">
                      <Label {...Styles.inputLabel}>Lt</Label>
                      <Input
                        {...Styles.inputNumber}
                        name="length"
                        defaultValue={vehicleProp.length}
                        onInput={(e) => handleInputVehiclePropNum(e)}
                      ></Input>
                    </Flex>
                    <Flex direction="column" gap="small">
                      <Label {...Styles.inputLabel}>Td</Label>
                      <Input
                        {...Styles.inputNumber}
                        name="tread"
                        defaultValue={vehicleProp.tread}
                        onInput={(e) => handleInputVehiclePropNum(e)}
                      ></Input>
                    </Flex>
                    <Flex direction="column" gap="small">
                      <Label {...Styles.inputLabel}>Re</Label>
                      <Input
                        {...Styles.inputNumber}
                        name="rearend"
                        defaultValue={vehicleProp.rearend}
                        onInput={(e) => handleInputVehiclePropNum(e)}
                      ></Input>
                    </Flex>
                  </Flex>
                  <Flex direction="row" gap="small">
                    <Flex direction="column" gap="small">
                      <Label {...Styles.inputLabel}>Tw</Label>
                      <Input
                        {...Styles.inputNumber}
                        name="towpos"
                        defaultValue={vehicleProp.towpos.x}
                        onInput={(e) => handleInputVehiclePropPoint(e)}
                      ></Input>
                    </Flex>
                    <Flex direction="column" gap="small">
                      <Label {...Styles.inputLabel}>Lk</Label>
                      <Input
                        {...Styles.inputNumber}
                        name="linkpos"
                        defaultValue={vehicleProp.linkpos.x}
                        onInput={(e) => handleInputVehiclePropPoint(e)}
                      ></Input>
                    </Flex>
                    <Flex direction="column" gap="small">
                      <Label {...Styles.inputLabel}>Cm</Label>
                      <Input
                        {...Styles.inputNumber}
                        name="camerapos"
                        defaultValue={vehicleProp.camerapos.x}
                        onInput={(e) => handleInputVehiclePropPoint(e)}
                      ></Input>
                    </Flex>
                  </Flex>
                  <Image src="./CarriRoSize.png"></Image>
                  <CheckboxField
                    label="機体をイメージで表示"
                    name="cb_vis_vehicle"
                    defaultChecked={cbVisVehicle.current}
                    onChange={handleVisVehicle}
                  />
                  <Button isFullWidth onClick={() => setTab("1")}>
                    Back to Simulate tab
                  </Button>
                  <Button isFullWidth onClick={() => console.log(vehicleProp)}>
                    show log
                  </Button>
                </>
              ),
            },
            {
              label: "Cart",
              value: "3",
              content: (
                <>
                  <p>Content of the second tab.</p>
                  <CheckboxField
                    label="Ridgid Connect"
                    name="cb_ridgid"
                    defaultChecked={cbRidgidCart}
                    onChange={handleChangeRidgid}
                  />
                  <CheckboxField
                    label="Tow Connect"
                    name="cb_tow"
                    defaultChecked={cbTowCart}
                    onChange={handleChangeTow}
                  />
                  <StepperField
                    isDisabled={true}
                    width={"150px"}
                    max={5}
                    min={1}
                    step={1}
                    label="Cart Qty"
                    size="small"
                  />
                  <Button isFullWidth onClick={() => setTab("1")}>
                    Back to Simulate tab
                  </Button>
                </>
              ),
            },
            {
              label: "Course",
              value: "4",
              content: (
                <>
                  <p>Content of the second tab.</p>
                  <Button isFullWidth onClick={() => setTab("1")}>
                    Back to Simulate tab
                  </Button>
                </>
              ),
            },
            {
              label: "Data",
              value: "5",
              content: (
                <>
                  <p>Content of the second tab.</p>
                  <Button isFullWidth onClick={() => setTab("1")}>
                    Back to Simulate tab
                  </Button>
                </>
              ),
            },
          ]}
        />
      </Card>
      <Card id="canvasAreaCard" columnStart="2" columnEnd="-1" style={Styles.divBlock} margin="0" padding="0">
        <div style={Styles.divBlockChild}>
          <canvas id="gridCanvas" style={Styles.grid}></canvas>
        </div>
        <div style={Styles.divBlockChild}>
          <canvas id="courseCanvas" style={Styles.course}></canvas>
        </div>
        <div style={Styles.divBlockChild}>
          <canvas
            id="cartCanvas"
            style={Styles.cart}
            onMouseDown={(e) => handleMouseDown(e)}
            onMouseUp={(e) => handleMouseUp(e)}
            onMouseMove={(e) => handleMouseMove(e)}
            onWheel={(e) => handleMouseWheel(e)}
            onMouseLeave={(e) => handleMouseUp(e)}
          ></canvas>
        </div>
      </Card>
      <Card columnStart="2" columnEnd="-1">
        Footer
      </Card>
    </Grid>
  );
}

export default Canvas;
