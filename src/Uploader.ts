import { statSync } from "fs";
import { pathExists, move, outputFile } from "fs-extra";
import path from "path";
import { isArray } from "lodash";
import Koa from "koa";
import axios from "axios";
import { File } from "formidable";
import { single } from "validate.js";

// 上传状态映射表，国际化用户需考虑此处数据的国际化
export enum stateMap {
  SUCCESS = "SUCCESS", // 上传成功标记，在UEditor中内不可改变，否则 flash 判断会出错
  ERROR_TMP_FILE = "临时文件错误",
  ERROR_TMP_FILE_NOT_FOUND = "找不到临时文件",
  ERROR_SIZE_EXCEED = "文件大小超出网站限制",
  ERROR_TYPE_NOT_ALLOWED = "文件类型不允许",
  ERROR_CREATE_DIR = "目录创建失败",
  ERROR_DIR_NOT_WRITEABLE = "目录没有写权限",
  ERROR_FILE_MOVE = "文件保存时出错",
  ERROR_FILE_NOT_FOUND = "找不到上传文件",
  ERROR_WRITE_CONTENT = "写入文件内容错误",
  ERROR_UNKNOWN = "未知错误",
  ERROR_DEAD_LINK = "链接不可用",
  ERROR_HTTP_LINK = "链接不是http链接",
  ERROR_HTTP_CONTENTTYPE = "链接contentType不正确",
  INVALID_URL = "非法 URL",
  INVALID_IP = "非法 IP",
}

class Uploader {
  type: uploadType = "upload"; // 上传类型
  fileField: string = ""; //文件域名
  file: File | null = null; //文件上传对象
  base64: string = ""; //文件上传对象
  config: UploaderConfig | null = null; //配置信息
  oriName: string = ""; //原始文件名
  fileName: string = ""; //新文件名
  fullName: string = ""; //完整文件名,即从当前配置目录开始的URL
  filePath: string = ""; //文件在系统中的完整存储路径
  fileSize: number = 0; //文件大小
  fileType: string = ""; //文件类型
  stateInfo: string = ""; //上传状态信息,
  ctx: Koa.Context | null = null; //  Koa ctx
  staticRoot: string = ""; //  文件存储根目录

  /**
   * @param  ctx Koa ctx
   * @param  staticRoot 文件存储根目录
   * @param  fileField 表单名称
   * @param  config 配置项
   * @param  type 类型，可选值：upload、remote、base64
   */
  constructor(
    ctx: Koa.Context,
    staticRoot: string,
    fileField: string,
    config: UploaderConfig,
    type: uploadType
  ) {
    this.ctx = ctx;
    this.staticRoot = staticRoot;
    this.fileField = fileField;
    this.config = config;
    this.type = type;
  }

  // 替换文件名
  getFullName() {
    const paddingZero = (num: number): string =>
      num < 10 ? "0" + num : num.toString();

    const date = new Date();
    let format = this.config!.pathFormat;
    format = format.replace("{yyyy}", date.getFullYear().toString());
    format = format.replace("{yy}", date.getFullYear().toString().slice(-2));
    format = format.replace("{mm}", paddingZero(date.getMonth() + 1));
    format = format.replace("{dd}", paddingZero(date.getDate()));
    format = format.replace("{hh}", paddingZero(date.getHours()));
    format = format.replace("{ii}", paddingZero(date.getMinutes()));
    format = format.replace("{ss}", paddingZero(date.getSeconds()));
    format = format.replace("{time}", date.getTime().toString());
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
    const files = this.ctx?.request.files?.[this.fileField];
    // 判断请求体中是否包含文件
    if (!files) {
      return Promise.reject(stateMap.ERROR_FILE_NOT_FOUND);
    }
    // 一次上传一个文件 files 是对象，一次上传多个文件时，files 是数组
    const file: File = isArray(files) ? files[0] : files;

    // 判断文件是否存在
    if (!(await pathExists(file.path))) {
      return Promise.reject(stateMap.ERROR_TMP_FILE_NOT_FOUND);
    }

    this.oriName = file.name;
    this.fileSize = file.size;
    this.fileType = path.extname(this.oriName);
    this.fullName = this.getFullName();
    this.filePath = path.join(this.staticRoot, this.fullName);
    this.fileName = path.basename(this.filePath);

    //检查文件大小是否超出限制
    if (this.fileSize > this.config!.maxSize) {
      return Promise.reject(stateMap.ERROR_SIZE_EXCEED);
    }

    //检查是否不允许的文件格式
    if (this.config!.allowFiles!.indexOf(this.fileType) === -1) {
      return Promise.reject(stateMap.ERROR_TYPE_NOT_ALLOWED);
    }

    await move(file.path, this.filePath, { overwrite: true }).catch(() =>
      Promise.reject(stateMap.ERROR_FILE_MOVE)
    );
  }

