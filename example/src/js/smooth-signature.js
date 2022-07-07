(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.SmoothSignature = factory());
}(this, (function () { 'use strict';

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }

  var SmoothSignature = /*#__PURE__*/function () {
    function SmoothSignature(_canvas, options) {
      var _this = this;

      _classCallCheck(this, SmoothSignature);

      this.canvas = {};
      this.ctx = {};
      this.width = 320;
      this.height = 200;
      this.scale = window.devicePixelRatio || 1;
      this.color = 'black';
      this.bgColor = '';
      this.canDraw = false;
      this.openSmooth = true;
      this.minWidth = 2;
      this.maxWidth = 6;
      this.minSpeed = 1.5;
      this.maxWidthDiffRate = 20;
      this.points = [];
      this.pointsStrokes = [];
      this.strokesList = [];
      this.doTypeHistoryList = [];

      this.onStart = function () {};

      this.onEnd = function () {};

      this.onEraserStart = function () {};

      this.onEraserEnd = function () {};

      this.doType = 1;
      this.eraserRange = 5;
      this.currOrderNo = 1;

      this.setDoType = function (doType) {
        _this.doType = doType;

        _this.addListener();
      };

      this.addListener = function () {
        _this.removeListener();

        _this.canvas.style.touchAction = 'none';

        if (_this.doType == 1) {
          // 画笔模式
          if ('ontouchstart' in window || navigator.maxTouchPoints) {
            _this.canvas.addEventListener('touchstart', _this.onDrawStart);

            _this.canvas.addEventListener('touchmove', _this.onDrawMove);

            document.addEventListener('touchcancel', _this.onDrawEnd);
            document.addEventListener('touchend', _this.onDrawEnd);
          } else {
            _this.canvas.addEventListener('mousedown', _this.onDrawStart);

            _this.canvas.addEventListener('mousemove', _this.onDrawMove);

            document.addEventListener('mouseup', _this.onDrawEnd);
          }
        } else if (_this.doType == 0) {
          // 橡皮模式
          if ('ontouchstart' in window || navigator.maxTouchPoints) {
            _this.canvas.addEventListener('touchstart', _this.onEraser);
          } else {
            _this.canvas.addEventListener('mousedown', _this.onEraser);
          }
        }
      };

      this.removeListener = function () {
        _this.canvas.style.touchAction = 'auto';

        _this.canvas.removeEventListener('touchstart', _this.onDrawStart);

        _this.canvas.removeEventListener('touchmove', _this.onDrawMove);

        document.removeEventListener('touchend', _this.onDrawEnd);
        document.removeEventListener('touchcancel', _this.onDrawEnd);

        _this.canvas.removeEventListener('mousedown', _this.onDrawStart);

        _this.canvas.removeEventListener('mousemove', _this.onDrawMove);

        document.removeEventListener('mouseup', _this.onDrawEnd);

        _this.canvas.removeEventListener('touchstart', _this.onEraser);

        _this.canvas.removeEventListener('mousedown', _this.onEraser);
      };

      this.onDrawStart = function (e) {
        e.preventDefault();
        _this.canDraw = true;
        _this.ctx.strokeStyle = _this.color;

        _this.initPoint(e);

        _this.onStart && _this.onStart(e);
      };

      this.onDrawMove = function (e) {
        e.preventDefault();
        if (!_this.canDraw) return;

        _this.initPoint(e);

        if (_this.points.length < 2) return;

        var point = _this.points.slice(-1)[0];

        _this.pointsStrokes.push(point);

        var prePoint = _this.points.slice(-2, -1)[0];

        if (window.requestAnimationFrame) {
          window.requestAnimationFrame(function () {
            return _this.onDraw(prePoint, point);
          });
        } else {
          _this.onDraw(prePoint, point);
        }
      };

      this.onDraw = function (prePoint, point) {
        var color = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _this.color;

        if (_this.openSmooth) {
          _this.drawSmoothLine(prePoint, point, color);
        } else {
          _this.drawNoSmoothLine(prePoint, point, color);
        }
      };

      this.onDrawEnd = function (e) {
        if (!_this.canDraw) return;
        _this.canDraw = false;
        _this.points = [];
        var strokes = {
          orderNo: _this.currOrderNo,
          pointsStrokes: _this.pointsStrokes,
          isShow: true,
          color: _this.color
        };
        _this.currOrderNo++;

        _this.strokesList.push(strokes);

        var doTypeHistory = {
          doType: 1,
          strokes: strokes
        };

        _this.doTypeHistoryList.push(doTypeHistory);

        _this.pointsStrokes = [];
        _this.onEnd && _this.onEnd(e);
      };

      this.onEraser = function (e) {
        _this.onEraserStart && _this.onEraserStart(e);
        e.preventDefault();
        _this.canDraw = false; // 初始化当前位置：

        _this.initPoint(e); // 获取当前位置：


        var point = _this.points.slice(-1)[0]; // 判断笔画是否在当前位置，是的话将笔画移除


        var isEraser = _this.removeStrokesByPoint(point);

        if (isEraser) {
          _this.redrawStrokes();
        } // 清除points


        _this.points = [];
        _this.onEraserEnd && _this.onEraserEnd(e);
      };

      this.getLineWidth = function (speed) {
        var minSpeed = _this.minSpeed > 10 ? 10 : _this.minSpeed < 1 ? 1 : _this.minSpeed;
        var addWidth = (_this.maxWidth - _this.minWidth) * speed / minSpeed;
        var lineWidth = Math.max(_this.maxWidth - addWidth, _this.minWidth);
        return Math.min(lineWidth, _this.maxWidth);
      };

      this.getRadianData = function (x1, y1, x2, y2) {
        var dis_x = x2 - x1;
        var dis_y = y2 - y1;

        if (dis_x === 0) {
          return {
            val: 0,
            pos: -1
          };
        }

        if (dis_y === 0) {
          return {
            val: 0,
            pos: 1
          };
        }

        var val = Math.abs(Math.atan(dis_y / dis_x));

        if (x2 > x1 && y2 < y1 || x2 < x1 && y2 > y1) {
          return {
            val: val,
            pos: 1
          };
        }

        return {
          val: val,
          pos: -1
        };
      };

      this.getRadianPoints = function (radianData, x, y, halfLineWidth) {
        if (radianData.val === 0) {
          if (radianData.pos === 1) {
            return [{
              x: x,
              y: y + halfLineWidth
            }, {
              x: x,
              y: y - halfLineWidth
            }];
          }

          return [{
            y: y,
            x: x + halfLineWidth
          }, {
            y: y,
            x: x - halfLineWidth
          }];
        }

        var dis_x = Math.sin(radianData.val) * halfLineWidth;
        var dis_y = Math.cos(radianData.val) * halfLineWidth;

        if (radianData.pos === 1) {
          return [{
            x: x + dis_x,
            y: y + dis_y
          }, {
            x: x - dis_x,
            y: y - dis_y
          }];
        }

        return [{
          x: x + dis_x,
          y: y - dis_y
        }, {
          x: x - dis_x,
          y: y + dis_y
        }];
      };

      this.initPoint = function (event) {
        var t = Date.now();

        var prePoint = _this.points.slice(-1)[0];

        if (prePoint && prePoint.t === t) {
          return;
        }

        var rect = _this.canvas.getBoundingClientRect();

        var e = event.touches && event.touches[0] || event;
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;

        if (prePoint && prePoint.x === x && prePoint.y === y) {
          return;
        }

        var point = {
          x: x,
          y: y,
          t: t
        };

        if (_this.openSmooth && prePoint) {
          var prePoint2 = _this.points.slice(-2, -1)[0];

          point.distance = Math.sqrt(Math.pow(point.x - prePoint.x, 2) + Math.pow(point.y - prePoint.y, 2));
          point.speed = point.distance / (point.t - prePoint.t || 0.1);
          point.lineWidth = _this.getLineWidth(point.speed);

          if (prePoint2 && prePoint2.lineWidth && prePoint.lineWidth) {
            var rate = (point.lineWidth - prePoint.lineWidth) / prePoint.lineWidth;
            var maxRate = _this.maxWidthDiffRate / 100;
            maxRate = maxRate > 1 ? 1 : maxRate < 0.01 ? 0.01 : maxRate;

            if (Math.abs(rate) > maxRate) {
              var per = rate > 0 ? maxRate : -maxRate;
              point.lineWidth = prePoint.lineWidth * (1 + per);
            }
          }
        }

        _this.points.push(point);

        _this.points = _this.points.slice(-3);
      };

      this.drawSmoothLine = function (prePoint, point) {
        var color = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _this.color;
        var dis_x = point.x - prePoint.x;
        var dis_y = point.y - prePoint.y;

        if (Math.abs(dis_x) + Math.abs(dis_y) <= _this.scale) {
          point.lastX1 = point.lastX2 = prePoint.x + dis_x * 0.5;
          point.lastY1 = point.lastY2 = prePoint.y + dis_y * 0.5;
        } else {
          point.lastX1 = prePoint.x + dis_x * 0.3;
          point.lastY1 = prePoint.y + dis_y * 0.3;
          point.lastX2 = prePoint.x + dis_x * 0.7;
          point.lastY2 = prePoint.y + dis_y * 0.7;
        }

        point.perLineWidth = (prePoint.lineWidth + point.lineWidth) / 2;

        if (typeof prePoint.lastX1 === 'number') {
          _this.drawCurveLine(prePoint.lastX2, prePoint.lastY2, prePoint.x, prePoint.y, point.lastX1, point.lastY1, point.perLineWidth, color);

          if (prePoint.isFirstPoint) return;
          if (prePoint.lastX1 === prePoint.lastX2 && prePoint.lastY1 === prePoint.lastY2) return;

          var data = _this.getRadianData(prePoint.lastX1, prePoint.lastY1, prePoint.lastX2, prePoint.lastY2);

          var points1 = _this.getRadianPoints(data, prePoint.lastX1, prePoint.lastY1, prePoint.perLineWidth / 2);

          var points2 = _this.getRadianPoints(data, prePoint.lastX2, prePoint.lastY2, point.perLineWidth / 2);

          _this.drawTrapezoid(points1[0], points2[0], points2[1], points1[1], color);
        } else {
          point.isFirstPoint = true;
        }
      };

      this.drawNoSmoothLine = function (prePoint, point) {
        var color = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _this.color;
        point.lastX = prePoint.x + (point.x - prePoint.x) * 0.5;
        point.lastY = prePoint.y + (point.y - prePoint.y) * 0.5;

        if (typeof prePoint.lastX === 'number') {
          _this.drawCurveLine(prePoint.lastX, prePoint.lastY, prePoint.x, prePoint.y, point.lastX, point.lastY, _this.maxWidth, color);
        }
      };

      this.drawCurveLine = function (x1, y1, x2, y2, x3, y3, lineWidth) {
        var color = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : _this.color;
        _this.ctx.lineWidth = Number(lineWidth.toFixed(1));

        _this.ctx.beginPath();

        _this.ctx.moveTo(Number(x1.toFixed(1)), Number(y1.toFixed(1)));

        _this.ctx.quadraticCurveTo(Number(x2.toFixed(1)), Number(y2.toFixed(1)), Number(x3.toFixed(1)), Number(y3.toFixed(1)));

        _this.ctx.strokeStyle = color || _this.color;

        _this.ctx.stroke();
      };

      this.drawTrapezoid = function (point1, point2, point3, point4) {
        var color = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : _this.color;

        _this.ctx.beginPath();

        _this.ctx.moveTo(Number(point1.x.toFixed(1)), Number(point1.y.toFixed(1)));

        _this.ctx.lineTo(Number(point2.x.toFixed(1)), Number(point2.y.toFixed(1)));

        _this.ctx.lineTo(Number(point3.x.toFixed(1)), Number(point3.y.toFixed(1)));

        _this.ctx.lineTo(Number(point4.x.toFixed(1)), Number(point4.y.toFixed(1)));

        _this.ctx.fillStyle = color || _this.color;

        _this.ctx.fill();
      };

      this.drawBgColor = function () {
        if (!_this.bgColor) return;
        _this.ctx.fillStyle = _this.bgColor;

        _this.ctx.fillRect(0, 0, _this.width, _this.height);
      };

      this.drawByImageUrl = function (url) {
        var image = new Image();

        image.onload = function () {
          _this.ctx.clearRect(0, 0, _this.width, _this.height);

          _this.ctx.drawImage(image, 0, 0, _this.width, _this.height);
        };

        image.crossOrigin = 'anonymous';
        image.src = url;
      };

      this.clear = function () {
        _this.ctx.clearRect(0, 0, _this.width, _this.height);

        _this.drawBgColor(); // 清屏同时清除痕迹


        _this.pointsStrokes = [];
        _this.strokesList = [];
        _this.doTypeHistoryList = [];
        _this.currOrderNo = 1;

        _this.setDoType(1);
      };

      this.undo = function () {
        // 笔迹列表也要跟着重置
        if (_this.doTypeHistoryList.length > 0) {
          var doTypeHistory = _this.doTypeHistoryList.pop();

          if ((doTypeHistory === null || doTypeHistory === void 0 ? void 0 : doTypeHistory.doType) == 1) {
            // 最后操作是写字，去掉最后一笔
            _this.strokesList.pop();

            _this.currOrderNo--;
          } else if ((doTypeHistory === null || doTypeHistory === void 0 ? void 0 : doTypeHistory.doType) == 0) {
            // 最后操作是橡皮，重新插入到列表中
            doTypeHistory.strokes.isShow = true;
          }

          _this.redrawStrokes();
        }
      };

      this.toDataURL = function () {
        var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'image/png';
        var quality = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

        if (_this.canvas.width === _this.width) {
          return _this.canvas.toDataURL(type, quality);
        }

        var canvas = document.createElement('canvas');
        canvas.width = _this.width;
        canvas.height = _this.height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(_this.canvas, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL(type, quality);
      };

      this.getPNG = function () {
        return _this.toDataURL();
      };

      this.getJPG = function () {
        var quality = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0.8;
        return _this.toDataURL('image/jpeg', quality);
      };

      this.isEmpty = function () {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        canvas.width = _this.canvas.width;
        canvas.height = _this.canvas.height;

        if (_this.bgColor) {
          ctx.fillStyle = _this.bgColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (_this.scale !== 1) {
          ctx.scale(_this.scale, _this.scale);
        }

        return canvas.toDataURL() === _this.canvas.toDataURL();
      };

      this.getRotateCanvas = function () {
        var degree = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 90;

        if (degree > 0) {
          degree = degree > 90 ? 180 : 90;
        } else {
          degree = degree < -90 ? 180 : -90;
        }

        var canvas = document.createElement('canvas');
        var w = _this.width;
        var h = _this.height;

        if (degree === 180) {
          canvas.width = w;
          canvas.height = h;
        } else {
          canvas.width = h;
          canvas.height = w;
        }

        var ctx = canvas.getContext('2d');
        ctx.rotate(degree * Math.PI / 180);

        if (degree === 90) {
          // 顺时针90度
          ctx.drawImage(_this.canvas, 0, -h, w, h);
        } else if (degree === -90) {
          // 逆时针90度
          ctx.drawImage(_this.canvas, -w, 0, w, h);
        } else if (degree === 180) {
          ctx.drawImage(_this.canvas, -w, -h, w, h);
        }

        return canvas;
      };

      this.init(_canvas, options);
    }

    _createClass(SmoothSignature, [{
      key: "init",
      value: // 初始化参数
      function init(canvas) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        if (!canvas) return;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
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
      } // 设置操作类型，1为画笔模式，0为橡皮模式

    }, {
      key: "removeStrokesByPoint",
      value: // 判断笔画是否在当前位置，是的话将笔画移除
      // 一次只擦除一个笔画，后写的先擦
      function removeStrokesByPoint(point) {
        for (var i = this.strokesList.length - 1; i >= 0; i--) {
          var strokes = this.strokesList[i];
          var isEraser = false;

          for (var j = 0; j < strokes.pointsStrokes.length; j++) {
            var tPoint = strokes.pointsStrokes[j]; // 轨迹中的点在选中范围内的，该笔画擦除

            if (tPoint.x >= point.x - this.eraserRange && tPoint.x <= point.x + this.eraserRange && tPoint.y >= point.y - this.eraserRange && tPoint.y <= point.y + this.eraserRange) {
              isEraser = true;
              break;
            } // 选中的点在轨迹两个点之间的，该笔画擦除


            if (j > 0) {
              var tPrePoint = strokes.pointsStrokes[j - 1];

              if ((point.x > tPrePoint.x && point.x < tPoint.x || point.x > tPoint.x && point.x < tPrePoint.x) && (point.y > tPrePoint.y && point.y < tPoint.y || point.y > tPoint.y && point.y < tPrePoint.y)) {
                isEraser = true;
                break;
              }
            }
          }

          if (isEraser) {
            var doTypeHistory = {
              doType: 0,
              strokes: strokes
            };
            this.doTypeHistoryList.push(doTypeHistory);
            strokes.isShow = false;
            return true;
          }
        }

        return false;
      } // 根据历史列表重画

    }, {
      key: "redrawStrokes",
      value: function redrawStrokes() {
        var _this2 = this;

        // 先清屏
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.drawBgColor();
        this.canDraw = true; // 开始重画

        var _loop = function _loop() {
          var strokes = _this2.strokesList[i];

          if (strokes.isShow == false) {
            return "continue";
          }

          for (j = 0; j < strokes.pointsStrokes.length; j++) {
            if (j > 0) {
              (function () {
                var point = strokes.pointsStrokes[j];
                var prePoint = strokes.pointsStrokes[j - 1];

                if (window.requestAnimationFrame) {
                  window.requestAnimationFrame(function () {
                    return _this2.onDraw(prePoint, point, strokes.color);
                  });
                } else {
                  _this2.onDraw(prePoint, point, strokes.color);
                }
              })();
            }
          }
        };

        for (var i = 0; i < this.strokesList.length; i++) {
          var j;

          var _ret = _loop();

          if (_ret === "continue") continue;
        } // 重画结束


        this.canDraw = false;
      } // ==================================== 绘画算法：开始 ==================================== //

    }]);

    return SmoothSignature;
  }();

  return SmoothSignature;

})));
