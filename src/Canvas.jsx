import React, { useEffect, useRef, useCallback, useState } from "react";
import * as Styles from "./Styles";
import { Authenticator, Flex, Button, TextAreaField, Divider, Grid, Card, Tabs } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { PRESET_THOUZER, ImageVehicle } from "./PresetVehicle";
import * as P2D from "./CoordinateFunctions";
import { Point } from "./CoordinateFunctions";
import { AUTOSTART, OPERATION } from "./OperationPatern";
import { CCart } from "./CCart";
import { CLandMark } from "./CLandmark";
import { CCourse } from "./CCourse";

const DEBUG = false;
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

  const context = {
    canvas: "",
    ctx: "",
  };

  let x = 300,
    y = 300;

  // 線の描画イベント
  const drawCart = (x, y) => {
    if (x > context.canvas.width - 40) directionX.current = -1;
    if (y > context.canvas.height - 40) directionY.current = -1;
    if (x < 40) directionX.current = 1;
    if (y < 40) directionY.current = 1;

    // context.ctx.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.ctx.save();
    context.ctx.scale(PRESET_THOUZER.scale, PRESET_THOUZER.scale);
    context.ctx.translate(-PRESET_THOUZER.offset, -PRESET_THOUZER.offset);
    context.ctx.drawImage(
      ImageVehicle,
      x / PRESET_THOUZER.scale,
      y / PRESET_THOUZER.scale,
      ImageVehicle.width,
      ImageVehicle.height
    );
    context.ctx.restore();
  };

  /**
   * Gridキャンパスに5m,1mグリッドを描画
   */
  const drawGrid = () => {
    context.ctx.clearRect(0, 0, context.canvas.width, context.canvas.height);

    // 1m間隔グリッド
    context.ctx.lineWidth = "1";
    context.ctx.strokeStyle = "rgb(225,225,225)";
    for (let x = 0; x < context.canvas.width + offset.current.x; x += 1000 * scale.current) {
      context.ctx.beginPath();
      context.ctx.moveTo(x - offset.current.x, 0);
      context.ctx.lineTo(x - offset.current.x, context.canvas.height);
      context.ctx.stroke();
    }
    for (let y = 0; y < context.canvas.height + offset.current.y; y += 1000 * scale.current) {
      context.ctx.beginPath();
      context.ctx.moveTo(0, y - offset.current.y);
      context.ctx.lineTo(context.canvas.width, y - offset.current.y);
      context.ctx.stroke();
    }
    for (let x = 0; x > -context.canvas.width + offset.current.x; x -= 1000 * scale.current) {
      context.ctx.beginPath();
      context.ctx.moveTo(x - offset.current.x, 0);
      context.ctx.lineTo(x - offset.currentx, context.canvas.height);
      context.ctx.stroke();
    }
    for (let y = 0; y > -context.canvas.height + offset.current.y; y -= 1000 * scale.current) {
      context.ctx.beginPath();
      context.ctx.moveTo(0, y - offset.current.y);
      context.ctx.lineTo(context.canvas.width, y - offset.current.y);
      context.ctx.stroke();
    }

    // 5m間隔グリッド
    context.ctx.lineWidth = "1";
    context.ctx.strokeStyle = "rgb(192,192,192)";
    for (let x = 0; x < context.canvas.width + offset.current.x; x += 5000 * scale.current) {
      context.ctx.beginPath();
      context.ctx.moveTo(x - offset.current.x, 0);
      context.ctx.lineTo(x - offset.current.x, context.canvas.height);
      context.ctx.stroke();
    }
    for (let y = 0; y < context.canvas.height + offset.current.y; y += 5000 * scale.current) {
      context.ctx.beginPath();
      context.ctx.moveTo(0, y - offset.current.y);
      context.ctx.lineTo(context.canvas.width, y - offset.current.y);
      context.ctx.stroke();
    }
    for (let x = 0; x > -context.canvas.width + offset.current.x; x -= 5000 * scale.current) {
      context.ctx.beginPath();
      context.ctx.moveTo(x - offset.current.x, 0);
      context.ctx.lineTo(x - offset.current.x, context.canvas.height);
      context.ctx.stroke();
    }
    for (let y = 0; y > -context.canvas.height + offset.current.y; y -= 5000 * scale.current) {
      context.ctx.beginPath();
      context.ctx.moveTo(0, y - offset.current.y);
      context.ctx.lineTo(context.canvas.width, y - offset.current.y);
      context.ctx.stroke();
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
      context.ctx.prevX = context.ctx.currX;
      context.ctx.prevY = context.ctx.currY;
      context.ctx.currX = event.clientX - context.ctx.canvas.offsetLeft;
      context.ctx.currY = event.clientY - context.ctx.canvas.offsetTop;
    }

    if (event.type == "mousedown") {
      drawCart(x, y);
    }

    if (event.type == "mouseup" || event.type == "mouseout") {
      context.ctx.drawFlag = false;
    }

    if (event.type == "mousemove" && context.ctx.drawFlag) {
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
        CVehicle.Calc(prevCartPos, prevCartDeg);
        IsCartMovingMode = false;
        IsCartSelecting = false;
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

  const resizeFitCanvas = () => {
    const val = document.getElementById("canvasAreaCard");
    context.canvas.width = val.clientWidth;
    context.canvas.height = val.clientHeight;
  };

  useEffect(() => {
    document.body.style.overflow = "hidden"; //ブラウザのスクロールバーを表示させない

    context.canvas = document.getElementById("simulateCanvas");
    context.ctx = context.canvas.getContext("2d");

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    window.addEventListener("resize", resizeFitCanvas);

    resizeFitCanvas();

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
        <h3>MQTT Driving Simulator</h3>
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
                  <label>
                    Command
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
                  <p>Content of the second tab.</p>
                  <Button isFullWidth onClick={() => setTab("1")}>
                    Back to Simulate tab
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
      <Card id="canvasAreaCard" columnStart="2" columnEnd="-1" padding="0">
        <Flex>
          <canvas id="simulateCanvas" style={Styles.canvasSimulate}></canvas>
          {/* <canvas id="canvasGrid" width="100%" height="100%" style={Styles.canvasGrid}></canvas> */}
          {/* <canvas id="canvasCourse" width="100%" height="100%" style={Styles.canvasCourse}></canvas> */}
          {/* <canvas id="canvasCart" width="100%" height="100%" style={Styles.canvasCart}></canvas> */}
        </Flex>
      </Card>
      <Card columnStart="2" columnEnd="-1">
        Footer
      </Card>
    </Grid>
  );
}

export default Canvas;