  /**
   * 拉取远程图片
   */
  async saveRemote() {
    const imgUrl = this.fileField;

    // 检测是否是合法的 URL
    const hasError = single(imgUrl, {
      presence: true,
      url: {
        schemes: ["http", "https"],
        allowLocal: false,
        allowDataUrl: false,
      },
    });

    if (hasError) {
      return Promise.reject(stateMap.INVALID_URL);
    }

    // 检查是否不允许的文件格式
    this.fileType = path.extname(imgUrl);
    if (this.config!.allowFiles!.indexOf(this.fileType) === -1) {
      return Promise.reject(stateMap.ERROR_TYPE_NOT_ALLOWED);
    }

    const { host, origin } = new URL(imgUrl);

    const { data: fileData } = await axios({
      method: "GET",
      url: imgUrl,
      headers: {
        host: host,
        referer: origin, // catchimage 请求里没有复制图片时原网站的 URL，所以遇到一些有做防盗链的图片就无法获取了
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
      },
      responseType: "arraybuffer",
    }).catch(() => {
      return Promise.reject(stateMap.ERROR_DEAD_LINK);
    });
    
    this.fileSize = fileData.length;
    // 检测文件是否超大小
    if (this.fileSize > this.config!.maxSize) {
      return Promise.reject(stateMap.ERROR_SIZE_EXCEED);
    }

    this.oriName = path.basename(imgUrl);
    this.fullName = this.getFullName();
    this.filePath = path.join(this.staticRoot, this.fullName);
    this.fileName = path.basename(this.filePath);
    await outputFile(this.filePath, fileData).catch(() =>
      Promise.reject(stateMap.ERROR_WRITE_CONTENT)
    );
  }

  /**
   * 处理base64编码的图片上传
   */
  async upBase64() {
    const base64Data = this.ctx?.request.body[this.fileField];
    this.oriName = this.config?.oriName!;

    this.fileType = path.extname(this.oriName);
    this.fullName = this.getFullName();
    this.filePath = path.join(this.staticRoot, this.fullName);
    this.fileName = path.basename(this.filePath);

    await outputFile(this.filePath, base64Data, "base64").catch(() =>
      Promise.reject(stateMap.ERROR_WRITE_CONTENT)
    );

    //检查文件大小是否超出限制
    const { size } = statSync(this.filePath);
    this.fileSize = size;
    if (size > this.config!.maxSize) {
      return Promise.reject(stateMap.ERROR_SIZE_EXCEED);
    }
  }

  async upload(): Promise<Result> {
    switch (this.type) {
      case "remote":
        await this.saveRemote()
          .then(() => (this.stateInfo = stateMap.SUCCESS))
          .catch((errorState) => {
            this.stateInfo = errorState || stateMap.ERROR_UNKNOWN;
          });
        break;
      case "base64":
        await this.upBase64()
          .then(() => (this.stateInfo = stateMap.SUCCESS))
          .catch((errorState) => {
            this.stateInfo = errorState || stateMap.ERROR_UNKNOWN;
          });
        break;
      case "upload":
        await this.upFile()
          .then(() => (this.stateInfo = stateMap.SUCCESS))
          .catch((errorState) => {
            this.stateInfo = errorState || stateMap.ERROR_UNKNOWN;
          });
        break;
      default:
        this.stateInfo = stateMap.ERROR_UNKNOWN;
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

export default Uploader;
