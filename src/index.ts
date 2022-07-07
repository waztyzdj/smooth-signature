// 配置信息
interface IOptions {
  // 画布在页面实际渲染的宽度(px)
  width?: number;
  // 画布在页面实际渲染的高度(px)
  height?: number;
  // 画笔颜色
  color?: string;
  // 画布背景颜色，默认透明
  bgColor?: string;
  // 画布缩放，可用于提高清晰度
  scale?: number;
  // 是否开启笔锋效果，默认开启
  openSmooth?: boolean;
  // 画笔最小宽度(px)，开启笔锋时画笔最小宽度
  minWidth?: number;
  // 画笔最大宽度(px)，开启笔锋时画笔最大宽度，或未开启笔锋时画笔正常宽度
  maxWidth?: number;
  // 画笔达到最小宽度所需最小速度(px/ms)，取值范围1.0-10.0，值越小，画笔越容易变细，笔锋效果会比较明显，可以自行调整查看效果，选出自己满意的值。
  minSpeed?: number;
  // 相邻两线宽度增(减)量最大百分比，取值范围1-100，为了达到笔锋效果，画笔宽度会随画笔速度而改变，如果相邻两线宽度差太大，过渡效果就会很突兀，使用maxWidthDiffRate限制宽度差，让过渡效果更自然。可以自行调整查看效果，选出自己满意的值。
  maxWidthDiffRate?: number;
  // 橡皮像素范围，开启橡皮时，点击笔画会返回点击时的像素点的位置，该像素点可能不在笔画上，增加这个范围，使点击时不用那么精确，也能正常擦除笔画
  eraserRange?: number;
  // 绘画开始回调函数
  onStart?: (event: any) => void;
  // 绘画结束回调函数
  onEnd?: (event: any) => void;
  // 擦除开始回调函数
  onEraserStart?: (event: any) => void;
  // 擦除结束回调函数
  onEraserEnd?: (event: any) => void;
}

// 点接口
interface IPoint {
  // x坐标
  x: number;
  // y坐标
  y: number;
  // 时间
  t: number;
  // 速度
  speed?: number;
  // 距离
  distance?: number;
  // 线宽
  lineWidth?: number;
}

interface IRadianData {
  val: number;
  pos: -1 | 1;
}

// 操作历史记录
interface IDoTypeHistory {
  // 操作类型：1为画笔，0为橡皮
  doType: number;
  // 笔画
  strokes: IStrokes;
}

// 笔画
interface IStrokes {
  // 笔画顺序
  orderNo: number;
  // 该笔画经过所有点的集合
  pointsStrokes: IPoint[];
  // 是否显示，橡皮擦除后不显示
  isShow: boolean;
  // 该笔画的颜色
  color: string;
}

