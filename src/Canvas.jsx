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
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { PRESET_THOUZER, ImageVehicle } from "./PresetVehicle";
import {
  Point,
  WorldToClientPosition,
  WorldToClientScale,
  ClientToWorldPosition,
  PointToDistance,
} from "./CoordinateFunctions";
import { AUTOSTART, OPERATION } from "./OperationPatern";
import { CCart } from "./CCart";
import { CLandMark } from "./CLandmark";
import { CCourse } from "./CCourse";

const DEBUG = true;
const DEFAULT_SCALE = 0.1;

function Canvas({ command, client }) {
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
  const vehicle = useRef();
  const id = useRef(0);
  const cbTrace = useRef(false);
  const cbVisVehicle = useRef(false);
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

  // 機体生成
  const [vehicleProp, setVehicle] = useState({
    width: 606,
    length: 906,
    rearend: -166,
    towpos: new Point(-200, 0),
    drivingpos: Point.Zero(),
    linkpos: Point.Zero(),
    camerapos: new Point(551, 0),
    tread: 515,
  });

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

  let x = 300,
    y = 300;

  // 線の描画イベント
  // const drawCart = (x, y) => {
  //   if (x > context.canvas.width - 40) directionX.current = -1;
  //   if (y > context.canvas.height - 40) directionY.current = -1;
  //   if (x < 40) directionX.current = 1;
  //   if (y < 40) directionY.current = 1;

  //   // context.ctx.clearRect(0, 0, context.canvas.width, context.canvas.height);
  //   context.ctx.save();
  //   context.ctx.scale(PRESET_THOUZER.scale, PRESET_THOUZER.scale);
  //   context.ctx.translate(-PRESET_THOUZER.offset, -PRESET_THOUZER.offset);
  //   context.ctx.drawImage(
  //     ImageVehicle,
  //     x / PRESET_THOUZER.scale,
  //     y / PRESET_THOUZER.scale,
  //     ImageVehicle.width,
  //     ImageVehicle.height
  //   );
  //   context.ctx.restore();
  // };

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

  const drawCourse = () => {
    clearCanvas(canvasCourse);
  };

  const updateCourseTextData = () => {};

  const simulate = () => {
    drawGrid();
    drawCart(x, y);
    x += stepX.current * speed.current * directionX.current;
    y += stepY.current * speed.current * directionY.current;
  };

  const handleStart = () => {
    if (!exec.current) {
      intervalId.current = setInterval(simulate, 1);
      exec.current = true;
    }
  };

  const handleStop = () => {
    if (exec.current) {
      clearInterval(intervalId.current);
      exec.current = false;
    }
  };

  function onKeyDown(e) {
    if (e.shiftKey) {
      document.body.style.cursor = "move";
    }

    if (e.keyCode == 27) {
      // ESC key
      if (IsMarkLayoutMode && !IsMarkReLayoutMode) {
        // 新規配置のとき
        keyPressEsc = true;
        OnMarkLayoutButtonClick();
      }
      if (IsMarkReLayoutMode) {
        // 修正のとき
        keyPressEsc = true;
        LandMarkLayout[MarkSelectingId].Fix = true;
        DrawCourse(); // コース再描画
        IsMarkLayoutMode = false;
        IsMarkReLayoutMode = false;
      }
      if (IsCourseLayoutMode || IsCourseReLayoutMode) {
        keyPressEsc = true;
        OnCourseLayoutButtonClick();
      }
      if (IsCartMovingMode) {
        CCart.Calc(prevCartPos, prevCartDeg);
        IsCartMovingMode.current = false;
        IsCartSelecting.current = false;
      }
    }

    if (e.keyCode == 46) {
      // DELETE key
      if (IsMarkReLayoutMode) {
        // 修正のとき
        LandMarkLayout.splice(MarkSelectingId, 1);
        DrawCourse(); // コース再描画
        IsMarkLayoutMode = false;
        IsMarkReLayoutMode = false;
      }
      if (IsCourseReLayoutMode) {
        if (CoursePosiesSelectingId >= 0) {
          // 点が選択されているときは点だけを削除
          let pos = CourseLayout[CourseSelectingId].Position;
          if (pos.length > 2) {
            //残点が2個より多い場合は点を削除
            CourseLayout[CourseSelectingId].Position.splice(CoursePosiesSelectingId, 1);
          } else {
            //残点が2個以下の場合は全部削除
            CourseLayout.splice(CourseSelectingId, 1);
          }
        }
        DrawCourse(); // コース再描画
        IsCourseLayoutMode = false;
        IsCourseReLayoutMode = false;
      }
    }

    UpdateCourseTextData();
    //console.log("keyDown: " + e.keyCode);
  }

  function onKeyUp(e) {
    if (!e.shiftKey) {
      if (IsMarkLayoutMode || IsCourseLayoutMode) {
        document.body.style.cursor = "pointer";
      } else {
        document.body.style.cursor = "auto";
      }
    }
    if (e.keyCode == 27) {
      keyPressEsc = false;
    }
    UpdateCourseTextData();
  }

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

  const drawAllCarts = () => {
    if (!cbTrace.current) clearCanvas(canvasCart);

    if (cbVisVehicle.current) {
      DrawImageVehicle(
        canvasCart.ctx,
        ImageVehicle,
        vehicle.current.Position,
        -vehicle.current.Radian,
        PRESET_THOUZER.scale,
        PRESET_THOUZER.offset
      );
    } else {
      DrawCart(vehicle.current, "rgb(128,32,32)", "1", canvasCart.ctx);
    }
  };

  const initDraw = () => {
    clearCanvas(canvasCart);
    clearCanvas(canvasCourse);
    clearCanvas(canvasGrid);
    offset.current = Point.Zero();

    vehicle.current = new CCart(vehicleProp, id.current);
    vehicle.current.Calc(VehicleStartPosition.current, VehicleStartDegree.current, scale.current, offset.current);

    drawGrid();
    drawAllCarts();
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

    window.onresize = fitCanvas;

    const val = fitCanvas();
    // console.log("canvasHeight🔵 ", val);

    VehicleStartPosition.current = Point.Zero();
    VehicleStartDegree.current = 0.0;

    ImageVehicle.src = PRESET_THOUZER.image;

    initDraw();
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
        const mspos = ClientToWorldPosition(onCanvasPos.current);
        cartPos.current = new Point(Math.round(mspos.x / 100) * 100, Math.round(mspos.y / 100) * 100);
        prevCartPos.current = vehicle.current.Position;
        prevCartDeg.current = vehicle.current.Degree;
        cartPos.current = vehicle.current.Position;
        cartDegree.current = vehicle.current.Degree;
        IsCartMovingMode.current = true;
        IsCartSelecting.current = true;

        DrawAllCarts(); // 全カート描画
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
      if (vehicle.current.Selecting(canvasCart.ctx, mspos)) {
        CartSelectingId.current = vehicle.current.Id;
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
                    <Button width={100} onClick={handleStart}>
                      Start
                    </Button>
                    <Button width={100} onClick={handleStop}>
                      Stop
                    </Button>
                  </Flex>

                  <CheckboxField
                    label="走行軌跡表示"
                    name="cb_trace"
                    defaultChecked={cbTrace.current}
                    onChange={handleTrace}
                  />
                  <CheckboxField
                    label="機体中央表示"
                    name="cb_scroll"
                    defaultChecked={cbScroll.current}
                    onChange={handleScroll}
                  />
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
