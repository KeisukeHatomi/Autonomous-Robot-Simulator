import React, { useEffect, useRef, useCallback, useState } from "react";
import * as Styles from "./Styles";
import {
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
	TextField,
	Fieldset,
	SelectField,
	ButtonGroup,
	ToggleButtonGroup,
	ToggleButton,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { PRESET_THOUZER, ImageVehicle, PRESET_CARRIRO } from "./PresetVehicle";
import { PRESET_RIGIDCART, PRESET_ROLLBOXCART1 } from "./PresetCart";
import { ImageLandMark, OperationType } from "./PresetLandmark";
import { AUTOSTART, OPERATION } from "./OperationPatern";
import {
	Point,
	WorldToClientPosition,
	WorldToClientPositionX,
	WorldToClientPositionY,
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
import DataFile from "./DataFile";

const DEBUG = true;

function Canvas({ command, client, user, signOut }) {
	console.log('🔵Canvas');
	const { loginId } = user.signInDetails

	const DEFAULT_SCALE = 0.1;
	const CR = "\n";
	const LANDMARK_IMAGE_SCALE = 0.5; // 元画像サイズに合わせた比率
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
	const cbVisLandmark = useRef(true);
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
	const IsMarkReLayoutMode = useRef(false);
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
	const [times, setTimes] = useState(100); //再生速度
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
	const [btnStartDisable, setBtnStartDisable] = useState(false);
	const [btnResetDisable, setBtnResetDisable] = useState(false);
	const [btnStartContent, setBtnStartContent] = useState("Start");
	const currentLandmarkId = useRef(0);
	const [cbRigidCart, setCbRigid] = useState(false);
	const [cbTowCart, setCbTowCart] = useState(false);
	const [TowCartQty, setTowCartQty] = useState(1);
	const [sliderSimSpeedDisable, setSliderSimSpeedDisable] = useState(false);
	const [sliderTraceIntervalDisable, setSliderTraceIntervalDisable] =
		useState(true);
	const Mileage = useRef(0.0);
	const StackLandmarkID = useRef([]);
	const prevSpeed = useRef(0.0);
	const Modify = useRef(false);
	const MarkSelectingId = useRef(-1);
	const markType = useRef(0)
	const CoursePosiesSelectingId = useRef(-1)
	const CourseElementSelectingId = useRef(-1)
	const CourseSelectingId = useRef(-1)
	const coursePos = useRef(Point.Zero())
	const coursePosies = useRef([])
	const msdownWS = useRef(0)
	const prevCoursePosies = useRef([])
	const CourseType = useRef(0);
	const [exclusiveMarkValue, setExclusiveMarkValue] = useState("");
	const [exclusiveCourseValue, setExclusiveCourseValue] = useState("");
	const layoutData = useRef("");

	// 走行機体プリセット
	const [vehicleProp, setVehicleProp] = useState(PRESET_THOUZER.size);
	// 剛体連結台車プリセット
	const [rigidCartProp, setRigidCartProp] = useState(PRESET_RIGIDCART.size);
	// 牽引台車プリセット
	const [towCartProp, setTowCartProp] = useState(PRESET_ROLLBOXCART1.size);

	const [rangeStep, setRangeStep] = useState(100);

	const canvasCart = useRef({
		canvas: "",
		ctx: "",
	});
	const canvasGrid = useRef({
		canvas: "",
		ctx: "",
	});
	const canvasCourse = useRef({
		canvas: "",
		ctx: "",
	});
	const canvasAll = useRef();

	const DATATITLE_VEHICLE = "Vehicle";
	const DATATITLE_RIGIDCART = "RigidCart";
	const DATATITLE_TOWCART = "TowCart";
	const DATATITLE_LANDMARK = "LandmarkLayout";
	const DATATITLE_COURSE = "CourseLayout";

	/**
	 * 初期画面描画
	 */
	const initDraw = () => {
		console.log('🔵InitDraw');
		clearCanvas(canvasCart.current);

		offset.current = Point.Zero();
		drawGrid();

		id.current = 0;

		// 走行機体生成
		CVehicle.current = new CCart(vehicleProp, id.current);
		CVehicle.current.Calc(
			VehicleStartPosition.current,
			VehicleStartDegree.current,
			scale.current,
			offset.current
		);

		let prev_towpos = CVehicle.current.TowPos;

		// 台車剛体連結生成
		if (cbRigidCart) {
			CRigidCart.current = new CCart(rigidCartProp, id.current++);
			CRigidCart.current.Calc(
				CVehicle.current.LinkPos,
				VehicleStartDegree.current,
				scale.current,
				offset.current
			);
			prev_towpos = CRigidCart.current.TowPos;
		}

		// 牽引台車 1~ 生成
		CTowCart.current = [];
		if (cbTowCart) {
			for (let i = 0; i < TowCartQty; i++) {
				CTowCart.current.push(new CCart(towCartProp, id.current++));
				CTowCart.current[i].Calc(
					prev_towpos,
					VehicleStartDegree.current,
					scale.current,
					offset.current
				);
				prev_towpos = CTowCart.current[i].TowPos;
			}
		}

		// 機体をcanvasの中心にオフセット
		offset.current.x =
			VehicleStartPosition.current.x * scale.current -
			canvasCart.current.canvas.width / 2;
		offset.current.y =
			VehicleStartPosition.current.y * scale.current -
			canvasCart.current.canvas.height / 2;
		prevMousePoint.current = offset.current;

		drawGrid();
		drawAllCarts();
		drawCourse(); // コース描画
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
		const imgScale = scale.current / scl;
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
		if (cbVisLandmark.current)
			ctx.drawImage(image, -cx, -cy, image.width, image.height);
		// コンテキストを元に戻す
		ctx.restore();
	};

	/**
	 * 全カートを描画する
	 */
	const drawAllCarts = () => {
		if (!cbTrace.current) clearCanvas(canvasCart.current);

		if (cbVisVehicle.current) {
			DrawImageVehicle(
				canvasCart.current.ctx,
				ImageVehicle,
				CVehicle.current.Position,
				-CVehicle.current.Radian,
				PRESET_THOUZER.scale,
				PRESET_THOUZER.offset
			);
		} else {
			DrawCart(CVehicle.current, "rgb(128,32,32)", "2", canvasCart.current.ctx);
		}

		if (cbRigidCart) {
			DrawCart(
				CRigidCart.current,
				"rgb(64,64,64)",
				"2",
				canvasCart.current.ctx
			);
		}

		if (TowCartQty > 0) {
			CTowCart.current.forEach((element) => {
				DrawCart(element, "rgb(64,64,64)", "2", canvasCart.current.ctx);
			});
		}
	};

	// function createRoundRectPath(ctx, x, y, w, h, r) {
	// 	ctx.beginPath();
	// 	ctx.moveTo(x + r, y);
	// 	ctx.lineTo(x + w - r, y);
	// 	ctx.arc(x + w - r, y + r, r, Math.PI * (3 / 2), 0, false);
	// 	ctx.lineTo(x + w, y + h - r);
	// 	ctx.arc(x + w - r, y + h - r, r, 0, Math.PI * (1 / 2), false);
	// 	ctx.lineTo(x + r, y + h);
	// 	ctx.arc(x + r, y + h - r, r, Math.PI * (1 / 2), Math.PI, false);
	// 	ctx.lineTo(x, y + r);
	// 	ctx.arc(x + r, y + r, r, Math.PI, Math.PI * (3 / 2), false);
	// 	ctx.closePath();
	// 	ctx.stroke();
	// }

	function createRoundRectPath(ctx, cobj) {
		const lp = WorldToClientPosition(cobj.Position, scale.current, offset.current);
		const fp = WorldToClientPosition(cobj.FrontPos, scale.current, offset.current);
		const lf = WorldToClientPosition(cobj.LeftFront, scale.current, offset.current);
		const rf = WorldToClientPosition(cobj.RightFront, scale.current, offset.current);
		const rr = WorldToClientPosition(cobj.RightRear, scale.current, offset.current);
		const lr = WorldToClientPosition(cobj.LeftRear, scale.current, offset.current);
		const r = WorldToClientScale(100, scale.current);
		const w = lf.x - lr.x
		const h = rr.y - lr.y
		const p = WorldToClientPosition(cobj.Position, scale.current, offset.current);
		const s0 = new Point(100, -50)
		const s1 = new Point(100, 50)
		ctx.beginPath();
		ctx.moveTo(lr.x, lr.y);
		ctx.lineTo(rr.x, rr.y);
		// ctx.arc(rr.x + r, rr.y - r, r, Math.PI * (2 / 2), false);
		ctx.lineTo(rf.x, rf.y);
		// ctx.arc(rf.x  - r, rf.y - r, r, 0, Math.PI * (4 / 2), false);
		ctx.lineTo(lf.x, lf.y);
		// ctx.arc(lr.x + r, lr.y + h - r, r, Math.PI * (1 / 2), Math.PI, false);
		ctx.lineTo(lr.x, lr.y);
		// ctx.arc(lr.x + r, lr.y + r, r, Math.PI, Math.PI * (3 / 2), false);

		ctx.closePath();
		ctx.stroke();

	}
	/**
	 * 一台のカートを描画する
	 * @param {*} cobj
	 * @param {*} color
	 * @param {*} width
	 * @param {*} ctx
	 */
	const DrawCart = (cobj, color, width, ctx) => {
		// createRoundRectPath(ctx, cobj);
		// 角RのBOXうまくいかない・・

		const lp = WorldToClientPosition(cobj.Position, scale.current, offset.current);
		const fp = WorldToClientPosition(cobj.FrontPos, scale.current, offset.current);
		const lf = WorldToClientPosition(cobj.LeftFront, scale.current, offset.current);
		const rf = WorldToClientPosition(cobj.RightFront, scale.current, offset.current);
		const rr = WorldToClientPosition(cobj.RightRear, scale.current, offset.current);
		const lr = WorldToClientPosition(cobj.LeftRear, scale.current, offset.current);
		ctx.beginPath();
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
		clearCanvas(canvasGrid.current);

		// 1m間隔グリッド
		canvasGrid.current.ctx.lineWidth = "1";
		canvasGrid.current.ctx.strokeStyle = "rgb(225,225,225)";
		for (
			let x = 0;
			x < canvasGrid.current.canvas.width + offset.current.x;
			x += 1000 * scale.current
		) {
			canvasGrid.current.ctx.beginPath();
			canvasGrid.current.ctx.moveTo(x - offset.current.x, 0);
			canvasGrid.current.ctx.lineTo(
				x - offset.current.x,
				canvasGrid.current.canvas.height
			);
			canvasGrid.current.ctx.stroke();
		}
		for (
			let y = 0;
			y < canvasGrid.current.canvas.height + offset.current.y;
			y += 1000 * scale.current
		) {
			canvasGrid.current.ctx.beginPath();
			canvasGrid.current.ctx.moveTo(0, y - offset.current.y);
			canvasGrid.current.ctx.lineTo(
				canvasGrid.current.canvas.width,
				y - offset.current.y
			);
			canvasGrid.current.ctx.stroke();
		}
		for (
			let x = 0;
			x > -canvasGrid.current.canvas.width + offset.current.x;
			x -= 1000 * scale.current
		) {
			canvasGrid.current.ctx.beginPath();
			canvasGrid.current.ctx.moveTo(x - offset.current.x, 0);
			canvasGrid.current.ctx.lineTo(
				x - offset.current.x,
				canvasGrid.current.canvas.height
			);
			canvasGrid.current.ctx.stroke();
		}
		for (
			let y = 0;
			y > -canvasGrid.current.canvas.height + offset.current.y;
			y -= 1000 * scale.current
		) {
			canvasGrid.current.ctx.beginPath();
			canvasGrid.current.ctx.moveTo(0, y - offset.current.y);
			canvasGrid.current.ctx.lineTo(
				canvasGrid.current.canvas.width,
				y - offset.current.y
			);
			canvasGrid.current.ctx.stroke();
		}

		// 5m間隔グリッド
		canvasGrid.current.ctx.lineWidth = "1";
		canvasGrid.current.ctx.strokeStyle = "rgb(192,192,192)";
		for (
			let x = 0;
			x < canvasGrid.current.canvas.width + offset.current.x;
			x += 5000 * scale.current
		) {
			canvasGrid.current.ctx.beginPath();
			canvasGrid.current.ctx.moveTo(x - offset.current.x, 0);
			canvasGrid.current.ctx.lineTo(
				x - offset.current.x,
				canvasGrid.current.canvas.height
			);
			canvasGrid.current.ctx.stroke();
		}
		for (
			let y = 0;
			y < canvasGrid.current.canvas.height + offset.current.y;
			y += 5000 * scale.current
		) {
			canvasGrid.current.ctx.beginPath();
			canvasGrid.current.ctx.moveTo(0, y - offset.current.y);
			canvasGrid.current.ctx.lineTo(
				canvasGrid.current.canvas.width,
				y - offset.current.y
			);
			canvasGrid.current.ctx.stroke();
		}
		for (
			let x = 0;
			x > -canvasGrid.current.canvas.width + offset.current.x;
			x -= 5000 * scale.current
		) {
			canvasGrid.current.ctx.beginPath();
			canvasGrid.current.ctx.moveTo(x - offset.current.x, 0);
			canvasGrid.current.ctx.lineTo(
				x - offset.current.x,
				canvasGrid.current.canvas.height
			);
			canvasGrid.current.ctx.stroke();
		}
		for (
			let y = 0;
			y > -canvasGrid.current.canvas.height + offset.current.y;
			y -= 5000 * scale.current
		) {
			canvasGrid.current.ctx.beginPath();
			canvasGrid.current.ctx.moveTo(0, y - offset.current.y);
			canvasGrid.current.ctx.lineTo(
				canvasGrid.current.canvas.width,
				y - offset.current.y
			);
			canvasGrid.current.ctx.stroke();
		}
	};

	/**
	 * コース・ランドマークを描画する
	 */
	const drawCourse = () => {
		clearCanvas(canvasCourse.current);

		// Landmark
		LandMarkLayout.current.forEach((element) => {
			const id = element.Id;
			const type = element.Type;
			const shadow = !element.Fix;

			const pos = element.Fix ? element.Position : markPos.current;
			const deg = element.Fix ? element.Angle : markAngle.current;

			DrawImageLandMark(
				canvasCourse.current.ctx,
				ImageLandMark[type],
				pos,
				DegToRad(deg),
				LANDMARK_IMAGE_SCALE,
				shadow
			);
		});

		// Course
		canvasCourse.current.ctx.lineWidth = WorldToClientScale(
			200,
			scale.current,
			offset.current
		);
		canvasCourse.current.ctx.strokeStyle = "rgb(128,128,128)";
		canvasCourse.current.ctx.lineCap = "round";
		canvasCourse.current.ctx.lineJoin = "round";

		CourseLayout.current.forEach((element) => {
			const pos = element.Position;
			if (pos.length > 0) {
				canvasCourse.current.ctx.beginPath();
				const p0 = WorldToClientPosition(pos[0], scale.current, offset.current);
				canvasCourse.current.ctx.moveTo(p0.x, p0.y);
				for (let i = 1; i < pos.length; i++) {
					const pi = WorldToClientPosition(
						pos[i],
						scale.current,
						offset.current
					);
					canvasCourse.current.ctx.lineTo(pi.x, pi.y);
				}
				canvasCourse.current.ctx.stroke();
			}
		});
	};

	//
	// シミュレーション
	//

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
				DriveTime.current.push((ope[i][0] / prevSpeed.current) * 1000);
				DriveLeftSpeed.current.push(prevSpeed.current);
				DriveRightSpeed.current.push(prevSpeed.current);
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

		// 表示域のステータスを更新　※直接DOMを操作しているので、Reactでは推奨されません・・
		document.getElementById("simTime").innerHTML = (simTime.current / 1000).toFixed(1);
		document.getElementById("posx").innerHTML = (CVehicle.current.Position.x / 1000).toFixed(2);
		document.getElementById("posy").innerHTML = (CVehicle.current.Position.y / 1000).toFixed(2);
		document.getElementById("angle").innerHTML = CVehicle.current.Degree.toFixed(1);
		document.getElementById("milage").innerHTML = (Mileage.current / 1000).toFixed(2);
		document.getElementById("speed").innerHTML = (speed.current / 1000).toFixed(2);

		// 次の位置を計算
		if (!nextPosition()) {
			//戻り値がfalseの場合、シミュレーション終了
			clearInterval(intervalId.current);
			exec.current = false;
			setBtnStartDisable(true);

			setBtnResetDisable(false);
			setSliderSimSpeedDisable(false);
			setBtnStartContent("Start");
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
				offset.current.x = offs.x - canvasCart.current.canvas.width / 2;
				offset.current.y = offs.y - canvasCart.current.canvas.height / 2;

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
					const LAng = LandMarkLayout.current[id].Angle;
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
		CVehicle.current.Calc(pos, deg, scale.current, offset.current);

		// 機体剛体連結台車の場合
		if (cbRigidCart) {
			CRigidCart.current.Calc(
				CVehicle.current.LinkPos,
				deg,
				scale.current,
				offset.current
			);
		}

		// 牽引台車の場合
		if (cbTowCart && TowCartQty > 0) {
			// 潜り込み連結時の牽引ならば、台車に牽引連結し、機体単独ならば、機体に牽引連結する
			const prev_towpos = cbRigidCart
				? CRigidCart.current.TowPos
				: CVehicle.current.TowPos;

			let _prev_towpos = prev_towpos;
			CTowCart.current.forEach((element) => {
				const _deg = RadToDeg(PointToAngle(element.DrivingPos, _prev_towpos));
				const _pos = _prev_towpos;
				element.Calc(_pos, _deg, scale.current, offset.current);
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

	const updateFileData = () => {
		console.log('🔵UpdateTextData');

		layoutData.current = {
			[DATATITLE_VEHICLE]: {
				"type": PRESET_THOUZER.type,
				"StartPositionX": VehicleStartPosition.current.x,
				"StartPositionY": VehicleStartPosition.current.y,
				"StartDegree": VehicleStartDegree.current,
				"size": vehicleProp,
			},
			[DATATITLE_RIGIDCART]: {
				"connect": cbRigidCart,
				"size": rigidCartProp,
			},
			[DATATITLE_TOWCART]: {
				"connect": cbTowCart,
				"qty": TowCartQty,
				"size": towCartProp,
			},
			[DATATITLE_LANDMARK]: LandMarkLayout.current.map((e) => {
				return {
					"type": e.Type,
					"position": e.Position,
					"angle": e.Angle,
					"fix": e.Fix,
				}
			}),
			[DATATITLE_COURSE]: CourseLayout.current.map((e) => {
				return {
					"type": e.Type,
					"position": e.Position.map((v) => v),
					"fix": e.Fix,
				}
			}),
		}

		// console.log('layoutData.current🔵 ', layoutData.current);
	};


	const resetSimulateParam = () => {
		console.log('🔵ResetSimulateParam');
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
		document.getElementById("simTime").innerHTML = (
			simTime.current / 1000
		).toFixed(1);
		document.getElementById("posx").innerHTML =
			CVehicle.current.Position.x.toFixed(2);
		document.getElementById("posy").innerHTML =
			CVehicle.current.Position.y.toFixed(2);
		document.getElementById("angle").innerHTML =
			CVehicle.current.Degree.toFixed(1);
		document.getElementById("milage").innerHTML = (
			Mileage.current / 1000
		).toFixed(2);
		document.getElementById("speed").innerHTML = (
			(speed.current / 1000000) *
			3600
		).toFixed(2);
	};

	const fitCanvas = () => {
		if (!exec.current) {
			const { clientWidth, clientHeight } =
				document.getElementById("canvasAreaCard");
			canvasCart.current.canvas.width = clientWidth;
			canvasCart.current.canvas.height = clientHeight - 8; // 8pxほど高さを小さくしないと合わない。。
			canvasCourse.current.canvas.width = clientWidth;
			canvasCourse.current.canvas.height = clientHeight - 8;
			canvasGrid.current.canvas.width = clientWidth;
			canvasGrid.current.canvas.height = clientHeight - 8;
			return { clientWidth, clientHeight };
		}
	};

	const clearCanvas = (canvas) => {
		canvas.ctx.clearRect(0, 0, canvas.canvas.width, canvas.canvas.height);
	};

	useEffect(() => {
		// document.body.style.overflow = "hidden"; //ブラウザのスクロールバーを表示させない
		canvasCart.current.canvas = document.getElementById("cartCanvas");
		canvasCart.current.ctx = canvasCart.current.canvas.getContext("2d");
		canvasGrid.current.canvas = document.getElementById("gridCanvas");
		canvasGrid.current.ctx = canvasGrid.current.canvas.getContext("2d");
		canvasCourse.current.canvas = document.getElementById("courseCanvas");
		canvasCourse.current.ctx = canvasCourse.current.canvas.getContext("2d");

		canvasAll.current = document.getElementById("canvasAreaCard");


		document.addEventListener("keydown", onKeyDown);
		document.addEventListener("keyup", onKeyUp);

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
	}, []);

	useEffect(() => {
		console.log('🔵useEffect2');
		OnResetButtonClick();
		// updateCourseTextData();
	}, [
		cbRigidCart,
		cbTowCart,
		TowCartQty,
		vehicleProp,
		rigidCartProp,
		towCartProp,
	]);

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

	const handleClickOpePointer = (e) => {
		console.log('🔵handleClickOpePointer');
		if (e) {
			setExclusiveMarkValue(e);
			IsMarkLayoutMode.current = true;
			Modify.current = true;
		} else {
			setExclusiveMarkValue("");
			IsMarkLayoutMode.current = false;
			Modify.current = true;
		}
		markType.current = OperationType[e];

		if (IsMarkLayoutMode.current) {
			LandMarkLayout.current.map(({ Fix }) => {
				// マークが選びなおされている場合、Fix 値が false なので、それを取り除く
				if (!Fix) LandMarkLayout.current.pop();
			})
			MarkSelectingId.current = LandMarkLayout.current.length;
			LandMarkLayout.current.push(new CLandMark(markType.current, markPos.current, markAngle.current, false));
			document.body.style.cursor = "pointer";
		} else {
			if (!LandMarkLayout.current[MarkSelectingId.current].Fix) {
				LandMarkLayout.current.pop();
			}
			document.body.style.cursor = "auto";

			updateFileData();
			drawCourse(); // コース再描画
		}

	};

	const handleClickCourseLayout = (e) => {
		console.log('🔵handleClickCourseLayout');
		if (e) {
			setExclusiveCourseValue(e);
			IsCourseLayoutMode.current = true;
			Modify.current = true;
		} else {
			setExclusiveCourseValue("");
			IsCourseLayoutMode.current = false;
			Modify.current = true;
		}

		if (IsCourseLayoutMode.current) {
			msdownWS.current = 0;
			coursePosies.current = [];
			coursePosies.current.push(coursePos.current);
			CourseLayout.current.push(new CCourse(CourseType.current, coursePosies.current, false));
			// console.log('CourseLayout.current🔵 ', CourseLayout.current);
			CourseSelectingId.current = CourseLayout.current.length - 1;
			CoursePosiesSelectingId.current = coursePosies.current.length - 1;

			document.body.style.cursor = "pointer";
		} else {
			msdownWS.current = 2;
			if (!CourseLayout.current[CourseSelectingId.current].Fix && !IsCourseReLayoutMode.current) {
				CourseLayout.current[CourseSelectingId.current].Position.pop();
				CourseLayout.current[CourseSelectingId.current].Fix = true;
			}

			if (!CourseLayout.current[CourseSelectingId.current].Fix && IsCourseReLayoutMode.current) {
				CourseLayout.current[CourseSelectingId.current].Fix = true;
				CourseLayout.current[CourseSelectingId.current].Position = prevCoursePosies.current.concat();
				IsCourseReLayoutMode.current = false;
			}

			document.body.style.cursor = "auto";
		}

		updateFileData();
		drawCourse(); // コース再描画
	}

	const handleInputVehiclePropNum = (e) => {
		const { name, value } = e.currentTarget;
		setVehicleProp((prevVehicleProp) => ({
			...prevVehicleProp,
			[name]: value,
		}));
		updateFileData();
	};

	const handleInputVehiclePropPoint = (e) => {
		const { name, value } = e.currentTarget;
		setVehicleProp((prevVehicleProp) => ({
			...prevVehicleProp,
			[name]: new Point(value, 0),
		}));
		updateFileData();
	};

	const handleInputRigidCartPropNum = (e) => {
		const { name, value } = e.currentTarget;
		setRigidCartProp((prevRigidCartProp) => ({
			...prevRigidCartProp,
			[name]: value,
		}));
		updateFileData();
	};

	const handleInputRigidCartPropPoint = (e) => {
		const { name, value } = e.currentTarget;
		setRigidCartProp((prevRigidCartProp) => ({
			...prevRigidCartProp,
			[name]: new Point(value, 0),
		}));
		updateFileData();
	};

	const handleInputTowCartPropNum = (e) => {
		const { name, value } = e.currentTarget;
		setTowCartProp((prevTowCartProp) => ({
			...prevTowCartProp,
			[name]: value,
		}));
		updateFileData();
	};

	const handleInputTowCartPropPoint = (e) => {
		const { name, value } = e.currentTarget;
		setTowCartProp((prevTowCartProp) => ({
			...prevTowCartProp,
			[name]: new Point(value, 0),
		}));
		updateFileData();
	};

	const handleChangeTow = (e) => {
		if (exec.current) {
			OnStartStopButtonClick();
		}
		setCbTowCart(e.target.checked);

		if (e.target.checked) {
			setTowCartQty(TowCartQty);
		}
		updateFileData();
	};

	const handleCangeTowCartQty = (value) => {
		if (exec.current) {
			OnStartStopButtonClick();
		}
		setTowCartQty(value);
		updateFileData();
	};

	const handleChangeRidgid = (e) => {
		if (exec.current) {
			OnStartStopButtonClick();
		}
		setCbRigid(e.target.checked);
		updateFileData();
	};

	const formatValue = (value) => {
		return `${value}%`;
	};

	const OnStartStopButtonClick = () => {
		sTime.current = new Date();

		if (!exec.current) {
			intervalId.current = setInterval(simulate, TIME_SPAN / (times / 100));
			exec.current = true;
			setBtnResetDisable(true);
			setSliderSimSpeedDisable(true);
			setBtnStartContent("Pause");
		} else {
			exec.current = false;
			clearInterval(intervalId.current);
			setBtnResetDisable(false);
			setSliderSimSpeedDisable(false);
			setBtnStartContent("Continue");
		}
	};

	const OnResetButtonClick = () => {
		if (!exec.current) {
			console.log('🔵OnReset',);
			resetSimulateParam();
			initDraw();
			updateFileData();
			OperationToDriveParam(AUTOSTART);
			setBtnStartDisable(false);
		}
	};

	const handleTrace = (e) => {
		cbTrace.current = e.target.checked;
		setSliderTraceIntervalDisable(e.target.checked ? false : true);
	};

	const handleVisVehicle = () => {
		cbVisVehicle.current = !cbVisVehicle.current;
		if (!exec.current) drawAllCarts(); //全カート描画
	};

	const handleScroll = () => {
		cbScroll.current = !cbScroll.current;
	};

	const cancelOperation = () => {
		if (IsMarkLayoutMode.current && !IsMarkReLayoutMode.current) {
			// 新規配置のとき
			keyPressEsc.current = true;
			handleClickOpePointer();
		}
		if (IsMarkReLayoutMode.current) {
			// 修正のとき
			keyPressEsc.current = true;
			LandMarkLayout.current[MarkSelectingId.current].Fix = true;
			drawCourse(); // コース再描画
			IsMarkLayoutMode.current = false;
			IsMarkReLayoutMode.current = false;
		}
		if (IsCourseLayoutMode.current || IsCourseReLayoutMode.current) {
			keyPressEsc.current = true;
			handleClickCourseLayout();
		}
		if (IsCartMovingMode.current) {
			CVehicle.current.Calc(prevCartPos.current, prevCartDeg.current, scale.current, offset.current);
			IsCartMovingMode.current = false;
			IsCartSelecting.current = false;
		}
	}

	const onKeyDown = (e) => {
		console.log('🔵KeyDown');
		if (e.shiftKey) {
			document.body.style.cursor = "move";
		}

		if (e.keyCode == 27) {
			// ESC key
			cancelOperation();
		}

		if (e.keyCode == 46) {
			// DELETE key
			if (IsMarkReLayoutMode.current) {
				// 修正のとき
				LandMarkLayout.current.splice(MarkSelectingId.current, 1);
				drawCourse(); // コース再描画
				IsMarkLayoutMode.current = false;
				IsMarkReLayoutMode.current = false;
			}
			if (IsCourseReLayoutMode.current) {
				if (CoursePosiesSelectingId.current >= 0) {
					// 点が選択されているときは点だけを削除
					let pos = CourseLayout.current[CourseSelectingId.current].Position;
					if (pos.length > 2) {
						//残点が2個より多い場合は点を削除
						CourseLayout.current[CourseSelectingId.current].Position.splice(CoursePosiesSelectingId.current, 1);
					} else {
						//残点が2個以下の場合は全部削除
						CourseLayout.current.splice(CourseSelectingId.current, 1);
					}
				}
				DrawCourse(); // コース再描画
				IsCourseLayoutMode.current = false;
				IsCourseReLayoutMode.current = false;
			}
		}

		updateFileData();
	}

	const onKeyUp = (e) => {
		console.log('🔵KeyUp');
		if (!e.shiftKey) {
			if (IsMarkLayoutMode.current || IsCourseLayoutMode.current) {
				document.body.style.cursor = "pointer";
			} else {
				document.body.style.cursor = "auto";
			}
		}

		if (e.keyCode == 27) {
			keyPressEsc.current = false;
		}

		// updateCourseTextData();
	}


	const handleMouseDown = (e) => {
		console.log('🔵MouseDown');
		// The left button was pressed
		if (e.button == 0) {
			const rect = canvasCart.current.canvas.getBoundingClientRect();
			onCanvasPos.current = new Point(e.clientX - rect.x, e.clientY - rect.y);
			const mspos = ClientToWorldPosition(
				onCanvasPos.current,
				scale.current,
				offset.current
			);

			// 二点間距離測定
			if (
				e.altKey &&
				!IsMarkLayoutMode.current &&
				!IsCourseLayoutMode.current
			) {
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
					canvasCourse.current.ctx.clearRect(
						0,
						0,
						canvasCart.current.width,
						canvasCart.current.height
					);
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
				LandMarkLayout.current[MarkSelectingId.current].Fix = true;
				LandMarkLayout.current[MarkSelectingId.current].Position = markPos.current;
				LandMarkLayout.current[MarkSelectingId.current].Angle = markAngle.current;
				handleClickOpePointer();
				IsMarkReLayoutMode.current = false;
			}

			if (
				IsCourseLayoutMode.current && !IsCourseReLayoutMode.current && !e.shiftKey) {
				let i = coursePosies.current.length - 1;
				coursePosies.current[i] = coursePos.current;
				coursePosies.current.push(coursePos.current);
				CourseLayout.current[CourseSelectingId.current].Position = coursePosies.current;
				CoursePosiesSelectingId.current = i + 1;
				msdownWS.current = 1;
			}

			if (IsCourseReLayoutMode.current && !e.shiftKey) {
				if (CoursePosiesSelectingId.current >= 0) {
					coursePosies.current[CoursePosiesSelectingId.current] = coursePos.current;
					coursePosies.current[CoursePosiesSelectingId.current];
					CourseLayout.current[CourseSelectingId.current].Position = coursePosies.current;
					CourseLayout.current[CourseSelectingId.current].Fix = true;
					IsCourseReLayoutMode.current = false;
					handleClickCourseLayout();
				}
			}

			if (CourseElementSelectingId.current >= 0) {
				//未実装
			}

			if (IsCartMovingMode.current && !e.shiftKey) {
				IsCartMovingMode.current = false;
				IsCartSelecting.current = false;
				drawAllCarts();
			}

			drawCourse();
			updateFileData();
		}
	};

	const handleMouseUp = (e) => {
		console.log('🔵MouseUp');
		msdown.current = false;
		prevMousePoint.current = offset.current;

		// The left button was pressed
		if (e.button == 0) {
			if (!IsMarkLayoutMode.current && IsMarkSelecting.current && !e.shiftKey) {
				let mspos = ClientToWorldPosition(onCanvasPos.current, scale.current, offset.current);
				markPos.current = new Point(Math.round(mspos.x / 100) * 100, Math.round(mspos.y / 100) * 100);
				markAngle.current = LandMarkLayout.current[MarkSelectingId.current].Angle;
				LandMarkLayout.current[MarkSelectingId.current].Fix = false;
				IsMarkLayoutMode.current = true;
				IsMarkSelecting.current = false;
				IsMarkReLayoutMode.current = true;

				drawCourse(); // コース再描画
			}

			if (!IsCourseLayoutMode.current && IsCourseSelecting.current && !e.shiftKey) {
				let mspos = ClientToWorldPosition(onCanvasPos.current, scale.current, offset.current);
				coursePos.current = new Point(Math.round(mspos.x / 100) * 100, Math.round(mspos.y / 100) * 100);
				CourseLayout.current[CourseSelectingId.current].Fix = false;
				IsCourseLayoutMode.current = true;
				IsCourseSelecting.current = false;
				IsCourseReLayoutMode.current = true;

				coursePosies.current = CourseLayout.current[CourseSelectingId.current].Position;
				prevCoursePosies.current = coursePosies.current.concat(); //　修正前の点位置情報を保存
				coursePosies.current[CoursePosiesSelectingId.current] = coursePos.current;

				drawCourse(); // コース再描画
			}

			if (!IsCartMovingMode.current && IsCartSelecting.current && !e.shiftKey) {
				const mspos = ClientToWorldPosition(
					onCanvasPos.current,
					scale.current,
					offset.current
				);
				cartPos.current = new Point(
					Math.round(mspos.x / 100) * 100,
					Math.round(mspos.y / 100) * 100
				);
				prevCartPos.current = CVehicle.current.Position;
				prevCartDeg.current = CVehicle.current.Degree;
				cartPos.current = CVehicle.current.Position;
				cartDegree.current = CVehicle.current.Degree;
				IsCartMovingMode.current = true;
				IsCartSelecting.current = true;

				drawAllCarts();
			}
		}
		updateFileData();
	};

	const handleMouseMove = (e) => {
		console.log('🔵MouseMove');
		const rect = canvasCart.current.canvas.getBoundingClientRect();
		onCanvasPos.current = new Point(e.clientX - rect.x, e.clientY - rect.y);
		const mspos = ClientToWorldPosition(
			onCanvasPos.current,
			scale.current,
			offset.current
		);

		if (e.shiftKey) {
			if (!cbTrace.current && !cbScroll.current) {
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
			if (e.altKey) {
				// markPos = mspos;
				markPos.current = new Point(Math.round(mspos.x / 50) * 50, Math.round(mspos.y / 50) * 50); // 最小間隔 5cm
			} else {
				markPos.current = new Point(Math.round(mspos.x / 100) * 100, Math.round(mspos.y / 100) * 100); // 最小間隔 10cm
			}

			canvasCourse.current.ctx.font = "12pt Arial";
			canvasCourse.current.ctx.fillStyle = "rgb(96,96,128)";
			canvasCourse.current.ctx.fillText(
				"(" + (markPos.current.x / 1000).toFixed(2) + "m, " +
				(markPos.current.y / 1000).toFixed(2) + "m) " +
				markAngle.current + "°",
				e.clientX + 5 - canvasCart.current.canvas.offsetLeft,
				e.clientY + 30
			);
		}
		if (!IsMarkLayoutMode.current && !e.shiftKey && !IsCourseLayoutMode.current) {
			IsMarkSelecting.current = false;
			MarkSelectingId.current = -1;
			let i = 0;
			LandMarkLayout.current.forEach((element) => {
				if (element.Selecting(canvasCourse.current.ctx, mspos, scale.current, offset.current)) {
					IsMarkSelecting.current = true;
					MarkSelectingId.current = i;
				}
				i++;
			});
		}
		if (IsCourseLayoutMode.current && !keyPressEsc.current) {
			if (e.altKey) {
				// coursePos = mspos;
				coursePos.current = new Point(Math.round(mspos.x / 50) * 50 - 100, Math.round(mspos.y / 50) * 50 - 100); // 最小間隔 5cm
			} else {
				coursePos.current = new Point(Math.round(mspos.x / 200) * 200 - 100, Math.round(mspos.y / 200) * 200 - 100); // 最小間隔 20cm
			}
			coursePosies.current[CoursePosiesSelectingId.current] = coursePos.current;

			canvasCourse.current.ctx.save();
			canvasCourse.current.ctx.lineWidth = 1;
			canvasCourse.current.ctx.strokeStyle = "rgb(0,0,0)";
			canvasCourse.current.ctx.setLineDash([2, 2]);
			canvasCourse.current.ctx.beginPath();
			canvasCourse.current.ctx.arc(
				WorldToClientPositionX(coursePos.current.x, scale.current, offset.current),
				WorldToClientPositionY(coursePos.current.y, scale.current, offset.current),
				WorldToClientScale(100, scale.current, offset.current),
				0,
				2 * Math.PI,
				true
			);
			canvasCourse.current.ctx.stroke();
			canvasCourse.current.ctx.restore();

			canvasCourse.current.ctx.font = "12pt Arial";
			canvasCourse.current.ctx.fillStyle = "rgb(96,96,128)";
			canvasCourse.current.ctx.fillText(
				"(" + (coursePos.current.x / 1000).toFixed(2) + "m, " + (coursePos.current.y / 1000).toFixed(2) + "m)",
				e.clientX + 5 - canvasCart.current.offsetLeft,
				e.clientY + 30
			);
		}
		if (!IsCourseLayoutMode.current && !e.shiftKey && !IsMarkLayoutMode.current) {
			IsCourseSelecting.current = false;
			CourseSelectingId.current = -1;
			CoursePosiesSelectingId.current = -1;
			CourseElementSelectingId.current = -1;
			let i = 0;
			CourseLayout.current.forEach((element) => {
				let res = element.Selecting(canvasCourse.current.ctx, mspos, scale.current, offset.current);
				if (res.ResultP) {
					IsCourseSelecting.current = true;
					CourseSelectingId.current = i;
					CoursePosiesSelectingId.current = res.SelectedId;
				}
				if (res.ResultE) {
					//未実装
					//IsCourseSelecting = true;
					//CourseSelectingId = i;
					//CourseElementSelectingId = res.SelectedId;
				}
				i++;
			});
		}

		if (!IsCartMovingMode.current && !e.shiftKey && !IsCourseLayoutMode.current && !IsMarkLayoutMode.current) {
			IsCartSelecting.current = false;
			CartSelectingId.current = -1;
			if (CVehicle.current.Selecting(canvasCart.current.ctx, mspos, scale.current, offset.current)) {
				CartSelectingId.current = CVehicle.current.Id;
				IsCartSelecting.current = true;
			}
		}

		if (IsCartMovingMode.current && !e.shiftKey) {
			if (e.altKey) {
				cartPos.current = mspos;
			} else {
				cartPos.current = new Point(
					Math.round(mspos.x / 100) * 100,
					Math.round(mspos.y / 100) * 100
				);
			}
			// Cart位置再計算
			CartPosition(cartPos.current, cartDegree.current);
			VehicleStartPosition.current = cartPos.current;
			VehicleStartDegree.current = cartDegree.current;
		}

		if (e.shiftKey) {
			if (msdown.current && cbTrace.current) {
				canvasCourse.current.ctx.font = "12pt Arial";
				canvasCourse.current.ctx.fillStyle = "rgb(96,96,128)";
				canvasCourse.current.ctx.fillText(
					"軌跡表示中は画面移動できません。",
					e.clientX + 10 - canvasCart.current.canvas.offsetLeft,
					e.clientY + 30 - canvasCourse.current.canvas.offsetTop
				);
			}
			if (msdown.current && cbScroll.current) {
				canvasCourse.current.ctx.font = "12pt Arial";
				canvasCourse.current.ctx.fillStyle = "rgb(96,96,128)";
				canvasCourse.current.ctx.fillText(
					"スクロール中は画面移動できません。",
					e.clientX + 10 - canvasCart.current.canvas.offsetLeft,
					e.clientY + 30 - canvasCourse.current.canvas.offsetTop
				);
			}
		}
		if (e.altKey) {
			canvasCourse.current.ctx.font = "12pt Arial";
			canvasCourse.current.ctx.fillStyle = "rgb(96,96,128)";
			canvasCourse.current.ctx.fillText(
				"(" + mspos.x.toFixed(0) + "," + mspos.y.toFixed(0) + ")",
				e.clientX + 10 - canvasCourse.current.canvas.offsetLeft,
				e.clientY + 30 - canvasCourse.current.canvas.offsetTop
			);
			// マウスの位置が右側、下側になったとき、表示文字がクライアント域からはみ出さないよう調整したほうが良い
		}

		if (e.altKey && measuring.current) {
			if (msdownL.current) {
				canvasCourse.current.ctx.beginPath();
				canvasCourse.current.ctx.moveTo(msDownSL.current.x, msDownSL.current.y);
				canvasCourse.current.ctx.lineTo(
					onCanvasPos.current.x,
					onCanvasPos.current.y
				);
				canvasCourse.current.ctx.strokeStyle = "rgb(96,96,255)";
				canvasCourse.current.ctx.lineWidth = "1";
				canvasCourse.current.ctx.stroke();
			}
		} else {
			msdownL.current = false;
			measuring.current = false;
		}

		updateFileData();
	};

	const handleMouseWheel = (e) => {
		// e.preventDefault();
		// 次のエラーが出るため、回避策を要検討
		// Unable to preventDefault inside passive event listener invocation.
		console.log('🔵MouseWheel');

		let rect = canvasCart.current.canvas.getBoundingClientRect();
		onCanvasPos.current = new Point(e.clientX - rect.x, e.clientY - rect.y);
		let mspos = ClientToWorldPosition(onCanvasPos.current, scale.current, offset.current);

		let nscale = 1.0;
		let scl = Number(scale.current);

		if (e.shiftKey) {
			if (!cbTrace.current) {
				if (e.deltaY > 0) {
					nscale = 0.95;
				} else {
					nscale = 1.05;
				}
				scl *= nscale;

				let flimit = false;
				if (scl < 0.005) flimit = true;
				if (scl > 1.0) flimit = true;

				if (!flimit) {
					scale.current = scl;
					let tx = (onCanvasPos.current.x + offset.current.x) * (nscale - 1.0);
					let ty = (onCanvasPos.current.y + offset.current.y) * (nscale - 1.0);
					offset.current.x += tx;
					offset.current.y += ty;
				}
				prevMousePoint.current = offset.current;
			}
		}
		//グリッド再描画
		drawGrid();
		if (!exec.current) {
			//全オブジェクト描画
			drawAllCarts();
		}
		// 壁描画
		drawCourse();

		if (IsMarkLayoutMode.current && !keyPressEsc.current) {
			if (!e.shiftKey) {
				let da = 0;
				if (e.altKey) {
					da = 1;
				} else {
					da = 15;
				}
				if (e.deltaY > 0) {
					markAngle.current += da;
				} else {
					markAngle.current -= da;
				}
				if (0 > markAngle.current) markAngle.current += 360;
				if (markAngle.current >= 360) markAngle.current -= 360;
			}
			markPos.current = new Point(Math.round(mspos.x / 100) * 100, Math.round(mspos.y / 100) * 100);
			// 壁描画
			drawCourse();

			canvasCourse.current.ctx.font = "12pt Arial";
			canvasCourse.current.ctx.fillStyle = "rgb(96,96,128)";
			canvasCourse.current.ctx.fillText(
				"(" + (mspos.x / 1000).toFixed(1) + "m, " +
				(mspos.y / 1000).toFixed(1) + "m) " +
				markAngle.current + "°",
				e.clientX + 5 - canvasCart.current.canvas.offsetLeft,
				e.clientY + 30
			);
		}
		if (IsCartMovingMode.current && !keyPressEsc.current) {
			if (!e.shiftKey) {
				let da = 0;
				if (e.altKey) {
					da = 1;
				} else {
					da = 15;
				}
				if (e.deltaY > 0) {
					cartDegree.current += da;
				} else {
					cartDegree.current -= da;
				}
				if (0 > cartDegree.current) cartDegree.current += 360;
				if (cartDegree.current >= 360) cartDegree.current -= 360;

				// Cart位置再計算
				CartPosition(cartPos.current, cartDegree.current);
				VehicleStartPosition.current = cartPos.current;
				VehicleStartDegree.current = cartDegree.current;

				drawAllCarts();
			}
		}

		if (e.shiftKey) {
			if (cbTrace.current) {
				canvasCourse.current.ctx.font = "12pt Arial";
				canvasCourse.current.ctx.fillStyle = "rgb(96,96,128)";
				canvasCourse.current.ctx.fillText("軌跡表示中は画面拡縮できません。",
					e.clientX + 5 - canvasCart.current.offsetLeft, e.clientY + 30);
			}
		}

		updateFileData();
	};

	const handleDebug = (e) => {
		console.log('e🔵 ', e);

	}

	const handleLayoutChange = (newLayoutJsonText) => {
		console.log('🔵handleLayoutChange');
		const newLayout = JSON.parse(newLayoutJsonText);
		console.log('newLayout🔵 ', newLayout);

		VehicleStartPosition.current.x = newLayout.Vehicle.StartPositionX;
		VehicleStartPosition.current.y = newLayout.Vehicle.StartPositionY;
		VehicleStartDegree.current = newLayout.Vehicle.StartDegree;

		ImageVehicle.src = newLayout.Vehicle.Type;
		const newVehicleProp = newLayout.Vehicle.size;
		setVehicleProp(newVehicleProp);

		setCbRigid(newLayout.RigidCart.connect);
		const newRigidCartProp = newLayout.RigidCart.size;
		setRigidCartProp(newRigidCartProp);

		setCbTowCart(newLayout.TowCart.connect);
		setTowCartQty(newLayout.TowCart.qty);
		const newTowCartProp = newLayout.TowCart.size;
		setTowCartProp(newTowCartProp);

		LandMarkLayout.current = [];
		newLayout.LandmarkLayout.map((e) => {
			LandMarkLayout.current.push(
				new CLandMark(
					e.type,
					new Point(e.position.x, e.position.y),
					e.angle,
					e.fix
				));
		});

		CourseLayout.current = [];
		newLayout.CourseLayout.map((e) => {
			CourseLayout.current.push(
				new CCourse(
					e.type,
					e.position.map((p) => new Point(p.x, p.y)),
					e.fix
				)
			)
		});
	}

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
				<Flex>
					<h3>Autonomous Robot Simulator</h3>
					<h4>{loginId}</h4>
					<Button onClick={signOut}>Sign Out</Button>
				</Flex>
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
										<Button
											width={100}
											onClick={OnStartStopButtonClick}
											isDisabled={btnStartDisable}
										>
											{btnStartContent}
										</Button>
										<Button
											width={100}
											onClick={OnResetButtonClick}
											isDisabled={btnResetDisable}
										>
											Reset
										</Button>
									</Flex>
									<CheckboxField
										label="Show trace line"
										name="cb_trace"
										defaultChecked={cbTrace.current}
										onChange={(e) => handleTrace(e)}
									/>
									<SliderField
										label="Trace interval steps"
										min={30}
										max={500}
										value={rangeStep}
										onChange={setRangeStep}
										isDisabled={sliderTraceIntervalDisable}
									/>
									<CheckboxField
										label="Vehicle shows screen center"
										name="cb_scroll"
										defaultChecked={cbScroll.current}
										onChange={handleScroll}
									/>
									<SliderField
										label="Simulate speed"
										min={50}
										max={300}
										value={times}
										onChange={setTimes}
										formatValue={formatValue}
										isDisabled={sliderSimSpeedDisable}
									/>
									<Table
										caption="Simulate status"
										highlightOnHover={true}
										size="small"
									>
										<TableBody>
											<TableRow>
												<TableCell width={"200px"}>
													Driving Time [sec]
												</TableCell>
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
												<TableCell>Speed [m/s]</TableCell>
												<TableCell id="speed" colSpan={2}>
													0.0
												</TableCell>
											</TableRow>
										</TableBody>
									</Table>
									<label>
										MQTT Receive Command
										<TextAreaField
											name="postContent"
											rows={1}
											cols={40}
											value={operate}
										/>
									</label>
									<Button isFullWidth onClick={(e) => handleDebug(e)}>
										Debug
									</Button>
								</Flex>
							),
						},
						{
							label: "Vehicle",
							value: "2",
							content: (
								<>
									<Fieldset
										legend="機体仕様"
										direction="column"
										marginBottom={20}
									>
										<CheckboxField
											label="機体を外観図で表示"
											name="cb_vis_vehicle"
											defaultChecked={cbVisVehicle.current}
											onChange={handleVisVehicle}
										/>
										<Flex direction="row" gap="small">
											<Flex direction="column" gap="small">
												<TextField
													{...Styles.inputNumber}
													descriptiveText="Wt"
													name="width"
													value={vehicleProp.width}
													onInput={(e) => handleInputVehiclePropNum(e)}
												></TextField>
											</Flex>
											<Flex direction="column" gap="small">
												<TextField
													{...Styles.inputNumber}
													descriptiveText="Lt"
													name="length"
													value={vehicleProp.length}
													onInput={(e) => handleInputVehiclePropNum(e)}
												></TextField>
											</Flex>
											<Flex direction="column" gap="small">
												<TextField
													{...Styles.inputNumber}
													descriptiveText="Td"
													name="tread"
													value={vehicleProp.tread}
													onInput={(e) => handleInputVehiclePropNum(e)}
												></TextField>
											</Flex>
											<Flex direction="column" gap="small">
												<TextField
													{...Styles.inputNumber}
													descriptiveText="Re"
													name="rearend"
													value={vehicleProp.rearend}
													onInput={(e) => handleInputVehiclePropNum(e)}
												></TextField>
											</Flex>
										</Flex>
										<Flex direction="row" gap="small">
											<Flex direction="column" gap="small">
												<TextField
													{...Styles.inputNumber}
													descriptiveText="Tw"
													name="towpos"
													value={vehicleProp.towpos.x}
													onInput={(e) => handleInputVehiclePropPoint(e)}
												></TextField>
											</Flex>
											<Flex direction="column" gap="small">
												<TextField
													{...Styles.inputNumber}
													descriptiveText="Lk"
													name="linkpos"
													value={vehicleProp.linkpos.x}
													onInput={(e) => handleInputVehiclePropPoint(e)}
												></TextField>
											</Flex>
											<Flex direction="column" gap="small">
												<TextField
													{...Styles.inputNumber}
													descriptiveText="Cm"
													name="camerapos"
													value={vehicleProp.camerapos.x}
													onInput={(e) => handleInputVehiclePropPoint(e)}
												></TextField>
											</Flex>
										</Flex>
										<Image
											objectFit="none"
											height={"220px"}
											src="./vehicle_size.png"
										></Image>
									</Fieldset>
									<Button isFullWidth onClick={() => setTab("1")}>
										Back to Simulate tab
									</Button>
								</>
							),
						},
						{
							label: "Dolley",
							value: "3",
							content: (
								<>
									<Fieldset
										legend="潜り込み台車仕様"
										direction="column"
										marginBottom={20}
									>
										<CheckboxField
											label="Rigidly connect the carts"
											name="cb_ridgid"
											checked={cbRigidCart}
											onChange={(e) => handleChangeRidgid(e)}
										/>
										<Flex direction="row" gap="small">
											<Flex direction="column" gap="small">
												<TextField
													{...Styles.inputNumber}
													descriptiveText="Wt"
													name="width"
													value={rigidCartProp.width}
													onInput={(e) => handleInputRigidCartPropNum(e)}
												></TextField>
											</Flex>
											<Flex direction="column" gap="small">
												<TextField
													{...Styles.inputNumber}
													descriptiveText="Lt"
													name="length"
													value={rigidCartProp.length}
													onInput={(e) => handleInputRigidCartPropNum(e)}
												></TextField>
											</Flex>
											<Flex direction="column" gap="small">
												<TextField
													{...Styles.inputNumber}
													descriptiveText="Tw"
													name="towpos"
													value={rigidCartProp.towpos.x}
													onInput={(e) => handleInputRigidCartPropPoint(e)}
												></TextField>
											</Flex>
											<Flex direction="column" gap="small">
												<TextField
													{...Styles.inputNumber}
													descriptiveText="Re"
													name="rearend"
													value={rigidCartProp.rearend}
													onInput={(e) => handleInputRigidCartPropNum(e)}
												></TextField>
											</Flex>
										</Flex>
										<Image
											objectFit="none"
											height={"220px"}
											src="./RigidCartSize.png"
										></Image>
									</Fieldset>
									<Fieldset
										legend="牽引台車仕様"
										direction="column"
										marginBottom={20}
									>
										<Flex direction="row" gap="small">
											<CheckboxField
												label="Connect Towing dolley"
												name="cb_tow"
												checked={cbTowCart}
												onChange={(e) => handleChangeTow(e)}
											/>
											<StepperField
												marginLeft={25}
												width={"150px"}
												max={5}
												min={1}
												step={1}
												size="small"
												onStepChange={(value) => handleCangeTowCartQty(value)}
											/>
										</Flex>
										<Flex direction="row" gap="small">
											<Flex direction="column" gap="small">
												<TextField
													{...Styles.inputNumber}
													descriptiveText="Wt"
													name="width"
													value={towCartProp.width}
													onInput={(e) => handleInputTowCartPropNum(e)}
												></TextField>
											</Flex>
											<Flex direction="column" gap="small">
												<TextField
													{...Styles.inputNumber}
													descriptiveText="Lt"
													name="length"
													value={towCartProp.length}
													onInput={(e) => handleInputTowCartPropNum(e)}
												></TextField>
											</Flex>
											<Flex direction="column" gap="small">
												<TextField
													{...Styles.inputNumber}
													descriptiveText="Tw"
													name="towpos"
													value={towCartProp.towpos.x}
													onInput={(e) => handleInputTowCartPropPoint(e)}
												></TextField>
											</Flex>
											<Flex direction="column" gap="small">
												<TextField
													{...Styles.inputNumber}
													descriptiveText="Re"
													name="rearend"
													value={towCartProp.rearend}
													onInput={(e) => handleInputTowCartPropNum(e)}
												></TextField>
											</Flex>
											<Flex direction="column" gap="small">
												<TextField
													{...Styles.inputNumber}
													descriptiveText="Td"
													name="tread"
													value={towCartProp.tread}
													onInput={(e) => handleInputTowCartPropNum(e)}
												></TextField>
											</Flex>
											<Flex direction="column" gap="small">
												<TextField
													{...Styles.inputNumber}
													descriptiveText="Dp"
													name="drivingpos"
													value={towCartProp.drivingpos.x}
													onInput={(e) => handleInputTowCartPropPoint(e)}
												></TextField>
											</Flex>
										</Flex>
										<Image
											objectFit="none"
											height={"220px"}
											src="./TowCartSize.png"
										></Image>
									</Fieldset>

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
									<Fieldset
										legend="Layout operation pointer"
										direction="column"
										marginBottom={20}
									>
										<Flex direction="row" gap="small">
											<ToggleButtonGroup
												size="small"
												value={exclusiveMarkValue}
												isExclusive
												onChange={(e) => handleClickOpePointer(e)}
											>
												<ToggleButton value="Forward1">
													<Image src="./F1.png" />
												</ToggleButton>
												<ToggleButton value="Forward2">
													<Image src="./F2.png" />
												</ToggleButton>
												<ToggleButton value="Forward3">
													<Image src="./F3.png" />
												</ToggleButton>
												<ToggleButton value="Curve_Left">
													<Image src="./CL.png" />
												</ToggleButton>
												<ToggleButton value="Curve_Right">
													<Image src="./CR.png" />
												</ToggleButton>
											</ToggleButtonGroup>
										</Flex>
									</Fieldset>
									<Fieldset
										legend="Layout Course"
										direction="column"
										marginBottom={20}
									>
										<Flex direction="row" gap="small">
											<ToggleButtonGroup
												size="small"
												value={exclusiveCourseValue}
												isExclusive
												onChange={(e) => handleClickCourseLayout(e)}
											>
												<ToggleButton value="wall">
													Wall
												</ToggleButton>
												<ToggleButton value="box">
													Box
												</ToggleButton>
												<ToggleButton value="line">
													Line
												</ToggleButton>
											</ToggleButtonGroup>
										</Flex>
									</Fieldset>
									<Button isFullWidth onClick={() => setTab("1")}>
										Back to Simulate tab
									</Button>
								</>
							),
						},
						{
							label: "File",
							value: "5",
							content: (
								<>
									<DataFile
										layoutData={layoutData.current}
										canvas={canvasAll.current}
										onLayoutChange={handleLayoutChange}
									/>
									<Button isFullWidth onClick={() => setTab("1")}>
										Back to Simulate tab
									</Button>
								</>
							),
						},
					]}
				/>
			</Card>
			<Card
				id="canvasAreaCard"
				columnStart="2"
				columnEnd="-1"
				style={Styles.divBlock}
				margin="0"
				padding="0"
			>
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