class SmoothSignature {
  constructor(canvas: HTMLCanvasElement, options: IOptions) {
    this.init(canvas, options)
  }
  canvas: HTMLCanvasElement = {} as any;
  ctx: CanvasRenderingContext2D = {} as any;
  // 画布在页面实际渲染的宽度(px)
  width = 320;
  // 画布在页面实际渲染的高度(px)
  height = 200;
  // 画布缩放，可用于提高清晰度
  scale = window.devicePixelRatio || 1;
  // 画笔颜色
  color = 'black';
  // 画布背景颜色，默认透明
  bgColor = '';
  // 是否可以画
  canDraw = false;
  // 是否开启笔锋效果，默认开启
  openSmooth = true;
  // 画笔最小宽度(px)，开启笔锋时画笔最小宽度
  minWidth = 2;
  // 画笔最大宽度(px)，开启笔锋时画笔最大宽度，或未开启笔锋时画笔正常宽度
  maxWidth = 6;
  // 画笔达到最小宽度所需最小速度(px/ms)，取值范围1.0-10.0，值越小，画笔越容易变细，笔锋效果会比较明显，可以自行调整查看效果，选出自己满意的值。
  minSpeed = 1.5;
  // 相邻两线宽度增(减)量最大百分比，取值范围1-100，为了达到笔锋效果，画笔宽度会随画笔速度而改变，如果相邻两线宽度差太大，过渡效果就会很突兀，使用maxWidthDiffRate限制宽度差，让过渡效果更自然。可以自行调整查看效果，选出自己满意的值。
  maxWidthDiffRate = 20;
  // 画笔经过所有点的集合，默认只保存3个点
  points: IPoint[] = [];
  // 橡皮整笔擦除实现的思路为：判断当前擦除的位置上是否存在笔画，存在笔画时，将整笔从列表中移除，然后重画整个页面
  // 笔画点列表，用于保存每个move的点，形成单个笔画，可以整笔擦除
  pointsStrokes: IPoint[] = [];
  // 笔画列表，用于保存历史笔画，可以单笔擦除
  strokesList: IStrokes[] = [];
  // 用于记录操作类型，是新增还是擦除，撤销时用到
  doTypeHistoryList: IDoTypeHistory[] = [];
  // 绘画开始回调函数
  onStart: any = () => { }
  // 绘画结束回调函数
  onEnd: any = () => { }
  // 擦除开始回调函数
  onEraserStart: any = () => { }
  // 擦除结束回调函数
  onEraserEnd: any = () => { }
  // 编辑模式：1为画笔，0为橡皮
  doType = 1;
  // 橡皮像素范围，开启橡皮时，点击笔画会返回点击时的像素点的位置，该像素点可能不在笔画上，增加这个范围，使点击时不用那么精确，也能正常擦除笔画
  eraserRange = 5;
  // 当前笔画顺序号，一直递增
  currOrderNo = 1;

  // 初始化参数
  init(canvas: HTMLCanvasElement, options: IOptions = {}) {
    if (!canvas) return;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.width = options.width || canvas.clientWidth || this.width;
    this.height = options.height || canvas.clientHeight || this.height;
    this.scale = options.scale || this.scale;
    this.color = options.color || this.color;
    this.bgColor = options.bgColor || this.bgColor;
    this.openSmooth = options.openSmooth || this.openSmooth;
    this.minWidth = options.minWidth || this.minWidth;
    this.maxWidth = options.maxWidth || this.maxWidth;
    this.minSpeed = options.minSpeed || this.minSpeed;
    this.maxWidthDiffRate = options.maxWidthDiffRate || this.maxWidthDiffRate;
    this.onStart = options.onStart;
    this.onEnd = options.onEnd;
    this.onEraserStart = options.onEraserStart;
    this.onEraserEnd = options.onEraserEnd;
    this.eraserRange = options.eraserRange || this.eraserRange;
    if (this.scale > 0) {
      this.canvas.height = this.height * this.scale;
      this.canvas.width = this.width * this.scale;
      if (this.scale !== 1) {
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        this.ctx.scale(this.scale, this.scale);
      }
    }
    this.ctx.lineCap = 'round';
    this.drawBgColor();
    this.addListener();
  }
  // 设置操作类型，1为画笔模式，0为橡皮模式
  setDoType = (doType : number) => {
    this.doType = doType;
    this.addListener();
  }

  // 根据设备、操作类型绑定监听事件
  addListener = () => {
    this.removeListener();
    this.canvas.style.touchAction = 'none';
    if(this.doType == 1) {// 画笔模式
      if ('ontouchstart' in window || navigator.maxTouchPoints) {
        this.canvas.addEventListener('touchstart', this.onDrawStart);
        this.canvas.addEventListener('touchmove', this.onDrawMove);
        document.addEventListener('touchcancel', this.onDrawEnd);
        document.addEventListener('touchend', this.onDrawEnd);
      } else {
        this.canvas.addEventListener('mousedown', this.onDrawStart);
        this.canvas.addEventListener('mousemove', this.onDrawMove);
        document.addEventListener('mouseup', this.onDrawEnd);
      }
    } else if(this.doType == 0) {// 橡皮模式
      if ('ontouchstart' in window || navigator.maxTouchPoints) {
        this.canvas.addEventListener('touchstart', this.onEraser);
      } else {
        this.canvas.addEventListener('mousedown', this.onEraser);
      }
    }
  }

