<template>
  <div class="pcDemo">
    <div class="actions">
      <button @click="handlePen">画笔</button>
      <button @click="handleEraser">橡皮</button>
      <button @click="handleClear">清屏</button>
      <button @click="handleUndo">撤销</button>
      <button @click="handlePreview">查看PNG</button>
      <button @click="handleColor">改变颜色</button>
    </div>
    <div class="tip">使用手机端手写更方便</div>
    <canvas />
  </div>
</template>

<script>
export default {
  name: "pcDemo",
  data() {
    return {
      openSmooth: true,
    };
  },
  mounted() {
    this.init();
  },
  methods: {
    init() {
      const canvas = document.querySelector("canvas");
      const options = {
        width: Math.min(window.innerWidth, 1000),
        height: 600,
        minWidth: 1,
        maxWidth: 5,
        // color: '#1890ff',
        bgColor: '#f6f6f6'
      };
      this.signature = new SmoothSignature(canvas, options);
    },
    handlePen() {
      this.signature.setDoType(1);
    },
    handleEraser() {
      this.signature.setDoType(0);
    },
    handleClear() {
      this.signature.clear();
    },
    handleUndo() {
      this.signature.undo();
    },
    handleColor() {
      this.signature.color = '#' + Math.random().toString(16).slice(-6);
    },
    handlePreview() {
      const isEmpty = this.signature.isEmpty();
      if (isEmpty) {
        alert('isEmpty')
        return;
      }
      const pngUrl = this.signature.getPNG();
      window.previewImage(pngUrl);
    }
  },
};
</script>

<style lang="less">
.pcDemo {
  button {
    margin-right: 10px;
    font-size: 18px;
  }
  canvas {
    border: 2px dashed #ccc;
    cursor: crosshair;
  }
  .actions {
    margin: 30px 0;
  }
  .tip {
    color: #108eff;
  }
}
</style>