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
import { Point, WorldToClientPosition, WorldToClientScale } from "./CoordinateFunctions";
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
  const IsCartSelecting = useRef(false);
  const IsCartMovingMode = useRef(false);

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

  const contextCart = {
    canvas: "",
    ctx: "",
  };
  const contextGrid = {
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
    clearCanvas();

    // 1m間隔グリッド
    contextGrid.ctx.lineWidth = "1";
    contextGrid.ctx.strokeStyle = "rgb(225,225,225)";
    for (let x = 0; x < contextGrid.canvas.width + offset.current.x; x += 1000 * scale.current) {
      contextGrid.ctx.beginPath();
      contextGrid.ctx.moveTo(x - offset.current.x, 0);
      contextGrid.ctx.lineTo(x - offset.current.x, contextGrid.canvas.height);
      contextGrid.ctx.stroke();
    }
    for (let y = 0; y < contextGrid.canvas.height + offset.current.y; y += 1000 * scale.current) {
      contextGrid.ctx.beginPath();
      contextGrid.ctx.moveTo(0, y - offset.current.y);
      contextGrid.ctx.lineTo(contextGrid.canvas.width, y - offset.current.y);
      contextGrid.ctx.stroke();
    }
    for (let x = 0; x > -contextGrid.canvas.width + offset.current.x; x -= 1000 * scale.current) {
      contextGrid.ctx.beginPath();
      contextGrid.ctx.moveTo(x - offset.current.x, 0);
      contextGrid.ctx.lineTo(x - offset.currentx, contextGrid.canvas.height);
      contextGrid.ctx.stroke();
    }
    for (let y = 0; y > -contextGrid.canvas.height + offset.current.y; y -= 1000 * scale.current) {
      contextGrid.ctx.beginPath();
      contextGrid.ctx.moveTo(0, y - offset.current.y);
      contextGrid.ctx.lineTo(contextGrid.canvas.width, y - offset.current.y);
      contextGrid.ctx.stroke();
    }

    // 5m間隔グリッド
    contextGrid.ctx.lineWidth = "1";
    contextGrid.ctx.strokeStyle = "rgb(192,192,192)";
    for (let x = 0; x < contextGrid.canvas.width + offset.current.x; x += 5000 * scale.current) {
      contextGrid.ctx.beginPath();
      contextGrid.ctx.moveTo(x - offset.current.x, 0);
      contextGrid.ctx.lineTo(x - offset.current.x, contextGrid.canvas.height);
      contextGrid.ctx.stroke();
    }
    for (let y = 0; y < contextGrid.canvas.height + offset.current.y; y += 5000 * scale.current) {
      contextGrid.ctx.beginPath();
      contextGrid.ctx.moveTo(0, y - offset.current.y);
      contextGrid.ctx.lineTo(contextGrid.canvas.width, y - offset.current.y);
      contextGrid.ctx.stroke();
    }
    for (let x = 0; x > -contextGrid.canvas.width + offset.current.x; x -= 5000 * scale.current) {
      contextGrid.ctx.beginPath();
      contextGrid.ctx.moveTo(x - offset.current.x, 0);
      contextGrid.ctx.lineTo(x - offset.current.x, contextGrid.canvas.height);
      contextGrid.ctx.stroke();
    }
    for (let y = 0; y > -contextGrid.canvas.height + offset.current.y; y -= 5000 * scale.current) {
      contextGrid.ctx.beginPath();
      contextGrid.ctx.moveTo(0, y - offset.current.y);
      contextGrid.ctx.lineTo(contextGrid.canvas.width, y - offset.current.y);
      contextGrid.ctx.stroke();
    }
  };

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

  /**
   * マウスイベントの座標を取得及びイベント毎による処理を振り分ける
   * @param {*} event
   */
  const getCoordinate = (event) => {
    if (event.type == "mousedown" || event.type == "mousemove") {
      contextCart.ctx.prevX = contextCart.ctx.currX;
      contextCart.ctx.prevY = contextCart.ctx.currY;
      contextCart.ctx.currX = event.clientX - contextCart.ctx.canvas.offsetLeft;
      contextCart.ctx.currY = event.clientY - contextCart.ctx.canvas.offsetTop;
    }

    if (event.type == "mousedown") {
      drawCart(x, y);
    }

    if (event.type == "mouseup" || event.type == "mouseout") {
      contextCart.ctx.drawFlag = false;
    }

    if (event.type == "mousemove" && contextCart.ctx.drawFlag) {
      drawCart(x, y);
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
      const val = document.getElementById("canvasAreaCard");
      contextCart.canvas.width = val.clientWidth;
      contextCart.canvas.height = val.clientHeight;
      contextGrid.canvas.width = val.clientWidth;
      contextGrid.canvas.height = val.clientHeight;
    }
  };

  const clearCanvas = () => {
    contextCart.ctx.clearRect(0, 0, contextCart.canvas.width, contextCart.canvas.height);
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
    if (!cbTrace.current) clearCanvas();

    if (cbVisVehicle.current) {
      DrawImageVehicle(
        contextCart.ctx,
        ImageVehicle,
        vehicle.current.Position,
        -vehicle.current.Radian,
        PRESET_THOUZER.scale,
        PRESET_THOUZER.offset
      );
    } else {
      DrawCart(vehicle.current, "rgb(128,32,32)", "1", contextCart.ctx);
    }
  };

  const initDraw = () => {
    clearCanvas();
    offset.current = Point.Zero();

    vehicle.current = new CCart(vehicleProp, id.current);
    vehicle.current.Calc(VehicleStartPosition.current, VehicleStartDegree.current, scale.current, offset.current);

    drawGrid();
    drawAllCarts();
  };

  useEffect(() => {
    document.body.style.overflow = "hidden"; //ブラウザのスクロールバーを表示させない

    contextCart.canvas = document.getElementById("simulateCanvas");
    contextCart.ctx = contextCart.canvas.getContext("2d");
    contextGrid.canvas = document.getElementById("gridCanvas");
    contextGrid.ctx = contextGrid.canvas.getContext("2d");

    // document.addEventListener("keydown", onKeyDown);
    // document.addEventListener("keyup", onKeyUp);

    window.onresize = fitCanvas;

    fitCanvas();

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

  return (
    <Grid
      height="98%"
      margin="10px"
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
      <Card id="canvasAreaCard" columnStart="2" columnEnd="-1" padding="0" margin="0">
        <div style={Styles.divBlock}>
          <div style={Styles.divBlockChild}>
            <canvas id="gridCanvas" style={Styles.canvasGrid}></canvas>
          </div>
          <div style={Styles.divBlockChild}>
            <canvas id="simulateCanvas" style={Styles.canvasSimulate}></canvas>
          </div>
        </div>
      </Card>
      <Card columnStart="2" columnEnd="-1">
        Footer
      </Card>
    </Grid>
  );
}

export default Canvas;