  // 移除所有监听事件
  removeListener = () => {
    this.canvas.style.touchAction = 'auto';
    this.canvas.removeEventListener('touchstart', this.onDrawStart);
    this.canvas.removeEventListener('touchmove', this.onDrawMove);
    document.removeEventListener('touchend', this.onDrawEnd);
    document.removeEventListener('touchcancel', this.onDrawEnd);
    this.canvas.removeEventListener('mousedown', this.onDrawStart);
    this.canvas.removeEventListener('mousemove', this.onDrawMove);
    document.removeEventListener('mouseup', this.onDrawEnd);

    this.canvas.removeEventListener('touchstart', this.onEraser);
    this.canvas.removeEventListener('mousedown', this.onEraser);
  }

  // 单笔开始绘画
  onDrawStart = (e: any) => {
    e.preventDefault();
    this.canDraw = true;
    this.ctx.strokeStyle = this.color;
    this.initPoint(e);
    this.onStart && this.onStart(e);
  }

  // 单笔画笔移动
  onDrawMove = (e: any) => {
    e.preventDefault();
    if (!this.canDraw) return;
    this.initPoint(e);
    if (this.points.length < 2) return;
    const point = this.points.slice(-1)[0];
    this.pointsStrokes.push(point);
    const prePoint = this.points.slice(-2, -1)[0];
    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(() => this.onDraw(prePoint, point));
    } else {
      this.onDraw(prePoint, point);
    }
  }

  // 单笔绘画函数
  onDraw = (prePoint: any, point: any, color: string = this.color) => {
    if (this.openSmooth) {
      this.drawSmoothLine(prePoint, point, color);
    } else {
      this.drawNoSmoothLine(prePoint, point, color);
    }
  }

  // 单笔绘画结束
  onDrawEnd = (e: any) => {
    if (!this.canDraw) return;
    this.canDraw = false;
    this.points = [];
    const strokes: IStrokes = { orderNo: this.currOrderNo, pointsStrokes: this.pointsStrokes, isShow: true, color: this.color};
    this.currOrderNo++;
    this.strokesList.push(strokes);
    const doTypeHistory: IDoTypeHistory = { doType: 1, strokes: strokes };
    this.doTypeHistoryList.push(doTypeHistory);
    this.pointsStrokes = [];
    this.onEnd && this.onEnd(e);
  }

  // 橡皮擦除
  onEraser = (e: any) => {
    this.onEraserStart && this.onEraserStart(e);
    e.preventDefault();
    this.canDraw = false;
    // 初始化当前位置：
    this.initPoint(e);
    // 获取当前位置：
    const point = this.points.slice(-1)[0];
    // 判断笔画是否在当前位置，是的话将笔画移除
    const isEraser = this.removeStrokesByPoint(point);
    if(isEraser) {
      this.redrawStrokes();
    }
    
    // 清除points
    this.points = [];
    this.onEraserEnd && this.onEraserEnd(e);
  }

  // 判断笔画是否在当前位置，是的话将笔画移除
  // 一次只擦除一个笔画，后写的先擦
  removeStrokesByPoint(point: IPoint) {
    for(var i = this.strokesList.length - 1; i >=0; i--) {
      const strokes = this.strokesList[i];
      let isEraser = false;
      for(var j = 0; j < strokes.pointsStrokes.length; j++) {
        const tPoint = strokes.pointsStrokes[j];
        // 轨迹中的点在选中范围内的，该笔画擦除
        if(tPoint.x >= (point.x - this.eraserRange) && tPoint.x <= (point.x + this.eraserRange)
            && tPoint.y >= (point.y - this.eraserRange) && tPoint.y <= (point.y + this.eraserRange)) {
          isEraser = true;
          break;
        }
        // 选中的点在轨迹两个点之间的，该笔画擦除
        if(j > 0) {
          const tPrePoint = strokes.pointsStrokes[j - 1];
          if(((point.x > tPrePoint.x && point.x < tPoint.x) || (point.x > tPoint.x && point.x < tPrePoint.x)) 
              && ((point.y > tPrePoint.y && point.y < tPoint.y) || (point.y > tPoint.y && point.y < tPrePoint.y))) {
            isEraser = true;
            break;
          }
        }
      }
      if(isEraser) {
        const doTypeHistory: IDoTypeHistory = { doType: 0, strokes: strokes };
        this.doTypeHistoryList.push(doTypeHistory);
        strokes.isShow = false;
        return true;
      }
    }
    return false;
  }

  // 根据历史列表重画
  redrawStrokes() {
    // 先清屏
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawBgColor();
    this.canDraw = true;

    // 开始重画
    for(var i = 0; i < this.strokesList.length; i++) {
      const strokes = this.strokesList[i];
      if(strokes.isShow == false) {
        continue;
      }

      for(var j = 0; j < strokes.pointsStrokes.length; j++) {
        if(j > 0) {
          const point = strokes.pointsStrokes[j];
          const prePoint = strokes.pointsStrokes[j - 1];
          if (window.requestAnimationFrame) {
            window.requestAnimationFrame(() => this.onDraw(prePoint, point, strokes.color));
          } else {
            this.onDraw(prePoint, point, strokes.color);
          }
        }
      }
    }

    // 重画结束
    this.canDraw = false;
  }

  // ==================================== 绘画算法：开始 ==================================== //
  getLineWidth = (speed: number) => {
    const minSpeed = this.minSpeed > 10 ? 10 : this.minSpeed < 1 ? 1 : this.minSpeed;
    const addWidth = (this.maxWidth - this.minWidth) * speed / minSpeed;
    const lineWidth = Math.max(this.maxWidth - addWidth, this.minWidth);
    return Math.min(lineWidth, this.maxWidth);
  }

  getRadianData = (x1: number, y1: number, x2: number, y2: number): IRadianData => {
    const dis_x = x2 - x1;
    const dis_y = y2 - y1;
    if (dis_x === 0) {
      return { val: 0, pos: -1 }
    }
    if (dis_y === 0) {
      return { val: 0, pos: 1 }
    }
    const val = Math.abs(Math.atan(dis_y / dis_x));
    if (x2 > x1 && y2 < y1 || (x2 < x1 && y2 > y1)) {
      return { val, pos: 1 }
    }
    return { val, pos: -1 }
  }

  getRadianPoints = (radianData: IRadianData, x: number, y: number, halfLineWidth: number) => {
    if (radianData.val === 0) {
      if (radianData.pos === 1) {
        return [
          { x, y: y + halfLineWidth },
          { x, y: y - halfLineWidth }
        ]
      }
      return [
        { y, x: x + halfLineWidth },
        { y, x: x - halfLineWidth }
      ]
    }
    const dis_x = Math.sin(radianData.val) * halfLineWidth;
    const dis_y = Math.cos(radianData.val) * halfLineWidth;
    if (radianData.pos === 1) {
      return [
        { x: x + dis_x, y: y + dis_y },
        { x: x - dis_x, y: y - dis_y }
      ]
    }
    return [
      { x: x + dis_x, y: y - dis_y },
      { x: x - dis_x, y: y + dis_y }
    ]
  }

  initPoint = (event: any) => {
    const t = Date.now();
    const prePoint = this.points.slice(-1)[0];
    if (prePoint && prePoint.t === t) {
      return
    }
    const rect = this.canvas.getBoundingClientRect();
    const e = event.touches && event.touches[0] || event;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (prePoint && prePoint.x === x && prePoint.y === y) {
      return
    }
    const point: IPoint = { x, y, t }
    if (this.openSmooth && prePoint) {
      const prePoint2 = this.points.slice(-2, -1)[0];
      point.distance = Math.sqrt(Math.pow(point.x - prePoint.x, 2) + Math.pow(point.y - prePoint.y, 2));
      point.speed = point.distance / ((point.t - prePoint.t) || 0.1);
      point.lineWidth = this.getLineWidth(point.speed);
      if (prePoint2 && prePoint2.lineWidth && prePoint.lineWidth) {
        const rate = (point.lineWidth - prePoint.lineWidth) / prePoint.lineWidth;
        let maxRate = this.maxWidthDiffRate / 100;
        maxRate = maxRate > 1 ? 1 : maxRate < 0.01 ? 0.01 : maxRate;
        if (Math.abs(rate) > maxRate) {
          const per = rate > 0 ? maxRate : -maxRate;
          point.lineWidth = prePoint.lineWidth * (1 + per);
        }
      }
    }
    this.points.push(point);
    this.points = this.points.slice(-3);
  }

  drawSmoothLine = (prePoint: any, point: any, color: string = this.color) => {
    const dis_x = point.x - prePoint.x;
    const dis_y = point.y - prePoint.y;
    if (Math.abs(dis_x) + Math.abs(dis_y) <= this.scale) {
      point.lastX1 = point.lastX2 = prePoint.x + (dis_x * 0.5);
      point.lastY1 = point.lastY2 = prePoint.y + (dis_y * 0.5);
    } else {
      point.lastX1 = prePoint.x + (dis_x * 0.3);
      point.lastY1 = prePoint.y + (dis_y * 0.3);
      point.lastX2 = prePoint.x + (dis_x * 0.7);
      point.lastY2 = prePoint.y + (dis_y * 0.7);
    }
    point.perLineWidth = (prePoint.lineWidth + point.lineWidth) / 2;
    if (typeof prePoint.lastX1 === 'number') {
      this.drawCurveLine(prePoint.lastX2, prePoint.lastY2, prePoint.x, prePoint.y, point.lastX1, point.lastY1, point.perLineWidth, color);
      if (prePoint.isFirstPoint) return;
      if (prePoint.lastX1 === prePoint.lastX2 && prePoint.lastY1 === prePoint.lastY2) return;
      const data = this.getRadianData(prePoint.lastX1, prePoint.lastY1, prePoint.lastX2, prePoint.lastY2);
      const points1 = this.getRadianPoints(data, prePoint.lastX1, prePoint.lastY1, prePoint.perLineWidth / 2);
      const points2 = this.getRadianPoints(data, prePoint.lastX2, prePoint.lastY2, point.perLineWidth / 2);
      this.drawTrapezoid(points1[0], points2[0], points2[1], points1[1], color);
    } else {
      point.isFirstPoint = true;
    }
  }

  drawNoSmoothLine = (prePoint: any, point: any, color: string = this.color) => {
    point.lastX = prePoint.x + (point.x - prePoint.x) * 0.5;
    point.lastY = prePoint.y + (point.y - prePoint.y) * 0.5;
    if (typeof prePoint.lastX === 'number') {
      this.drawCurveLine(
        prePoint.lastX, prePoint.lastY,
        prePoint.x, prePoint.y,
        point.lastX, point.lastY,
        this.maxWidth, color
      );
    }
  }

  drawCurveLine = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, lineWidth: number, color: string = this.color) => {
    this.ctx.lineWidth = Number(lineWidth.toFixed(1));
    this.ctx.beginPath();
    this.ctx.moveTo(Number(x1.toFixed(1)), Number(y1.toFixed(1)));
    this.ctx.quadraticCurveTo(
      Number(x2.toFixed(1)), Number(y2.toFixed(1)),
      Number(x3.toFixed(1)), Number(y3.toFixed(1))
    );
    this.ctx.strokeStyle = color || this.color;
    this.ctx.stroke();
  }

  drawTrapezoid = (point1: any, point2: any, point3: any, point4: any, color: string = this.color) => {
    this.ctx.beginPath();
    this.ctx.moveTo(Number(point1.x.toFixed(1)), Number(point1.y.toFixed(1)));
    this.ctx.lineTo(Number(point2.x.toFixed(1)), Number(point2.y.toFixed(1)));
    this.ctx.lineTo(Number(point3.x.toFixed(1)), Number(point3.y.toFixed(1)));
    this.ctx.lineTo(Number(point4.x.toFixed(1)), Number(point4.y.toFixed(1)));
    this.ctx.fillStyle = color || this.color;
    this.ctx.fill();
  }
  // ==================================== 绘画算法：结束 ==================================== //

  // 设置背景颜色
  drawBgColor = () => {
    if (!this.bgColor) return;
    this.ctx.fillStyle = this.bgColor;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  // 设置背景图片
  drawByImageUrl = (url: string) => {
    const image = new Image();
    image.onload = () => {
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.ctx.drawImage(image, 0, 0, this.width, this.height);
    }
    image.crossOrigin = 'anonymous';
    image.src = url;
  }

  // 清屏
  clear = () => {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawBgColor();
    // 清屏同时清除痕迹
    this.pointsStrokes = [];
    this.strokesList = [];
    this.doTypeHistoryList = [];
    this.currOrderNo = 1;
    this.setDoType(1);
  }

  // 撤销
  undo = () => {
    // 笔迹列表也要跟着重置
    if(this.doTypeHistoryList.length > 0) {
      const doTypeHistory = this.doTypeHistoryList.pop();
      if(doTypeHistory?.doType == 1) {// 最后操作是写字，去掉最后一笔
        this.strokesList.pop();
        this.currOrderNo--;
      } else if(doTypeHistory?.doType == 0) {// 最后操作是橡皮，重新插入到列表中
        doTypeHistory.strokes.isShow = true;
      }
      this.redrawStrokes();
    }
  }

  // 根据类型获取画布的base64图片
  toDataURL = (type = 'image/png', quality = 1) => {
    if (this.canvas.width === this.width) {
      return this.canvas.toDataURL(type, quality);
    }
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.drawImage(this.canvas, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL(type, quality);
  }

  // 获取PNG图片
  getPNG = () => {
    return this.toDataURL();
  }

  // 获取JPG图片
  getJPG = (quality = 0.8) => {
    return this.toDataURL('image/jpeg', quality);
  }

  // 判断画布是否为空
  isEmpty = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    canvas.width = this.canvas.width;
    canvas.height = this.canvas.height;
    if (this.bgColor) {
      ctx.fillStyle = this.bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (this.scale !== 1) {
      ctx.scale(this.scale, this.scale);
    }
    return canvas.toDataURL() === this.canvas.toDataURL();
  }

  // 旋转画布
  getRotateCanvas = (degree = 90) => {
    if (degree > 0) {
      degree = degree > 90 ? 180 : 90;
    } else {
      degree = degree < -90 ? 180 : -90;
    }
    const canvas = document.createElement('canvas');
    const w = this.width;
    const h = this.height;
    if (degree === 180) {
      canvas.width = w;
      canvas.height = h;
    } else {
      canvas.width = h;
      canvas.height = w;
    }
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.rotate(degree * Math.PI / 180);
    if (degree === 90) { // 顺时针90度
      ctx.drawImage(this.canvas, 0, -h, w, h);
    } else if (degree === -90) { // 逆时针90度
      ctx.drawImage(this.canvas, -w, 0, w, h);
    } else if (degree === 180) {
      ctx.drawImage(this.canvas, -w, -h, w, h);
    }
    return canvas;
  }
}

export default SmoothSignature;