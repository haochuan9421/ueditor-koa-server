const fs = require("fs-extra");
const path = require("path");
const { get, isArray } = require("lodash");

class Uploader {
  // 上传状态映射表，国际化用户需考虑此处数据的国际化
  stateMap = {
    SUCCESS: "SUCCESS", // 上传成功标记，在UEditor中内不可改变，否则 flash 判断会出错
    ERROR_TMP_FILE: "临时文件错误",
    ERROR_TMP_FILE_NOT_FOUND: "找不到临时文件",
    ERROR_SIZE_EXCEED: "文件大小超出网站限制",
    ERROR_TYPE_NOT_ALLOWED: "文件类型不允许",
    ERROR_CREATE_DIR: "目录创建失败",
    ERROR_DIR_NOT_WRITEABLE: "目录没有写权限",
    ERROR_FILE_MOVE: "文件保存时出错",
    ERROR_FILE_NOT_FOUND: "找不到上传文件",
    ERROR_WRITE_CONTENT: "写入文件内容错误",
    ERROR_UNKNOWN: "未知错误",
    ERROR_DEAD_LINK: "链接不可用",
    ERROR_HTTP_LINK: "链接不是http链接",
    ERROR_HTTP_CONTENTTYPE: "链接contentType不正确",
    INVALID_URL: "非法 URL",
    INVALID_IP: "非法 IP",
  };

  fileField = null; //文件域名
  file = null; //文件上传对象
  base64 = null; //文件上传对象
  config = null; //配置信息
  oriName = null; //原始文件名
  fileName = null; //新文件名
  fullName = null; //完整文件名,即从当前配置目录开始的URL
  filePath = null; //文件在系统中的完整存储路径
  fileSize = null; //文件大小
  fileType = null; //文件类型
  stateInfo = null; //上传状态信息,
  ctx = null; //  Koa ctx
  staticRoot = null; //  文件存储根目录

  /**
   * @param  ctx Koa ctx
   * @param  staticRoot 文件存储根目录
   * @param  fileField 表单名称
   * @param  config 配置项
   * @param  type 类型，可选值：upload、remote、base64
   */
  constructor(ctx, staticRoot, fileField, config, type = "upload") {
    this.ctx = ctx;
    this.staticRoot = staticRoot;
    this.fileField = fileField;
    this.config = config;
    this.type = type;
  }

  // 替换文件名
  getFullName() {
    const paddingZero = (num) => (num < 10 ? "0" + num : num);

    const date = new Date();
    let format = this.config.pathFormat;
    format = format.replace("{yyyy}", date.getFullYear());
    format = format.replace("{yy}", date.getFullYear().toString().slice(-2));
    format = format.replace("{mm}", paddingZero(date.getMonth() + 1));
    format = format.replace("{dd}", paddingZero(date.getDate()));
    format = format.replace("{hh}", paddingZero(date.getHours()));
    format = format.replace("{ii}", paddingZero(date.getMinutes()));
    format = format.replace("{ss}", paddingZero(date.getSeconds()));
    format = format.replace("{time}", date.getTime());
    format = format.replace(
      "{filename}",
      path.basename(this.oriName, this.fileType)
    );
    format = format.replace(/\{rand:([0-9]+)\}/g, function (_, times) {
      const alphabet = "abcdefghijklmnopqrstuvwxyz";
      let str = "";
      for (let i = 0; i < Number(times); i++) {
        str += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
      }
      return str;
    });

    return `${format}${this.fileType}`;
  }

  /**
   * 上传文件的主处理方法
   */
  async upFile() {
    const files = get(this.ctx, `request.files.${this.fileField}`);
    // 判断请求体中是否包含文件
    if (!files) {
      this.stateInfo = this.stateMap.ERROR_FILE_NOT_FOUND;
      return;
    }
    // 一次上传一个文件 files 是对象，一次上传多个文件时，files 是数组
    const file = isArray(files) ? files[0] : files;

    // 判断文件是否存在
    if (!(await fs.pathExists(file.path))) {
      this.stateInfo = this.stateMap.ERROR_TMP_FILE_NOT_FOUND;
      return;
    }

    this.oriName = file.name;
    this.fileSize = file.size;
    this.fileType = path.extname(file.name);
    this.fullName = this.getFullName();
    this.filePath = path.join(this.staticRoot, this.fullName);
    this.fileName = path.basename(this.filePath);

    //检查文件大小是否超出限制
    if (this.fileSize > this.config.maxSize) {
      this.stateInfo = this.stateMap.ERROR_SIZE_EXCEED;
      return;
    }

    //检查是否不允许的文件格式
    if (this.config.allowFiles.indexOf(this.fileType) === -1) {
      this.stateInfo = this.stateMap.ERROR_TYPE_NOT_ALLOWED;
      return;
    }

    await fs
      .move(file.path, this.filePath, { overwrite: true })
      .catch((err) => {
        this.stateInfo = this.stateMap.ERROR_FILE_MOVE;
      });
  }

  async upload() {
    switch (this.type) {
      case "remote":
        await this.saveRemote();
        this.stateInfo = this.stateMap.SUCCESS;
        break;
      case "base64":
        await this.upBase64();
        this.stateInfo = this.stateMap.SUCCESS;
        break;
      case "upload":
        await this.upFile();
        this.stateInfo = this.stateMap.SUCCESS;
        break;
      default:
        this.stateInfo = this.stateMap.ERROR_TYPE_NOT_ALLOWED;
        break;
    }

    return {
      state: this.stateInfo, //上传状态，上传成功时必须返回"SUCCESS"
      url: this.fullName, // 返回的地址
      title: this.fileName, // 新文件名
      original: this.oriName, // 原始文件名
      type: this.fileType, // 文件类型
      size: this.fileSize, // 文件大小
    };
  }
}

module.exports = Uploader;
